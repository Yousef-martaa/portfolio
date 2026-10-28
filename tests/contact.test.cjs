const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/contact.js');
const valid = { name: 'A Visitor', email: 'visitor@example.org', message: 'Hello there', subject: '' };
function res() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } }; }
const env = { EMAIL_USER: 'owner@example.org', EMAIL_PASS: 'test-only' };
test('rejects missing/malformed bodies, invalid types, empty required fields, headers and oversized inputs before SMTP', async () => {
  const handler = createHandler({ env, createTransport() { throw new Error('Must not create transport'); } });
  const invalid = [undefined, null, [], '{', {}, { ...valid, name: 42 }, { ...valid, name: ' ' }, { ...valid, email: 'bad' }, { ...valid, message: '' }, { ...valid, subject: 'x\r\nBcc: victim@example.org' }, { ...valid, message: 'x'.repeat(10001) }, { ...valid, email: ['a@example.org'] }];
  for (const body of invalid) { const output = res(); await handler({ method: 'POST', body }, output); assert.equal(output.code, 400); }
});
test('method rejection includes Allow and missing configuration returns 503', async () => {
  const handler = createHandler({ env: {} }); let output = res();
  await handler({ method: 'GET' }, output); assert.equal(output.code, 405); assert.equal(output.headers.Allow, 'POST');
  output = res(); await handler({ method: 'POST', body: valid }, output); assert.equal(output.code, 503);
});
test('success uses mocked Gmail TLS transport, preserved sender and replyTo, including JSON-string bodies', async () => {
  let config, mail;
  const handler = createHandler({ env, createTransport(options) { config = options; return { async sendMail(message) { mail = message; } }; } });
  const output = res(); await handler({ method: 'POST', body: JSON.stringify({ ...valid, subject: undefined }) }, output);
  assert.equal(output.code, 200); assert.equal(config.host, 'smtp.gmail.com'); assert.equal(config.port, 465); assert.equal(config.secure, true);
  assert.equal(mail.to, env.EMAIL_USER); assert.equal(mail.replyTo, valid.email); assert.equal(mail.subject, '[Portfolio] New message'); assert(mail.text.includes(valid.message));
});
test('SMTP failure returns generic error without leaking transport details', async () => {
  const handler = createHandler({ env, createTransport() { return { async sendMail() { throw new Error('SECRET SMTP ERROR'); } }; } });
  const output = res(); await handler({ method: 'POST', body: valid }, output);
  assert.equal(output.code, 500); assert(!JSON.stringify(output.body).includes('SECRET'));
});
