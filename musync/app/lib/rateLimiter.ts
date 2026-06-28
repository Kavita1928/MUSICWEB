import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const voting_ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  timeout: 10000,
  prefix: "@upstash/ratelimit",
});

export const queuing_ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1, "60 s"),
  analytics: true,
  timeout: 60000,
  prefix: "@upstash/ratelimit",
});
