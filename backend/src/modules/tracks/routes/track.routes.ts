import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { listTracks, getTrack, createTrack, updateTrack, assignOwner, deactivateTrack } from '../controllers/track.controller';

const router = Router();

/**
 * @swagger
 * /api/tracks:
 *   get:
 *     summary: List all tracks
 *     tags: [Tracks]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tracks retrieved
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
 *               code: { type: string }
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Track created
 */
router.get('/', authenticate, listTracks);
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createTrack);

/**
 * @swagger
 * /api/tracks/{id}:
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
router.get('/:id', authenticate, getTrack);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateTrack);

/**
 * @swagger
 * /api/tracks/{id}/owner:
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
router.patch('/:id/owner', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), assignOwner);

/**
 * @swagger
 * /api/tracks/{id}/deactivate:
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
router.patch('/:id/deactivate', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), deactivateTrack);

export default router;
