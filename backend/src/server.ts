import 'dotenv/config';
import app from './app';
import { connectDatabase } from './configs/database';
import { initCloudinary } from './configs/cloudinary';
import { initGemini } from './configs/gemini';
import { logger } from './configs/logger';
import { startDeadlineScanJob } from './modules/admin/services/deadlineScan.service';
import { geminiService } from './modules/ai/services/gemini.service';

const PORT = parseInt(process.env.PORT || '5068', 10);

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
    initCloudinary();
    initGemini();
    geminiService.initialize(process.env.GEMINI_API_KEY || '');

    const server = app.listen(PORT, () => {
      logger.info(`FURPMS API server running on http://localhost:${PORT}`);
      logger.info(`Swagger docs available at http://localhost:${PORT}/swagger`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start background deadline scan (every hour)
    startDeadlineScanJob();

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

bootstrap();
