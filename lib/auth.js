import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 12;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);
const COOKIE_NAME = 'pggy_session';
const SESSION_DURATION = '7d'; // 7 days

/**
 * Hash a plaintext password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plaintext password with hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT with the given payload
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT
 * Returns the payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get the current session from cookies (for use in Server Components / API routes)
 * Returns the owner payload { ownerId, phone } or null
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Require an admin session (throws if not admin or redirect)
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN' || session.status === 'INACTIVE') {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Create a session by setting JWT in httpOnly cookie
 * Call from API routes / Server Actions
 */
export async function createSession(owner) {
  const token = await signToken({
    ownerId: owner.id,
    phone: owner.phone,
    name: owner.name,
    role: owner.role,
    status: owner.status,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return token;
}

/**
 * Clear the session cookie (logout)
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Cookie name export for middleware
 */
export { COOKIE_NAME };
