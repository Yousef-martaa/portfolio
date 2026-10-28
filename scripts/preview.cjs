const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };

function createPreview({ mockContact = false } = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/contact') {
      res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
      if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }); res.end(JSON.stringify({ message: 'Method not allowed' })); return; }
      if (!mockContact) { res.writeHead(503); res.end(JSON.stringify({ message: 'Static local preview: email is disabled. Please use the direct contact links.' })); return; }
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 20000) { res.writeHead(413); res.end('{}'); return; } }
      // Reuse validation, but never construct the SMTP transport in the preview.
      const { validateBody } = require('../api/contact.js');
      const valid = validateBody(raw);
      res.writeHead(valid ? 200 : 400); res.end(JSON.stringify({ message: valid ? 'Mock success. No email sent.' : 'Invalid fields' })); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    try {
      const decoded = decodeURIComponent(url.pathname);
      if (decoded.split(/[\\/]/).some(part => part.startsWith('.'))) throw new Error('hidden');
      const file = path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded));
      if (!file.startsWith(root + path.sep)) throw new Error('outside public');
      const data = await fs.readFile(file);
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache'); res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (require.main === module) {
  const mockContact = process.argv.includes('--mock-contact');
  const server = createPreview({ mockContact });
  server.listen(Number(process.env.PORT) || 8765, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${server.address().port} — ${mockContact ? 'MOCK contact success' : 'static only; contact returns 503'}. Email is never sent.`));
}
module.exports = { createPreview };
