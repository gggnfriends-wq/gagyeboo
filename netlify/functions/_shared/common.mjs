import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
  });
}

export async function readBody(request) {
  const raw = await request.text();
  if (raw.length > 5_000_000) throw new Error('요청 데이터가 너무 큽니다.');
  try { return JSON.parse(raw || '{}'); } catch { throw new Error('요청 형식이 올바르지 않습니다.'); }
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.JWT_SECRET;
  if (!url || !key || !secret) throw new Error('서버 환경변수가 설정되지 않았습니다. Netlify 환경변수를 확인해주세요.');
  return { url: url.replace(/\/$/, ''), key, secret };
}

export async function db(path, options = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  if (!response.ok) {
    console.error('Supabase request failed:', response.status, result);
    if (response.status === 409) throw new Error('이미 사용 중인 아이디입니다.');
    throw new Error('데이터베이스 요청에 실패했습니다. 서버 설정과 테이블을 확인해주세요.');
  }
  return result;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function b64(value) { return Buffer.from(value).toString('base64url'); }

export function createToken(account) {
  const { secret } = config();
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64(JSON.stringify({ sub: account.id, username: account.username, iat: now, exp: now + TOKEN_TTL_SECONDS }));
  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function requireAuth(request) {
  const { secret } = config();
  const match = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
  const parts = match[1].split('.');
  if (parts.length !== 3) throw new Error('인증 정보가 올바르지 않습니다. 다시 로그인해주세요.');
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', secret).update(unsigned).digest();
  const actual = Buffer.from(parts[2], 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('인증 정보가 만료되었거나 올바르지 않습니다. 다시 로그인해주세요.');
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); } catch { throw new Error('인증 정보가 올바르지 않습니다.'); }
  if (!payload.sub || !payload.username || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('로그인 시간이 만료되었습니다. 다시 로그인해주세요.');
  return { id: payload.sub, username: payload.username };
}

export function errorResponse(error, fallback = '요청을 처리하지 못했습니다.') {
  const message = error instanceof Error ? error.message : fallback;
  const status = /로그인|인증 정보|만료/.test(message) ? 401 : /이미 사용 중/.test(message) ? 409 : /필수|2글자|40자|8자|올바르지|너무 큽니다/.test(message) ? 400 : 500;
  return json({ error: message || fallback }, status);
}
