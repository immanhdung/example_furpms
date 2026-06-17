import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { z } from 'zod';
import { setSystemClockOffset, getSystemClockOffset, runDeadlineScan } from '../services/deadlineScan.service';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: System administration (Admin only)
 */

/**
 * @swagger
 * /api/admin/system-clock:
 *   get:
 *     summary: Get current system clock offset (for testing deadline logic)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: System clock info retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentSystemDate: { type: string, format: date-time }
 *                 offsetDays: { type: integer }
 *                 realDate: { type: string, format: date-time }
 *   post:
 *     summary: Set system clock offset (for testing only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offsetDays]
 *             properties:
 *               offsetDays:
 *                 type: integer
 *                 example: 30
 *                 description: Days to shift the system date forward (positive) or backward (negative)
 *     responses:
 *       200:
 *         description: Clock offset updated
 */
router.get('/system-clock', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (_req, res) => {
  const offsetDays = getSystemClockOffset();
  const systemDate = new Date();
  systemDate.setDate(systemDate.getDate() + offsetDays);
  sendSuccess(res, {
    currentSystemDate: systemDate,
    offsetDays,
    realDate: new Date(),
  }, 'System clock retrieved.');
}));

router.post('/system-clock', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { offsetDays } = z.object({ offsetDays: z.number().int() }).parse(req.body);
  setSystemClockOffset(offsetDays);
  const systemDate = new Date();
  systemDate.setDate(systemDate.getDate() + offsetDays);
  sendSuccess(res, { offsetDays, systemDate }, 'System clock offset updated.');
}));

/**
 * @swagger
 * /api/admin/run-deadline-scan:
 *   post:
 *     summary: Manually trigger deadline scan job
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Deadline scan completed
 */
router.post('/run-deadline-scan', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (_req, res) => {
  const result = await runDeadlineScan();
  sendSuccess(res, result, 'Deadline scan completed.');
}));

export default router;
