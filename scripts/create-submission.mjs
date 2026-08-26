import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const outputDir = path.join(root, 'submissions');
const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
const outputPath = path.join(outputDir, `image_to_videos_source_${timestamp}.zip`);
const trackedStatus = execFileSync('git', ['status', '--short', '--untracked-files=no'], {
  cwd: root,
  encoding: 'utf8'
}).trim();

if (trackedStatus) {
  console.warn('Warning: tracked changes are not committed. The zip will use the latest commit only.');
}

fs.mkdirSync(outputDir, { recursive: true });

execFileSync('git', ['archive', '--format=zip', `--output=${outputPath}`, '--prefix=image_to_videos/', 'HEAD'], {
  cwd: root,
  stdio: 'inherit'
});

console.log(`Submission zip created: ${outputPath}`);
