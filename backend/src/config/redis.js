/**
 * Redis client configuration.
 * Used for token blacklist, bike location cache, and dashboard cache.
 */
const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});

module.exports = redis;
