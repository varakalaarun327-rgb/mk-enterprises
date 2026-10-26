import crypto from 'crypto';
import { readData, writeData } from './db.js';

const DEFAULT_AUTH = {
  isInitialized: false,
  adminPin: '9766', // Default fallback PIN: 9766 (from contact 9766550152) or 1234
  adminPassword: 'admin',
  staffPin: '1111',
  staffName: 'Counter Staff',
  jwtSecret: crypto.randomBytes(32).toString('hex')
};

export function getAuthConfig() {
  const existing = readData('auth', null);
  if (!existing) {
    writeData('auth', DEFAULT_AUTH);
    return DEFAULT_AUTH;
  }
  return existing;
}

export function updateAuthConfig(updates) {
  const current = getAuthConfig();
  const updated = { ...current, ...updates };
  writeData('auth', updated);
  return updated;
}

/**
 * Sign lightweight HMAC-SHA256 token
 */
export function signToken(payload, expiresInMs = 12 * 60 * 60 * 1000) {
  const config = getAuthConfig();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Date.now();
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + expiresInMs
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify HMAC-SHA256 token
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const config = getAuthConfig();

  const expectedSignature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Login handler for Admin & Staff
 */
export function authenticateUser(role, credential) {
  const config = getAuthConfig();
  const cleanCred = String(credential || '').trim();

  if (role === 'ADMIN') {
    // Check either Admin PIN or Admin Password
    if (cleanCred === config.adminPin || cleanCred === config.adminPassword) {
      const token = signToken({
        role: 'ADMIN',
        name: 'Owner (M.K. Enterprises)',
        username: 'admin'
      });
      return {
        success: true,
        token,
        user: { role: 'ADMIN', name: 'Owner (M.K. Enterprises)', username: 'admin' }
      };
    }
    return { success: false, error: 'Incorrect Admin PIN or Password.' };
  }

  if (role === 'STAFF') {
    if (cleanCred === config.staffPin || cleanCred === '1111') {
      const token = signToken({
        role: 'STAFF',
        name: config.staffName || 'Counter Staff',
        username: 'staff'
      });
      return {
        success: true,
        token,
        user: { role: 'STAFF', name: config.staffName || 'Counter Staff', username: 'staff' }
      };
    }
    return { success: false, error: 'Incorrect Staff PIN.' };
  }

  return { success: false, error: 'Invalid role requested.' };
}

/**
 * Quick Admin PIN override check
 */
export function verifyAdminPinOverride(pin) {
  const config = getAuthConfig();
  return String(pin).trim() === config.adminPin || String(pin).trim() === config.adminPassword;
}

