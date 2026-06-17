import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from './logger';

let genAI: GoogleGenerativeAI | null = null;

export const initGemini = (): void => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not configured — AI features will be unavailable');
    return;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  logger.info('Gemini AI initialized (gemini-2.5-flash + text-embedding-004)');
};

export const getGeminiClient = (): GoogleGenerativeAI => {
  if (!genAI) throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
  return genAI;
};

/** @deprecated Use geminiService.generate() instead */
export const getGeminiModel = (): GenerativeModel => {
  if (!genAI) throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

/** @deprecated Use geminiService.generateEmbedding() instead */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!genAI) throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
  const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
};
