import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { authRoutes } from './routes/authRoutes.js';
import { creditRoutes } from './routes/creditRoutes.js';
import { paymentRoutes } from './routes/paymentRoutes.js';
import { providerRoutes } from './routes/providerRoutes.js';
import { projectRoutes } from './routes/projectRoutes.js';
import { pricingRoutes } from './routes/pricingRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/media', express.static(path.resolve(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'image-to-videos-api',
    mode: env.nodeEnv
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/projects', projectRoutes);

app.use((error, req, res, next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Du lieu khong hop le',
      issues: error.issues
    });
  }

  if (error.message === 'Chi ho tro JPG, PNG hoac WEBP') {
    return res.status(400).json({ message: error.message });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Anh toi da 5MB' });
  }

  console.error(error);
  res.status(500).json({ message: 'Loi may chu' });
});

connectDatabase()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Cannot connect database', error);
    process.exit(1);
  });
