import crypto from 'crypto';

const fallbackSecret = crypto.randomBytes(32).toString('hex');
const secret = () => process.env.AUTH_TOKEN_SECRET || fallbackSecret;
export function issueToken(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: String(userId), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
export function requireActivityAuth(req, res, next) {
  const [payload, signature] = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').split('.');
  if (!payload || !signature) return res.status(401).json({ error: 'Sign in to access activity progress.' });
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return res.status(401).json({ error: 'Invalid session.' }); }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'Invalid session.' });
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!session.sub || session.exp < Date.now()) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    req.activityUserId = session.sub;
    return next();
  } catch { return res.status(401).json({ error: 'Invalid session.' }); }
}
