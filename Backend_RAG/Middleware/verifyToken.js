import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';

let cachedKeys = null;
let cacheTime = 0;

const getPublicKeys = async () => {
  if (cachedKeys && Date.now() - cacheTime < 3_600_000) return cachedKeys;

  const url =
    `${process.env.KEYCLOAK_URL || 'http://localhost:8081/'}` +
    `realms/${process.env.KEYCLOAK_REALM || 'RealmPFE'}/protocol/openid-connect/certs`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const { keys } = await res.json();
  cachedKeys = keys;
  cacheTime = Date.now();
  return keys;
};

export const verifyToken = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.split(' ')[1];

  try {
    const keys = await getPublicKeys();
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new Error('Invalid token format');

    const jwk = keys.find(k => k.kid === decoded.header.kid) || keys[0];
    if (!jwk) throw new Error('No matching key found');

    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });

    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'],
    });

    req.tokenPayload = payload;
    next();
  } catch {
    return res.status(403).json({ error: 'Forbidden' });
  }
};
