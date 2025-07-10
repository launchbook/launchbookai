// server.js
import express from 'express';
import dotenv from 'dotenv';
import generateRoutes from './server/routes/generate.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use('/', generateRoutes); // ⬅️ Mount the routes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
