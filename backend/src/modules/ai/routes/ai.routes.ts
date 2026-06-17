import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { semanticSearch } from '../controllers/ai.controller';

const router = Router();

// POST /api/ai/semantic-search
router.post('/semantic-search', authenticate, semanticSearch);

export default router;
