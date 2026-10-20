const { configured, safeEqual, issueToken, isAuthed, sessionCookie, TTL_SECONDS } = require('./_auth');

// POST   {password}  -> sets an HttpOnly session cookie (12h) if the password matches EDITOR_PASSWORD
// GET               -> {loggedIn: boolean}
// DELETE            -> clears the session cookie (logout)
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!configured()) {
    return res.status(503).json({ error: 'Editor is disabled: EDITOR_PASSWORD / EDITOR_SECRET not configured' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ loggedIn: isAuthed(req) });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.status(200).json({ loggedIn: false });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!password || !safeEqual(password, process.env.EDITOR_PASSWORD)) {
    // small fixed delay to slow down guessing
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ error: 'Incorrect password' });
  }

  res.setHeader('Set-Cookie', sessionCookie(issueToken(), TTL_SECONDS));
  return res.status(200).json({ loggedIn: true });
};
