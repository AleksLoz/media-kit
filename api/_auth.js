// Shared editor auth helpers. Files prefixed with "_" are not exposed as
// Vercel routes. Uses only Node's built-in crypto.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   EDITOR_PASSWORD  the editor password, checked server-side only
//   EDITOR_SECRET    long random string used to sign session tokens (HMAC-SHA256)
// If either one is missing, every protected endpoint refuses (fails closed).
const crypto = require('crypto');

const COOKIE = 'editor_session';
const TTL_SECONDS = 12 * 60 * 60; // 12h

function configured() {
  return Boolean(process.env.EDITOR_PASSWORD && process.env.EDITOR_SECRET);
}

// Constant-time comparison that does not leak length: compare SHA-256 digests.
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  const hb = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload) {
  return b64url(crypto.createHmac('sha256', process.env.EDITOR_SECRET).update(payload).digest());
}

function issueToken() {
  const payload = b64url(JSON.stringify({ sub: 'editor', exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }));
  return payload + '.' + sign(payload);
}

function verifyToken(token) {
  if (!configured() || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!safeEqual(sig, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return data.sub === 'editor' && typeof data.exp === 'number' && data.exp > Math.floor(Date.now() / 1000);
  } catch (_) {
    return false;
  }
}

function readCookie(req, name) {
  const header = (req.headers && req.headers.cookie) || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function sessionCookie(token, maxAge) {
  return `${COOKIE}=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function isAuthed(req) {
  return verifyToken(readCookie(req, COOKIE));
}

// Returns true if the request may proceed; otherwise sends 503/401 and returns false.
function requireEditor(req, res) {
  if (!configured()) {
    res.status(503).json({ error: 'Editor is disabled: EDITOR_PASSWORD / EDITOR_SECRET not configured' });
    return false;
  }
  if (!isAuthed(req)) {
    res.status(401).json({ error: 'Not logged in' });
    return false;
  }
  return true;
}

module.exports = { configured, safeEqual, issueToken, verifyToken, isAuthed, requireEditor, sessionCookie, TTL_SECONDS };
