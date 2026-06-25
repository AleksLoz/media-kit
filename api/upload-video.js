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

  // Retry up to 3 times — handles rare concurrent ref conflicts
  for (let attempt = 0; attempt < 3; attempt++) {
    // 1. Get current HEAD
    const ref = await ghRequest('GET', `/repos/${owner}/${repo}/git/refs/heads/main`, token);
    if (ref.status !== 200) return res.status(500).json({ error: 'Could not get ref: ' + ref.body.message });
    const commitSha = ref.body.object.sha;

    // 2. Get commit tree
    const commit = await ghRequest('GET', `/repos/${owner}/${repo}/git/commits/${commitSha}`, token);
    if (commit.status !== 200) return res.status(500).json({ error: 'Could not get commit' });
    const treeSha = commit.body.tree.sha;

    // 3. Create blob
    const blob = await ghRequest('POST', `/repos/${owner}/${repo}/git/blobs`, token, {
      content,
      encoding: 'base64'
    });
    if (blob.status !== 201) return res.status(500).json({ error: 'Blob failed: ' + blob.body.message });

    // 4. Create tree
    const tree = await ghRequest('POST', `/repos/${owner}/${repo}/git/trees`, token, {
      base_tree: treeSha,
      tree: [{ path: filePath, mode: '100644', type: 'blob', sha: blob.body.sha }]
    });
    if (tree.status !== 201) return res.status(500).json({ error: 'Tree failed' });

    // 5. Create commit
    const newCommit = await ghRequest('POST', `/repos/${owner}/${repo}/git/commits`, token, {
      message: `Upload video: ${filename}`,
      tree: tree.body.sha,
      parents: [commitSha]
    });
    if (newCommit.status !== 201) return res.status(500).json({ error: 'Commit failed' });

    // 6. Update ref
    const update = await ghRequest('PATCH', `/repos/${owner}/${repo}/git/refs/heads/main`, token, {
      sha: newCommit.body.sha,
      force: false
    });

    if (update.status === 200) {
      const url = `/videos/${filename}`; // Vercel serves this from the git repo
      return res.status(200).json({ url });
    }

    // 422 = not a fast-forward (another upload just landed) — re-fetch HEAD and retry
    if (update.status === 422 && attempt < 2) {
      await new Promise(r => setTimeout(r, 800 + attempt * 600));
      continue;
    }

    return res.status(500).json({ error: update.body.message || 'Ref update failed' });
  }
};

handler.config = {
  api: { bodyParser: { sizeLimit: '50mb' } }
};

module.exports = handler;
