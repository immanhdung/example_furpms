import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  getProfile,
  updateProfile,
} from '../controllers/user.controller';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users retrieved
 */
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), listUsers);

router.get('/:id', authenticate, getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, authorize(ROLES.ADMIN), createUser);

router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateUser);

// Academic profile
router.get('/:userId/profile', authenticate, getProfile);
router.put('/:userId/profile', authenticate, updateProfile);

export default router;
