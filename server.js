// ✅ 1. server.js (bootstraps everything)
import express from 'express';
import dotenv from 'dotenv';
import generateRoutes from './server/routes/generate.js';
import regenerateRoutes from './server/routes/regenerate.js';
import coverRoutes from './server/routes/cover.js';
import emailRoutes from './server/routes/email.js';
import imageRoutes from './server/routes/image.js';
import regenerateRoutes from './server/routes/regenerate.js';
import coverRoutes from './server/routes/cover.js';
import emailRoutes from './server/routes/email.js';
import imageRoutes from './server/routes/image.js';


dotenv.config();
const app = express();
app.use(express.json());

// Mount routes
app.use('/', generateRoutes);
app.use('/', regenerateRoutes);
app.use('/', coverRoutes);
app.use('/', emailRoutes);
app.use('/', imageRoutes);
app.use(regenerateRoutes);
app.use(coverRoutes);
app.use(emailRoutes);
app.use(imageRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\uD83D\uDE80 Server running on port ${PORT}`));
