import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import {
  listResearchTypes, getResearchType, createResearchType, updateResearchType, deleteResearchType,
} from '../controllers/researchType.controller';
import {
  listAppliedTopics, importAppliedTopics, deleteAppliedTopic,
} from '../../applied-topics/controllers/appliedTopic.controller';
import { uploadExcel } from '../../../middlewares/upload.middleware';

const router = Router();

router.get('/', authenticate, listResearchTypes);
router.post('/', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), createResearchType);
router.get('/:id', authenticate, getResearchType);
router.put('/:id', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), updateResearchType);
router.delete('/:id', authenticate, authorize(ROLES.STAFF, ROLES.ADMIN), deleteResearchType);

// Nested topic routes
router.get('/:researchTypeId/topics', authenticate, listAppliedTopics);
router.post(
  '/:researchTypeId/topics/import',
  authenticate,
  authorize(ROLES.STAFF, ROLES.ADMIN),
  uploadExcel,
  importAppliedTopics,
);
router.delete(
  '/:researchTypeId/topics/:topicId',
  authenticate,
  authorize(ROLES.STAFF, ROLES.ADMIN),
  deleteAppliedTopic,
);

export default router;
