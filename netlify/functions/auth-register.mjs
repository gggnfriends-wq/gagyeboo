import { db, errorResponse, hashPassword, json, readBody } from './_shared/common.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ error: '허용되지 않는 요청입니다.' }, 405);
  try {
    const { id, password } = await readBody(request);
    const username = typeof id === 'string' ? id.trim() : '';
    if (username.length < 2) return json({ error: '아이디는 2글자 이상 입력해주세요.' }, 400);
    if (username.length > 40) return json({ error: '아이디는 40자 이하로 입력해주세요.' }, 400);
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) return json({ error: '비밀번호는 8자 이상 200자 이하로 설정해주세요.' }, 400);
    const password_hash = await hashPassword(password);
    await db('accounts', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ username, password_hash })
    });
    return json({ ok: true });
  } catch (error) { return errorResponse(error, '회원가입에 실패했습니다.'); }
};
