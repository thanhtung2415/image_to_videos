import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export const secureHeaders = helmet({
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

