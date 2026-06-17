import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { z } from 'zod';
import { setSystemClockOffset, getSystemClockOffset, runDeadlineScan } from '../services/deadlineScan.service';

const router = Router();

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

router.post('/run-deadline-scan', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (_req, res) => {
  const result = await runDeadlineScan();
  sendSuccess(res, result, 'Deadline scan completed.');
}));

export default router;
