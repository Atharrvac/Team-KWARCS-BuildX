// Simple in-memory rate limiter
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  // Clean up old entries every minute
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.resetTime > 60000) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  // Check if request is allowed
  isAllowed(identifier, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const data = this.requests.get(identifier);

    if (!data) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Reset if window expired
    if (now > data.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Check if limit exceeded
    if (data.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((data.resetTime - now) / 1000),
      };
    }

    // Increment count
    data.count++;
    return { allowed: true, remaining: maxRequests - data.count };
  }
}

const limiter = new RateLimiter();

// Middleware factory
export function createRateLimiter(options = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    message = 'Too many requests, please try again later.',
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = limiter.isAllowed(key, maxRequests, windowMs);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining || 0);

    if (!result.allowed) {
      res.setHeader('X-RateLimit-Reset', result.retryAfter);
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        error: message,
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}

// Preset rate limiters
export const apiLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 100 requests per minute
  message: 'Too many API requests, please try again later.',
});

export const authLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60000, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

export const strictLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 10 requests per minute
  message: 'Rate limit exceeded for this endpoint.',
});

export default limiter;
