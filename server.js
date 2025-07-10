const express = require('express');
const dotenv = require('dotenv');


const generateRoutes = require('./server/routes/generate');
const regenerateRoutes = require('./server/routes/regenerate');
const coverRoutes = require('./server/routes/cover');
const emailRoutes = require('./server/routes/email');
const imageRoutes = require('./server/routes/image');

dotenv.config();
const app = express();
app.use(express.json());

app.use('/', generateRoutes);
app.use('/', regenerateRoutes);
app.use('/', coverRoutes);
app.use('/', emailRoutes);
app.use('/', imageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
