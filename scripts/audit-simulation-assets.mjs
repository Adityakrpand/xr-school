import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = join(process.cwd(), 'apps', 'web', 'public');
const limits = new Map([
  ['.glb', 12 * 1024 * 1024],
  ['.gltf', 2 * 1024 * 1024],
  ['.hdr', 4 * 1024 * 1024],
  ['.jpg', 2 * 1024 * 1024],
  ['.jpeg', 2 * 1024 * 1024],
  ['.png', 2 * 1024 * 1024],
  ['.webp', 1 * 1024 * 1024],
  ['.mp3', 2 * 1024 * 1024],
  ['.ogg', 2 * 1024 * 1024],
]);
const videoWarning = 50 * 1024 * 1024;

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return nested.flat();
}

const warnings = [];
for (const file of await filesBelow(root)) {
  const extension = extname(file).toLowerCase();
  const bytes = (await stat(file)).size;
  const limit = extension === '.mp4' || extension === '.webm'
    ? videoWarning
    : limits.get(extension);
  if (limit && bytes > limit) {
    warnings.push(`${relative(root, file)}: ${(bytes / 1024 / 1024).toFixed(1)} MB (target <= ${(limit / 1024 / 1024).toFixed(0)} MB)`);
  }
}

if (warnings.length) {
  console.warn(`Asset budget warnings:\n- ${warnings.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Simulation assets are within the offline/XR transfer budgets.');
}
