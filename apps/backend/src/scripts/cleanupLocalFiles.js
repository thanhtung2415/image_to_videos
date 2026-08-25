import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads');
const maxAgeDays = Number(process.env.LOCAL_FILE_MAX_AGE_DAYS || 7);
const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function cleanup() {
  const files = await walk(uploadsRoot);
  const now = Date.now();
  let deleted = 0;

  for (const file of files) {
    const stat = await fs.stat(file);

    if (now - stat.mtimeMs > maxAgeMs) {
      await fs.unlink(file);
      deleted += 1;
    }
  }

  console.log(`Deleted ${deleted} local upload files older than ${maxAgeDays} days`);
}

cleanup().catch((error) => {
  console.error(error);
  process.exit(1);
});

