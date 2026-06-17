import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../../configs/logger';
import { aiCacheRepository } from '../repositories/aiCache.repository';
import { AiLog, AiFeature } from '../models/aiLog.model';
import mongoose from 'mongoose';

const GEMINI_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'text-embedding-004';
const MAX_RETRIES = 3;

export interface GenerateOptions {
  feature: AiFeature;
  entityId?: string;
  entityType?: string;
  userId: string;
  noCache?: boolean;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  durationMs: number;
  cached: boolean;
  model: string;
}

function getCacheKey(feature: string, prompt: string): string {
  return crypto.createHash('sha256').update(`${feature}:${prompt}`).digest('hex');
}

async function withRetry<T>(fn: () => Promise<T>, label = 'Gemini call'): Promise<T> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      const delay = 1000 * Math.pow(2, attempt);
      logger.warn(
        `${label} attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastErr.message}. Retrying in ${delay}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr!;
}

interface LogData {
  feature: AiFeature;
  entityId?: string;
  entityType?: string;
  userId: string;
  prompt: string;
  response: string;
  aiModel: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  durationMs: number;
  cached: boolean;
  error?: string;
}

async function saveLog(data: LogData) {
  try {
    await AiLog.create({
      feature: data.feature,
      entityId: data.entityId ? new mongoose.Types.ObjectId(data.entityId) : undefined,
      entityType: data.entityType,
      userId: new mongoose.Types.ObjectId(data.userId),
      prompt: data.prompt.slice(0, 8000),
      response: data.response.slice(0, 16000),
      aiModel: data.aiModel,
      tokensInput: data.tokensInput,
      tokensOutput: data.tokensOutput,
      tokensTotal: data.tokensTotal,
      durationMs: data.durationMs,
      cached: data.cached,
      error: data.error,
    });
  } catch (e) {
    logger.error('Failed to save AI log', e);
  }
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  initialize(apiKey: string): void {
    if (!apiKey) {
      logger.warn('GeminiService: no API key provided — AI features disabled');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    logger.info(`GeminiService ready — model: ${GEMINI_MODEL}`);
  }

  private client(): GoogleGenerativeAI {
    if (!this.genAI) throw new Error('Gemini AI not initialized. Set GEMINI_API_KEY.');
    return this.genAI;
  }

  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    const cacheKey = getCacheKey(options.feature, prompt);

    if (!options.noCache) {
      const cached = await aiCacheRepository.get(cacheKey);
      if (cached) {
        await saveLog({
          ...options,
          prompt,
          response: cached,
          aiModel: GEMINI_MODEL,
          tokensInput: 0,
          tokensOutput: 0,
          tokensTotal: 0,
          durationMs: 0,
          cached: true,
        });
        return {
          text: cached,
          tokensInput: 0,
          tokensOutput: 0,
          tokensTotal: 0,
          durationMs: 0,
          cached: true,
          model: GEMINI_MODEL,
        };
      }
    }

    const startMs = Date.now();
    let text = '';
    let tokensInput = 0;
    let tokensOutput = 0;
    let tokensTotal = 0;

    try {
      const model = this.client().getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: 2048,
        },
      });

      const result = await withRetry(
        () => model.generateContent(prompt),
        `${options.feature} generation`,
      );

      text = result.response.text();
      const usage = result.response.usageMetadata;
      tokensInput = usage?.promptTokenCount ?? 0;
      tokensOutput = usage?.candidatesTokenCount ?? 0;
      tokensTotal = usage?.totalTokenCount ?? tokensInput + tokensOutput;
    } catch (err) {
      const error = err as Error;
      await saveLog({
        ...options,
        prompt,
        response: '',
        aiModel: GEMINI_MODEL,
        tokensInput: 0,
        tokensOutput: 0,
        tokensTotal: 0,
        durationMs: Date.now() - startMs,
        cached: false,
        error: error.message,
      });
      throw error;
    }

    const durationMs = Date.now() - startMs;

    await aiCacheRepository.set(cacheKey, options.feature, text, tokensTotal);
    await saveLog({
      ...options,
      prompt,
      response: text,
      aiModel: GEMINI_MODEL,
      tokensInput,
      tokensOutput,
      tokensTotal,
      durationMs,
      cached: false,
    });

    return {
      text,
      tokensInput,
      tokensOutput,
      tokensTotal,
      durationMs,
      cached: false,
      model: GEMINI_MODEL,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return withRetry(async () => {
      const model = this.client().getGenerativeModel({ model: EMBEDDING_MODEL });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }, 'Embedding generation');
  }
}

export const geminiService = new GeminiService();
