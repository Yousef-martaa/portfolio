const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
let failed = false, checked = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:js|cjs|mjs)$/.test(file)) {
      const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      checked++; if (result.status !== 0) { process.stderr.write(result.stderr); failed = true; }
    }
  }
}
for (const dir of ['public', 'api', 'scripts', 'tests']) walk(dir);
for (const file of ['package.json', 'vercel.json']) JSON.parse(readFileSync(file, 'utf8'));
console.log(`${checked} JavaScript files checked; JSON configuration valid.`);
process.exitCode = failed ? 1 : 0;
