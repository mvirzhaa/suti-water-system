import Redis from 'ioredis';
import logger from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  // Retry strategy: jangan crash server jika Redis down
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    logger.warn(`Redis reconnecting... attempt #${times}, next try in ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error(`❌ Redis error: ${err.message}`);
});

export default redis;
