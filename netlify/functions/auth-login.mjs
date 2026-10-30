import { createToken, db, errorResponse, json, readBody, verifyPassword } from './_shared/common.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ error: '허용되지 않는 요청입니다.' }, 405);
  try {
    const { id, password } = await readBody(request);
    const username = typeof id === 'string' ? id.trim() : '';
    if (!username || typeof password !== 'string') return json({ error: '아이디와 비밀번호를 입력해주세요.' }, 400);
    const rows = await db(`accounts?select=id,username,password_hash&username=eq.${encodeURIComponent(username)}&limit=1`);
    const account = rows?.[0];
    if (!account || !(await verifyPassword(password, account.password_hash))) return json({ error: '아이디 또는 비밀번호를 확인해주세요.' }, 401);
    return json({ token: createToken(account), account: { id: account.username, username: account.username } });
  } catch (error) { return errorResponse(error, '로그인에 실패했습니다.'); }
};
