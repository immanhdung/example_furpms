import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { listCycles, getCycle, createCycle, updateCycle, openCycle, closeCycle } from '../controllers/cycle.controller';
import { listTracks, getTrack, createTrack, updateTrack, assignOwner, deactivateTrack } from '../../tracks/controllers/track.controller';

const router = Router();

// Track routes must come BEFORE /:id to avoid 'tracks' being matched as an ID
router.get('/tracks', authenticate, listTracks);
router.post('/tracks', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createTrack);
router.get('/tracks/:id', authenticate, getTrack);
router.put('/tracks/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateTrack);
router.patch('/tracks/:id/owner', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), assignOwner);
router.patch('/tracks/:id/deactivate', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), deactivateTrack);

// Cycle routes
router.get('/', authenticate, listCycles);
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createCycle);
router.get('/:id', authenticate, getCycle);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateCycle);
router.post('/:id/open', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), openCycle);
router.post('/:id/close', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), closeCycle);

export default router;
