const https = require('https');

function ghRequest(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Byggeligt-MediaKit',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, r => {
      let raw = '';
      r.on('data', c => raw += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: r.statusCode, body: { message: raw } }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const handler = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });

  const { filename, content } = req.body || {};
  if (!filename || !content) return res.status(400).json({ error: 'Missing filename or content' });

  const owner = 'AleksLoz';
  const repo  = 'media-kit';
  const filePath = `videos/${filename}`;

  // Each video is a brand-new unique file — no SHA conflict possible.
  // The Contents API handles this in one request instead of 6.
  const put = await ghRequest('PUT', `/repos/${owner}/${repo}/contents/${filePath}`, token, {
    message: `Upload video: ${filename}`,
    content: content,   // already base64
    branch: 'main'
  });

  if (put.status === 200 || put.status === 201) {
    // Return a CDN-friendly raw URL
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
    return res.status(200).json({ url });
  } else {
    return res.status(500).json({ error: put.body.message || 'Upload failed' });
  }
};

handler.config = {
  api: { bodyParser: { sizeLimit: '50mb' } }
};

module.exports = handler;
