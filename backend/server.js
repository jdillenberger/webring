import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';

import participantsRouter from './routes/participants.js';
import applicationsRouter from './routes/applications.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/participants', participantsRouter);
app.use('/api', participantsRouter); // Also mount at /api for /api/next, /api/prev, etc.
app.use('/api/applications', applicationsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Webring API running on http://localhost:${PORT}`);
  console.log(`Using ${process.env.USE_LOCAL_DATA === 'true' ? 'local' : 'GitHub'} data storage`);
});
