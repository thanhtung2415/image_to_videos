import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { accountRoutes } from './routes/accountRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { contentRoutes } from './routes/contentRoutes.js';
import { creditRoutes } from './routes/creditRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { paymentRoutes } from './routes/paymentRoutes.js';
import { providerRoutes } from './routes/providerRoutes.js';
import { projectRoutes } from './routes/projectRoutes.js';
import { promotionRoutes } from './routes/promotionRoutes.js';
import { pricingRoutes } from './routes/pricingRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { apiRateLimit, authRateLimit, secureHeaders } from './middleware/security.js';
import { requestLogger } from './middleware/requestLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const viteDevPorts = [5173, 5174, 5175, 5176, 5177, 5178, 5179];
const devOrigins = [
  env.frontendUrl,
  ...viteDevPorts.flatMap((port) => [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`
  ])
];
const allowedOrigins = new Set(devOrigins.filter(Boolean));

app.use(requestLogger);
app.use(secureHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(apiRateLimit);
app.use(express.json({ limit: '1mb' }));
app.use('/media', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/health', healthRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/users', userRoutes);

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
    return res.status(400).json({ message: 'Anh vuot qua gioi han upload' });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Du lieu da ton tai' });
  }

  if (
    error.name === 'MongooseServerSelectionError' ||
    error.name === 'MongoNetworkError' ||
    error.message?.includes('Could not connect to any servers')
  ) {
    console.error(error);
    return res.status(503).json({
      message: 'Khong ket noi duoc MongoDB Atlas. Kiem tra IP Access List va khoi dong lai backend.'
    });
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
