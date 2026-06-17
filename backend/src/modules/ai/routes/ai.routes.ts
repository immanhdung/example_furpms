import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import {
  getProposalSummary,
  generateProposalSummary,
  editProposalSummary,
  getFinalReportSummary,
  generateFinalReportSummary,
  suggestReviewers,
  getRecommendation,
  semanticSearch,
  getAiAnalytics,
  getAiLogs,
  getCacheStats,
} from '../controllers/ai.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered features using Google Gemini 2.5 Flash
 */

// ── Proposal Summary ────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/proposals/{id}/summary:
 *   get:
 *     summary: Get stored AI summary for a proposal
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 */
router.get('/proposals/:id/summary', authenticate, getProposalSummary);

/**
 * @swagger
 * /api/ai/proposals/{id}/summarize:
 *   post:
 *     summary: Generate AI summary for a proposal using Gemini 2.5 Flash
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               noCache:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Summary generated and stored
 *       503:
 *         description: Gemini API not configured
 */
router.post('/proposals/:id/summarize', authenticate, generateProposalSummary);

/**
 * @swagger
 * /api/ai/proposals/{id}/summary:
 *   patch:
 *     summary: Manually edit the AI-generated proposal summary
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - editedText
 *             properties:
 *               editedText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Summary updated
 */
router.patch('/proposals/:id/summary', authenticate, editProposalSummary);

// ── Final Report Summary ────────────────────────────────────────

/**
 * @swagger
 * /api/ai/final-reports/{id}/summary:
 *   get:
 *     summary: Get stored AI summary for a final report
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.get('/final-reports/:id/summary', authenticate, getFinalReportSummary);

/**
 * @swagger
 * /api/ai/final-reports/{id}/summarize:
 *   post:
 *     summary: Generate AI summary for a final report
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.post('/final-reports/:id/summarize', authenticate, generateFinalReportSummary);

// ── Reviewer Suggestions ────────────────────────────────────────

/**
 * @swagger
 * /api/ai/proposals/{id}/suggest-reviewers:
 *   post:
 *     summary: Get AI-suggested reviewers for a proposal
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               noCache:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Suggested reviewers list
 */
router.post(
  '/proposals/:id/suggest-reviewers',
  authenticate,
  authorize('Admin', 'Staff'),
  suggestReviewers,
);

// ── AI Recommendation ───────────────────────────────────────────

/**
 * @swagger
 * /api/ai/proposals/{id}/recommend:
 *   post:
 *     summary: Get AI recommendation (APPROVE/REVISE/REJECT) for a proposal
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI structured recommendation
 */
router.post(
  '/proposals/:id/recommend',
  authenticate,
  authorize('Admin', 'Staff', 'ReviewCommittee'),
  getRecommendation,
);

// ── Semantic Search ─────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/semantic-search:
 *   post:
 *     summary: Semantic search across proposals using MongoDB Atlas Vector Search
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: nghiên cứu trí tuệ nhân tạo trong giáo dục
 *               limit:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Semantically similar proposals
 */
router.post('/semantic-search', authenticate, semanticSearch);

// ── Analytics & Logs ────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/analytics:
 *   get:
 *     summary: AI usage analytics (Admin/Staff only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 */
router.get('/analytics', authenticate, authorize('Admin', 'Staff'), getAiAnalytics);

/**
 * @swagger
 * /api/ai/logs:
 *   get:
 *     summary: AI request logs (Admin/Staff only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.get('/logs', authenticate, authorize('Admin', 'Staff'), getAiLogs);

/**
 * @swagger
 * /api/ai/cache/stats:
 *   get:
 *     summary: AI response cache statistics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cache/stats', authenticate, authorize('Admin', 'Staff'), getCacheStats);

export default router;
