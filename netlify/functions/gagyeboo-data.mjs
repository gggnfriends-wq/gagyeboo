import { db, errorResponse, json, readBody, requireAuth } from './_shared/common.mjs';

export default async (request) => {
  try {
    const account = requireAuth(request);
    if (request.method === 'GET') {
      const rows = await db(`gagyeboo_data?select=data&account_id=eq.${encodeURIComponent(account.id)}&limit=1`);
      return json({ data: rows?.[0]?.data || {} });
    }
    if (request.method === 'PUT') {
      const body = await readBody(request);
      if (!body || typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) return json({ error: '저장할 데이터 형식이 올바르지 않습니다.' }, 400);
      await db('gagyeboo_data?on_conflict=account_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ account_id: account.id, data: body.data, updated_at: new Date().toISOString() })
      });
      return json({ ok: true });
    }
    return json({ error: '허용되지 않는 요청입니다.' }, 405);
  } catch (error) { return errorResponse(error, '가계부 데이터를 처리하지 못했습니다.'); }
};
