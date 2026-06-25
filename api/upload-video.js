const { handleUpload } = require('@vercel/blob/client');

// Client-upload flow: the browser uploads the file DIRECTLY to Vercel Blob
// storage, so the file never passes through this serverless function and is no
// longer subject to Vercel's 4.5 MB request-body limit. This function only
// issues a short-lived client token (and receives the completion callback).
//
// Requires the BLOB_READ_WRITE_TOKEN env var, which Vercel adds automatically
// once a Blob store is connected to the project.
const handler = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured — connect a Vercel Blob store to this project.' });
  }

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'],
        addRandomSuffix: true,
        maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB ceiling
      }),
      // Nothing to persist server-side — the browser writes the returned URL into
      // index.html via the existing save flow.
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(jsonResponse);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Upload failed' });
  }
};

module.exports = handler;
