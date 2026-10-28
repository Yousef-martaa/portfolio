const nodemailer = require('nodemailer');

function validateBody(raw) {
  let body;
  try { body = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const limits = { name: 120, email: 254, subject: 200, message: 10000 }, clean = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = key === 'subject' && body[key] === undefined ? '' : body[key];
    if (typeof value !== 'string' || value.length > max) return null;
    clean[key] = value.trim(); if (key !== 'subject' && !clean[key]) return null;
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(clean.email) || /[\r\n]/.test(clean.subject) || /[\r\n]/.test(clean.name)) return null;
  return clean;
}

// Tests inject a fake transport: no test can accidentally send mail.
function createHandler({ createTransport = nodemailer.createTransport, env = process.env } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed' }); }
    try {
      const body = validateBody(req.body);
      if (!body) return res.status(400).json({ message: 'Please check the required fields, email address and field lengths.' });
      if (!env.EMAIL_USER || !env.EMAIL_PASS) return res.status(503).json({ message: 'Messaging is temporarily unavailable. Please use email or telephone.' });
      const transporter = createTransport({ host: 'smtp.gmail.com', port: 465, secure: true,
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
        auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS } });
      await transporter.sendMail({ from: `"Portfolio Contact" <${env.EMAIL_USER}>`, to: env.EMAIL_USER,
        subject: `[Portfolio] ${body.subject || 'New message'}`, replyTo: body.email,
        text: `From: ${body.name} (${body.email})\n\n${body.message}` });
      return res.status(200).json({ message: 'OK' });
    } catch { return res.status(500).json({ message: 'Message could not be sent. Please try again or contact me directly.' }); }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.validateBody = validateBody;
