import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { httpLogger } from './middlewares/logging.middleware';
import { globalErrorHandler, notFoundHandler } from './middlewares/error.middleware';
import { setupSwagger } from './configs/swagger';

// Module routes
import authRoutes from './modules/auth/routes/auth.routes';
import userRoutes from './modules/users/routes/user.routes';
import cycleRoutes from './modules/cycles/routes/cycle.routes';
import proposalRoutes from './modules/proposals/routes/proposal.routes';
import researchOrderRoutes from './modules/research-orders/routes/researchOrder.routes';
import roundRoutes from './modules/rounds/routes/round.routes';
import councilRoutes from './modules/councils/routes/council.routes';
import councilMemberRoutes from './modules/councils/routes/councilMember.routes';
import meetingRoutes from './modules/meetings/routes/meeting.routes';
import reviewScoringRoutes from './modules/review-scoring/routes/reviewScoring.routes';
import contractRoutes from './modules/contracts/routes/contract.routes';
import disbursementRoutes from './modules/disbursements/routes/disbursement.routes';
import deliverableRoutes from './modules/deliverables/routes/deliverable.routes';
import amendmentRoutes from './modules/amendments/routes/amendment.routes';
import progressReportRoutes from './modules/progress-reports/routes/progressReport.routes';
import finalReportRoutes from './modules/final-reports/routes/finalReport.routes';
import settlementRoutes from './modules/settlements/routes/settlement.routes';
import notificationRoutes from './modules/notifications/routes/notification.routes';
import analyticsRoutes from './modules/analytics/routes/analytics.routes';
import aiRoutes from './modules/ai/routes/ai.routes';
import adminRoutes from './modules/admin/routes/admin.routes';
import masterDataRoutes from './modules/master-data/routes/masterData.routes';
import researchTypeRoutes from './modules/research-types/routes/researchType.routes';

const app = express();

// Trust reverse proxy (Render/Railway) so req.ip and rate-limit keys are real client IPs
app.set('trust proxy', 1);

// Security headers (production-hardened)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

// CORS — allow multiple origins (local dev + Vercel deploy + preview URLs)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      // Allow all Vercel preview deployments
      if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Rate limiting — uses real IP because trust proxy is set
app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
    message: { success: false, message: 'Too many requests. Please try again later.', data: null, errors: null },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
  }),
);

// Parsing & compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
app.use(httpLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'FURPMS API is running.', data: { status: 'healthy' }, errors: null });
});

// Swagger
setupSwagger(app);

// API Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/cycles', cycleRoutes);
apiRouter.use('/proposals', proposalRoutes);
apiRouter.use('/research-orders', researchOrderRoutes);
apiRouter.use('/rounds', roundRoutes);
apiRouter.use('/councils', councilRoutes);
apiRouter.use('/council-members', councilMemberRoutes);
apiRouter.use('/meetings', meetingRoutes);
apiRouter.use('/review-scoring', reviewScoringRoutes);
apiRouter.use('/contracts', contractRoutes);
apiRouter.use('/disbursements', disbursementRoutes);
apiRouter.use('/deliverables', deliverableRoutes);
apiRouter.use('/amendments', amendmentRoutes);
apiRouter.use('/progress-reports', progressReportRoutes);
apiRouter.use('/final-reports', finalReportRoutes);
apiRouter.use('/settlements', settlementRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/research-types', researchTypeRoutes);
apiRouter.use('/', masterDataRoutes);

app.use('/api', apiRouter);

// 404 & error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
