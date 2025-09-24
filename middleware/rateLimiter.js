const RateLimit = require("../model/rateLimit/rateLimit");

function rateLimiter({ windowMs, max, message }) {
  return async (req, res, next) => {
    try {
      const key = req.ip; // or req.user.id if logged in
      const now = new Date();
      const expireTime = new Date(now.getTime() + windowMs);

      let record = await RateLimit.findByPk(key);

      if (!record) {
        await RateLimit.create({ key, points: 1, expire: expireTime });
        res.set({
          "X-RateLimit-Limit": max,
          "X-RateLimit-Remaining": max - 1,
          "Retry-After": Math.ceil(windowMs / 1000),
        });
        return next();
      }

      if (record.expire < now) {
        // Window expired → reset
        record.points = 1;
        record.expire = expireTime;
        await record.save();
        res.set({
          "X-RateLimit-Limit": max,
          "X-RateLimit-Remaining": max - 1,
          "Retry-After": Math.ceil(windowMs / 1000),
        });
        return next();
      }

      if (record.points >= max) {
        // Block request
        res.set({
          "X-RateLimit-Limit": max,
          "X-RateLimit-Remaining": 0,
          "Retry-After": Math.ceil((record.expire - now) / 1000),
        });
        return res.status(429).json({
          success: false,
          message,
        });
      }

      record.points += 1;
      await record.save();

      res.set({
        "X-RateLimit-Limit": max,
        "X-RateLimit-Remaining": max - record.points,
        "Retry-After": Math.ceil((record.expire - now) / 1000),
      });

      next();
    } catch (err) {
      console.error("Rate limiter error:", err);
      next(); // if DB fails, allow request
    }
  };
}

module.exports = rateLimiter;
