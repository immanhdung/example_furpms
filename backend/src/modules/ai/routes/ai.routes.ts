import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { semanticSearch } from '../controllers/ai.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered features (Gemini)
 */

/**
 * @swagger
 * /api/ai/semantic-search:
 *   post:
 *     summary: Semantic search across proposals using vector embeddings
 *     tags: [AI]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: nghiên cứu trí tuệ nhân tạo trong giáo dục
 *               limit:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Semantically similar proposals returned
 *       503:
 *         description: Gemini API not configured
 */
router.post('/semantic-search', authenticate, semanticSearch);

export default router;
