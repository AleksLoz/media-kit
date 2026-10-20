const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
const { requireEditor } = require('./_auth');

// One-time migration: upload git-committed /videos/* files to Vercel Blob
// and return a map of filename → blob URL. Call once, then delete this file.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (!requireEditor(req, res)) return;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not set' });

  const files = [
    'homedecor-1.mp4',
    'outdoor-1.mp4',
    'outdoor-2.mp4',
    'outdoor-3.mp4',
    'smarthome-1.mp4',
    'smarthome-2.mp4',
    'smarthome-3.mp4',
  ];

  const results = {};

  for (const filename of files) {
    const filePath = path.join(process.cwd(), 'videos', filename);
    try {
      const data = fs.readFileSync(filePath);
      const blob = await put(filename, data, {
        access: 'public',
        token,
        contentType: 'video/mp4',
        addRandomSuffix: false,
      });
      results[filename] = blob.url;
    } catch (err) {
      results[filename] = { error: err.message };
    }
  }

  return res.status(200).json(results);
};
