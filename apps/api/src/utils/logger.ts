import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

// Format untuk development (console yang mudah dibaca)
const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack ?? message}`;
});

// Format untuk production (JSON terstruktur untuk log aggregation)
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const isDev = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev
    ? combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        devFormat
      )
    : prodFormat,
  transports: [
    new winston.transports.Console(),
    // File transport untuk production
    ...(!isDev
      ? [
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
          }),
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
          }),
        ]
      : []),
  ],
  // Jangan crash jika ada uncaught exception saat logging
  exitOnError: false,
});

export default logger;
