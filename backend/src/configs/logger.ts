import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || 'logs';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  errors({ stack: true }),
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, stack }) => `${ts} [${level}]: ${stack || message}`),
);

// Production: structured JSON for Railway log aggregation
const prodFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json(),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? prodFormat : devFormat,
  }),
];

// File transports only in development (Railway uses ephemeral filesystem)
if (!isProduction) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  format: isProduction ? prodFormat : devFormat,
  transports,
  exitOnError: false,
});
