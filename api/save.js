module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not set in Vercel environment variables' });
  }

  const owner = 'AleksLoz';
  const repo  = 'media-kit';
  const path  = 'index.html';

  const { content } = req.body || {};
  if (!content) {
    return res.status(400).json({ error: 'No content provided' });
  }

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Byggeligt-MediaKit',
    'Content-Type': 'application/json'
  };

  // Get current file SHA (required to update)
  const getRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );
  if (!getRes.ok) {
    const err = await getRes.json();
    return res.status(500).json({ error: `GitHub GET failed: ${err.message}` });
  }
  const fileData = await getRes.json();
  const sha = fileData.sha;

  // Commit updated content
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'Update media kit content',
        content: encoded,
        sha
      })
    }
  );

  if (putRes.ok) {
    return res.status(200).json({ success: true });
  } else {
    const err = await putRes.json();
    return res.status(500).json({ error: err.message });
  }
};
