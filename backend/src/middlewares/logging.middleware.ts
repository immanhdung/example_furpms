import morgan from 'morgan';
import { StreamOptions } from 'morgan';
import { logger } from '../configs/logger';

const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

const skip = (): boolean => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

export const httpLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip },
);
