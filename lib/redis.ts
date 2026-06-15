import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("REDIS_URL is not defined in environment variables");
}

export const redis = redisUrl ? new Redis(redisUrl) : (null as any);
