const https = require('https');

// Force every saved index.html into the canonical externalized form, no matter
// what the (possibly stale) browser tab posts. The editor serializes the whole
// page, so a tab running an older inline version would otherwise keep wiping the
// stylesheet/app logic. CSS lives in styles.css and JS in app.js — both are
// served from the repo and never written here — so we strip any inline blocks
// and guarantee the external references + drop transient runtime state.
function normalize(html) {
  // Inline <style>…</style> -> external stylesheet link
  if (/<style[^>]*>[\s\S]*?<\/style>/i.test(html)) {
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/i, '<link rel="stylesheet" href="/styles.css">');
  }
  if (!/href="\/styles\.css"/i.test(html)) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/styles.css">\n</head>');
  }
  // Inline classic <script>…</script> (app logic) -> external app.js ref.
  // The Vercel Blob loader is <script type="module"> and is left untouched.
  if (/<script>[\s\S]*?<\/script>/i.test(html)) {
    html = html.replace(/<script>[\s\S]*?<\/script>/i, '<script src="/app.js"></script>');
  }
  if (!/src="\/app\.js"/i.test(html)) {
    html = html.replace(/<\/body>/i, '<script src="/app.js"></script>\n</body>');
  }
  // Strip transient runtime state a stale tab may have serialized in
  html = html.replace(/<html lang="en"[^>]*>/i, '<html lang="en">');
  html = html.replace(/<div id="cur"[^>]*>/i, '<div id="cur">');
  html = html.replace(/<div id="cur-r"[^>]*>/i, '<div id="cur-r">');
  html = html.replace(/<body[^>]*\bclass="hov"[^>]*>/i, '<body>');
  // Restore the hero load animation if a save dropped the class
  html = html.replace('class="hero-title" id="hero-h1"', 'class="hero-title animate" id="hero-h1"');
  return html;
}

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

  const encoded = Buffer.from(normalize(content), 'utf8').toString('base64');

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
handler.normalize = normalize;
module.exports = handler;
