const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createPreview } = require('../scripts/preview.cjs');
test('four routes/assets work; preview and deployment exclude handoff; static contact never sends email', async () => {
  const server = createPreview(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/', '/index.html', '/projects.html', '/skills.html', '/contact.html', '/main.js', '/discovery.mjs', '/style.css']) assert.equal((await fetch(base + route)).status, 200);
    for (const asset of ['autoops', 'staffsync', 'vegan', 'mogges']) {
      const response = await fetch(`${base}/assets/${asset}.webp`);
      assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/webp');
    }
    for (const route of ['/portfolio-handoff/IMPLEMENTATION-BRIEF.md', '/portfolio-handoff/design-reference.html', '/README.md', '/.env', '/api/contact.js']) assert.equal((await fetch(base + route)).status, 404);
    assert.equal((await fetch(base + '/api/contact', { method: 'POST' })).status, 503);
    assert.equal(JSON.parse(fs.readFileSync('vercel.json')).outputDirectory, 'public');
    assert(fs.readFileSync('.vercelignore', 'utf8').includes('portfolio-handoff/'));
    for (const page of ['index', 'projects', 'skills', 'contact']) {
      const html = fs.readFileSync(`public/${page}.html`, 'utf8');
      for (const route of ['index.html', 'projects.html', 'skills.html', 'contact.html']) assert(html.includes(`href="${route}"`));
      assert(!html.includes('portfolio-handoff')); assert(html.includes('aria-current="page"'));
    }
  } finally { await new Promise(r => server.close(r)); }
});
