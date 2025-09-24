const rateLimiter = require("./rateLimiter");

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login/signup attempts, please try again later.",
});

module.exports = { apiLimiter, authLimiter };
