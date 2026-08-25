import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase } from '../config/database.js';
import { AuditLog } from '../models/AuditLog.js';
import { ContentReport } from '../models/ContentReport.js';
import { CostEvent } from '../models/CostEvent.js';
import { Coupon } from '../models/Coupon.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { GenerationJob } from '../models/GenerationJob.js';
import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { Payment } from '../models/Payment.js';
import { PaymentEvent } from '../models/PaymentEvent.js';
import { PricingPlan } from '../models/PricingPlan.js';
import { ProviderHealth } from '../models/ProviderHealth.js';
import { Refund } from '../models/Refund.js';
import { User } from '../models/User.js';
import { VideoProject } from '../models/VideoProject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupRoot = path.resolve(__dirname, '../../backups');

const collections = {
  audit_logs: AuditLog,
  content_reports: ContentReport,
  cost_events: CostEvent,
  coupons: Coupon,
  credit_transactions: CreditTransaction,
  generation_jobs: GenerationJob,
  notifications: Notification,
  notification_preferences: NotificationPreference,
  payments: Payment,
  payment_events: PaymentEvent,
  pricing_plans: PricingPlan,
  provider_health: ProviderHealth,
  refunds: Refund,
  users: User,
  video_projects: VideoProject
};

async function backupDatabase() {
  await connectDatabase();
  await fs.mkdir(backupRoot, { recursive: true });

  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const targetDir = path.join(backupRoot, timestamp);
  await fs.mkdir(targetDir, { recursive: true });

  for (const [name, model] of Object.entries(collections)) {
    const documents = await model.find().lean();
    await fs.writeFile(path.join(targetDir, `${name}.json`), JSON.stringify(documents, null, 2));
  }

  console.log(`Backup saved to ${targetDir}`);
  process.exit(0);
}

backupDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});

