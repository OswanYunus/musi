#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Simple .env.local parser (no dependencies)
try {
  const envRaw = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  envRaw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) return;
    const key = m[1];
    let val = m[2] || '';
    // Strip optional surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
} catch (e) {
  // ignore — file may not exist
}

async function main() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = process.env.EMAIL_SECURE === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const owner = process.env.EMAIL_TO;

  if (!host || !user || !pass || !owner) {
    console.error('Missing SMTP env vars. Check .env.local');
    process.exitCode = 2;
    return;
  }

  const html = `
    <h2>Test Order — Musi's Collection</h2>
    <p>This is a test order message sent from the local dev environment to verify SMTP.</p>
    <h3>Items</h3>
    <ul>
      <li>Handmade Basket × 2 — Ksh 1200</li>
      <li>Beach Tote × 1 — Ksh 800</li>
    </ul>
    <p>Total: <strong>Ksh 3200</strong></p>
  `;

  // Try SMTPS (465) first, then fallback to STARTTLS (587)
  const attempts = [ { port: port, secure: secure }, { port: 587, secure: false } ];
  let sent = false;
  for (const a of attempts) {
    try {
      const transporter = nodemailer.createTransport({ host, port: a.port, secure: a.secure, auth: { user, pass }, tls: { rejectUnauthorized: false } });
      const info = await transporter.sendMail({ from: `"Musi's Collection" <${user}>`, to: owner, subject: 'Test order — Musi', html });
      console.log('Email queued (port ' + a.port + '), messageId=', info.messageId || '(no id)');
      sent = true;
      break;
    } catch (err) {
      console.error('Attempt on port', a.port, 'failed:', err && err.code ? err.code : err);
    }
  }
  if (!sent) {
    console.error('All SMTP attempts failed. Check network/firewall and SMTP credentials.');
    process.exitCode = 3;
  }
}

main();
