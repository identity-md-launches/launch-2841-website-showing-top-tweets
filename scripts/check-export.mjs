import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const html = await readFile('dist/index.html', 'utf8');
for (const required of ['<title>', 'name="description"', 'property="og:title"', 'property="og:image"', 'rel="icon"']) {
  assert(html.includes(required), `Missing metadata: ${required}`);
}
const localRefs = [...html.matchAll(/(?:src|href|content)="(\.\/[^"#]+)"/g)].map(match => match[1]);
for (const ref of localRefs) assert((await stat(join('dist', ref))).isFile(), `Missing local asset ${ref}`);
assert(!/(?:src|href)="\/(?!\/)/.test(html), 'Root-relative asset URL');
async function bytes(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert(!['node_modules', '.cache', '.vite'].includes(entry.name), `Generated dependency/cache directory: ${entry.name}`);
    total += entry.isDirectory() ? await bytes(join(dir, entry.name)) : (await stat(join(dir, entry.name))).size;
  }
  return total;
}
const total = await bytes('dist');
assert(total < 8 * 1024 * 1024, 'Export exceeds assignment budget');
console.log(`Export OK: ${localRefs.length} relative HTML asset references; ${total.toLocaleString('en')} bytes; required metadata present.`);
