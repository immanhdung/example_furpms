import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { uploadExcel } from '../../../middlewares/upload.middleware';
import { ROLES } from '../../../constants/roles';
import {
  listCycles, getCycle, createCycle, configureCycle, updateCycle, openCycle, closeCycle,
} from '../controllers/cycle.controller';
import {
  listTracksForCycle, createTrackForCycle,
} from '../../tracks/controllers/track.controller';
import {
  listAppliedTopics, importAppliedTopics, deleteAppliedTopic,
} from '../../applied-topics/controllers/appliedTopic.controller';

const router = Router();

// ── Cycle-scoped track routes ─────────────────────────────────────────────
router.get('/:cycleId/tracks', authenticate, listTracksForCycle);
router.post('/:cycleId/tracks', authenticate, authorize(ROLES.STAFF), createTrackForCycle);

// ── Applied topic routes (nested under cycle) ─────────────────────────────
router.get('/:cycleId/applied-topics', authenticate, listAppliedTopics);
router.post('/:cycleId/applied-topics/import', authenticate, authorize(ROLES.STAFF), uploadExcel, importAppliedTopics);
router.delete('/:cycleId/applied-topics/:topicId', authenticate, authorize(ROLES.STAFF), deleteAppliedTopic);

// ── Cycle CRUD ────────────────────────────────────────────────────────────
router.get('/', authenticate, listCycles);
router.post('/', authenticate, authorize(ROLES.ADMIN), createCycle);

router.get('/:id', authenticate, getCycle);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateCycle);
router.patch('/:id/configure', authenticate, authorize(ROLES.STAFF), configureCycle);
router.post('/:id/open', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), openCycle);
router.post('/:id/close', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), closeCycle);

export default router;
