import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from './logger';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

export const initGemini = (): void => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not configured — AI features will be unavailable');
    return;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  logger.info('Gemini AI initialized');
};

export const getGeminiModel = (): GenerativeModel => {
  if (!model) throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
  return model;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!genAI) throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
  const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
};
