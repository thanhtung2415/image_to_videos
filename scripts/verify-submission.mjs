import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const trackedFiles = execFileSync('git', ['ls-files'], {
  cwd: root,
  encoding: 'utf8'
})
  .split(/\r?\n/)
  .filter(Boolean);

const requiredFiles = [
  'apps/backend/src/routes/authRoutes.js',
  'apps/backend/src/routes/userRoutes.js',
  'apps/backend/src/routes/projectRoutes.js',
  'apps/backend/src/routes/adminRoutes.js',
  'apps/backend/src/services/creditService.js',
  'apps/backend/src/services/paymentService.js',
  'apps/backend/src/services/promotionService.js',
  'apps/backend/src/services/settingService.js',
  'apps/backend/src/worker.js',
  'apps/frontend/src/main.jsx',
  'docs/ARCHITECTURE.md',
  'docs/DATABASE_DESIGN.md',
  'docs/API_DOCUMENTATION.md',
  'docs/INSTALLATION.md',
  'docs/USER_GUIDE.md',
  'docs/DEMO_ACCOUNTS.md',
  'docs/PROJECT_REPORT.md',
  'docs/REQUIREMENTS_TRACEABILITY.md',
  'docs/ACCEPTANCE_TESTS.md'
];

for (const requiredFile of requiredFiles) {
  assert(fileExists(requiredFile), `required file exists: ${requiredFile}`);
}

const forbiddenTracked = trackedFiles.filter((file) => (
  file.endsWith('.env')
  || file.includes('internal_docs/')
  || file.includes('SRS')
  || file.includes('node_modules/')
  || file.includes('/dist/')
  || file.includes('/uploads/')
  || file.includes('/backups/')
));

assert(forbiddenTracked.length === 0, 'no .env, SRS, node_modules, dist, uploads or backups are tracked');

const userModel = read('apps/backend/src/models/User.js');
assert(userModel.includes('default: 0'), 'user credit wallet defaults to 0');
assert(userModel.includes("enum: ['user', 'admin']"), 'user roles are user/admin');
assert(userModel.includes("enum: ['active', 'locked', 'deleted']"), 'user status supports active/locked/deleted');

const authRoutes = read('apps/backend/src/routes/authRoutes.js');
assert(authRoutes.includes("role: 'user'"), 'public register always creates normal user');
assert(authRoutes.includes('bcrypt.hash'), 'password hashing is used');
assert(authRoutes.includes('bcrypt.compare'), 'login verifies hashed password');

const userRoutes = read('apps/backend/src/routes/userRoutes.js');
assert(userRoutes.includes("get('/me'"), 'profile API GET /api/users/me exists');
assert(userRoutes.includes("patch('/me'"), 'profile API PATCH /api/users/me exists');
assert(userRoutes.includes("patch('/me/password'"), 'password change API exists');

const adminRoutes = read('apps/backend/src/routes/adminRoutes.js');
const adminPatterns = [
  "adminRoutes.use(requireAuth, requireAdmin)",
  "get('/users'",
  "get('/users/:id'",
  "patch('/users/:id'",
  "patch('/users/:id/status'",
  "post('/users/:id/credits/adjust'",
  "get('/credit-transactions'",
  "get('/videos'",
  "get('/videos/:id'",
  "get('/reports/overview'",
  "get('/settings'",
  "patch('/settings'",
  "get('/credit-packages'",
  "post('/credit-packages'",
  "patch('/credit-packages/:id'",
  "patch('/credit-packages/:id/status'",
  "get('/payments'",
  "get('/promotions'",
  "post('/promotions'",
  "get('/promotions/:id'",
  "patch('/promotions/:id'",
  "patch('/promotions/:id/status'",
  "get('/promotions/:id/registrations'"
];

for (const pattern of adminPatterns) {
  assert(adminRoutes.includes(pattern), `admin route contains ${pattern}`);
}

const creditService = read('apps/backend/src/services/creditService.js');
for (const transactionType of ['purchase', 'reserve', 'capture', 'release', 'refund', 'manual_adjustment', 'promotion_bonus']) {
  assert(creditService.includes(transactionType), `credit transaction type supported: ${transactionType}`);
}
assert(creditService.includes('transactionExists(idempotencyKey)'), 'credit operations check idempotency before wallet updates');
assert(creditService.includes("'creditWallet.availableCredit': { $gte:"), 'credit deductions guard against negative balance');

const projectRoutes = read('apps/backend/src/routes/projectRoutes.js');
assert(projectRoutes.includes("z.enum(['1280x720', '720x1280', '1024x1024'])"), 'video aspect/resolution options are validated');
assert(projectRoutes.includes('reserveCredits'), 'video creation reserves credits');
assert(projectRoutes.includes('releaseReservedCredits'), 'video enqueue/cancel failure releases credits');
assert(projectRoutes.includes('getSystemSettings'), 'upload limit is read from system settings');

const jobRunner = read('apps/backend/src/services/jobRunner.js');
assert(jobRunner.includes('createVideoFromImage'), 'FFmpeg generation is wired');
assert(jobRunner.includes('getProvider'), 'AI provider generation is wired');
assert(jobRunner.includes('uploadVideo') && jobRunner.includes('uploadRemoteVideo'), 'video output upload is wired');
assert(jobRunner.includes('captureReservedCredits'), 'successful generation captures reserved credits');
assert(jobRunner.includes('releaseReservedCredits'), 'failed generation releases reserved credits');

const promotionModel = read('apps/backend/src/models/Promotion.js');
const promotionRegistrationModel = read('apps/backend/src/models/PromotionRegistration.js');
for (const field of ['name', 'code', 'description', 'bonusCredit', 'maxRegistrations', 'currentRegistrations', 'conditions', 'createdBy']) {
  assert(promotionModel.includes(field), `promotion field exists: ${field}`);
}
assert(promotionRegistrationModel.includes('promotionRegistrationSchema.index({ user: 1, promotion: 1 }, { unique: true })'), 'promotion registration has unique user+promotion index');

const frontend = read('apps/frontend/src/main.jsx');
for (const label of [
  'My Profile',
  'User management',
  'Adjust credit',
  'Credit transaction history',
  'Video review',
  'View detail',
  'Promotion management',
  'Registrations',
  'System settings',
  'Reports'
]) {
  assert(frontend.includes(label), `frontend contains ${label}`);
}

if (process.exitCode) {
  console.error('Submission verification failed.');
  process.exit(process.exitCode);
}

console.log('Submission verification passed.');
