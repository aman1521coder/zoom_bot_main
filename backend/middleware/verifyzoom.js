// middleware/verifyZoom.js
import crypto from 'crypto';

export const verifyZoomWebhook = (req, res, next) => {
  const signature = req.headers['x-zm-signature'];
  const timestamp = req.headers['x-zm-request-timestamp'];

  if (!signature || !timestamp) {
    return res.status(401).send('Unauthorized: Missing Zoom headers.');
  }

  // Use the raw body buffer that we attached in server.js
  const message = `v0:${timestamp}:${req.rawBody.toString()}`;

  const hash = crypto
    .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(message)
    .digest('hex');

  const expectedSignature = `v0=${hash}`;

  if (signature === expectedSignature) {
    // Before passing to the next handler, parse the JSON body
    req.body = JSON.parse(req.rawBody);
    next();
  } else {
    res.status(401).send('Unauthorized: Invalid signature.');
  }
};
