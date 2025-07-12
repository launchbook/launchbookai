// Root: server.js

const express = require('express');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const rateLimiter = require('./Server/middleware/rateLimit'); // 🔒 Custom limiter for sensitive routes

// ✅ Load environment variables
dotenv.config();

// ✅ Create Express app
const app = express();
app.use(express.json());

// ✅ Global fallback rate limiter (30 req/min/IP)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: '🚫 Too many requests. Please slow down.',
});
app.use(globalLimiter);

// ✅ Import routes
const generateRoutes = require('./Server/routes/generate');
const regenerateRoutes = require('./Server/routes/regenerate');
const coverRoutes = require('./Server/routes/cover');
const emailRoutes = require('./Server/routes/email');
const imageRoutes = require('./Server/routes/image');

// ✅ Mount routes with custom limiter on sensitive ones
app.use('/generate', rateLimiter, generateRoutes);
app.use('/regenerate-cover-image', rateLimiter, regenerateRoutes);
app.use('/regenerate-image', rateLimiter, regenerateRoutes);
app.use('/regenerate-text-block', rateLimiter, regenerateRoutes);
app.use('/send-ebook-email', rateLimiter, emailRoutes);
app.use('/generate-cover', rateLimiter, coverRoutes);
app.use('/ai-image', rateLimiter, imageRoutes);

// ✅ Catch-All Route (Optional)
// app.use('*', (req, res) => res.status(404).json({ error: 'Not Found' }));

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LaunchBook AI backend running on http://localhost:${PORT}`);
});
