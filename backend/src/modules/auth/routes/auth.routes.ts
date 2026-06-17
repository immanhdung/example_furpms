import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { login, getMe, changePassword, refreshTokens, logout } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/refresh-token', refreshTokens);
router.post('/logout', authenticate, logout);

export default router;
