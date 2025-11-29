

const rateLimitStore = new Map();

/**
 * Simple rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum requests per window (default: 100)
 * @param {string} options.message - Error message (default: 'Too many requests')
 * @param {Function} options.keyGenerator - Function to generate key from request (default: uses IP)
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use IP address as key, or user ID if authenticated
      return req.user?.id || req.ip || req.connection.remoteAddress;
    }
  } = options;

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      // Create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        ok: false,
        message: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: retryAfter
      });
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': Math.max(0, max - record.count),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
    });

    next();
  };
}


const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Tăng lên 1000 lần login trong 15 phút (gần như không giới hạn)
  message: 'Too many authentication attempts, please try again later'
});


const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later'
});

const strictRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many requests for this operation, please try again later'
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  apiRateLimiter,
  strictRateLimiter
};

