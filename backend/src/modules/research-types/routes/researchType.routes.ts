import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import {
  listResearchTypes, getResearchType, createResearchType, updateResearchType, deleteResearchType,
} from '../controllers/researchType.controller';

const router = Router();

router.get('/', authenticate, listResearchTypes);
router.post('/', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), createResearchType);
router.get('/:id', authenticate, getResearchType);
router.put('/:id', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), updateResearchType);
router.delete('/:id', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), deleteResearchType);

export default router;
