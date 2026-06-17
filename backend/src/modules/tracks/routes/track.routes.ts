import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { listTracks, getTrack, createTrack, updateTrack, assignOwner, deactivateTrack } from '../controllers/track.controller';

const router = Router();

router.get('/', authenticate, listTracks);
router.get('/:id', authenticate, getTrack);
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createTrack);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateTrack);
router.patch('/:id/owner', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), assignOwner);
router.patch('/:id/deactivate', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), deactivateTrack);

export default router;
