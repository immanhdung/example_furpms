import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { listCycles, getCycle, createCycle, updateCycle, openCycle, closeCycle } from '../controllers/cycle.controller';
import { listTracks, getTrack, createTrack, updateTrack, assignOwner, deactivateTrack } from '../../tracks/controllers/track.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Cycles
 *     description: Research cycle management
 *   - name: Tracks
 *     description: Research track management
 */

/**
 * @swagger
 * /api/cycles/tracks:
 *   get:
 *     summary: List all tracks
 *     tags: [Tracks]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tracks retrieved
 */
router.get('/tracks', authenticate, listTracks);

/**
 * @swagger
 * /api/cycles/tracks:
 *   post:
 *     summary: Create a new track
 *     tags: [Tracks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string, example: CNTT }
 *               name: { type: string, example: Công nghệ thông tin }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Track created
 */
router.post('/tracks', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createTrack);

/**
 * @swagger
 * /api/cycles/tracks/{id}:
 *   get:
 *     summary: Get track by ID
 *     tags: [Tracks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Track retrieved
 *   put:
 *     summary: Update track
 *     tags: [Tracks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Track updated
 */
router.get('/tracks/:id', authenticate, getTrack);
router.put('/tracks/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateTrack);

/**
 * @swagger
 * /api/cycles/tracks/{id}/owner:
 *   patch:
 *     summary: Assign track owner
 *     tags: [Tracks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ownerId]
 *             properties:
 *               ownerId: { type: string }
 *     responses:
 *       200:
 *         description: Owner assigned
 */
router.patch('/tracks/:id/owner', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), assignOwner);

/**
 * @swagger
 * /api/cycles/tracks/{id}/deactivate:
 *   patch:
 *     summary: Deactivate track
 *     tags: [Tracks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Track deactivated
 */
router.patch('/tracks/:id/deactivate', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), deactivateTrack);

/**
 * @swagger
 * /api/cycles:
 *   get:
 *     summary: List all cycles
 *     tags: [Cycles]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, OPEN, CLOSED] }
 *     responses:
 *       200:
 *         description: Cycles retrieved
 *   post:
 *     summary: Create a new research cycle
 *     tags: [Cycles]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, year]
 *             properties:
 *               name: { type: string, example: "Chu kỳ nghiên cứu 2026" }
 *               year: { type: integer, example: 2026 }
 *               trackId: { type: string }
 *               submissionDeadline: { type: string, format: date-time }
 *               reviewDeadline: { type: string, format: date-time }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Cycle created
 */
router.get('/', authenticate, listCycles);
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createCycle);

/**
 * @swagger
 * /api/cycles/{id}:
 *   get:
 *     summary: Get cycle by ID
 *     tags: [Cycles]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cycle retrieved
 *   put:
 *     summary: Update cycle
 *     tags: [Cycles]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               submissionDeadline: { type: string, format: date-time }
 *               reviewDeadline: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Cycle updated
 */
router.get('/:id', authenticate, getCycle);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateCycle);

/**
 * @swagger
 * /api/cycles/{id}/open:
 *   post:
 *     summary: Open cycle for submissions
 *     tags: [Cycles]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cycle opened
 */
router.post('/:id/open', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), openCycle);

/**
 * @swagger
 * /api/cycles/{id}/close:
 *   post:
 *     summary: Close cycle
 *     tags: [Cycles]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cycle closed
 */
router.post('/:id/close', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), closeCycle);

export default router;
