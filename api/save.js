const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
  }

  const { content } = req.body || {};
  if (!content) {
    return res.status(400).json({ error: 'No content' });
  }

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
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(raw) }));
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  // Get current file SHA
  const get = await ghRequest('GET', '/repos/AleksLoz/media-kit/contents/index.html');
  if (get.status !== 200) {
    return res.status(500).json({ error: `GET failed: ${get.body.message}` });
  }

  // Commit updated file
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const put = await ghRequest('PUT', '/repos/AleksLoz/media-kit/contents/index.html', {
    message: 'Update media kit',
    content: encoded,
    sha: get.body.sha
  });

  if (put.status === 200 || put.status === 201) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ error: put.body.message });
  }
};
