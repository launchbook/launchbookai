// Server/middleware/rateLimit.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "🚫 Too many requests. Please wait before trying again."
  }
});

module.exports = limiter;
