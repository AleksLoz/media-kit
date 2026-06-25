const https = require('https');

const handler = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });

  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: 'No content' });

  function ghRequest(method, path, body) {
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

  const encoded = Buffer.from(content, 'utf8').toString('base64');

  // Retry up to 3 times — handles SHA conflicts from concurrent video uploads
  for (let attempt = 0; attempt < 3; attempt++) {
    const get = await ghRequest('GET', '/repos/AleksLoz/media-kit/contents/index.html');
    if (get.status !== 200) return res.status(500).json({ error: 'GET failed: ' + get.body.message });

    const put = await ghRequest('PUT', '/repos/AleksLoz/media-kit/contents/index.html', {
      message: 'Update media kit',
      content: encoded,
      sha: get.body.sha
    });

    if (put.status === 200 || put.status === 201) {
      return res.status(200).json({ success: true });
    }
    if (put.status === 409 && attempt < 2) {
      // SHA conflict — another write just landed, re-fetch SHA and retry
      await new Promise(r => setTimeout(r, 500 + attempt * 500));
      continue;
    }
    return res.status(500).json({ error: put.body.message || 'Save failed' });
  }
};

handler.config = { api: { bodyParser: { sizeLimit: '10mb' } } };
module.exports = handler;
