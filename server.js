const express = require('express');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit'); // ✅ Rate limiting module

// ✅ Load environment variables
dotenv.config();

// ✅ Create express app
const app = express();
app.use(express.json());

// ✅ Global rate limiter (30 requests/min per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please slow down.',
});
app.use(limiter); // ✅ Apply limiter to all routes

// ✅ Route imports
const generateRoutes = require('./server/routes/generate');
const regenerateRoutes = require('./server/routes/regenerate');
const coverRoutes = require('./server/routes/cover');
const emailRoutes = require('./server/routes/email');
const imageRoutes = require('./server/routes/image');

// ✅ Mount all routes
app.use('/', generateRoutes);
app.use('/', regenerateRoutes);
app.use('/', coverRoutes);
app.use('/', emailRoutes);
app.use('/', imageRoutes);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
