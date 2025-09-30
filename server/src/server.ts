import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { importRouter } from './routes/import.js';
import { gpaRouter } from './routes/gpa.js';
import { exportRouter } from './routes/export.js';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: config.origin }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.use('/api/health', healthRouter);
app.use('/api/import', importRouter);
app.use('/api/gpa', gpaRouter);
app.use('/api/export', exportRouter);

app.listen(config.port, () => console.log(`API on :${config.port}`));
