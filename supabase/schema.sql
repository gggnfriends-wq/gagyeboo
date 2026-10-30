-- Supabase SQL Editor에서 전체 내용을 실행하세요.
-- 비밀번호는 서버에서 scrypt 해시로 저장합니다. 원문 비밀번호는 저장하지 않습니다.
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gagyeboo_data (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.gagyeboo_data enable row level security;

-- 브라우저에서 Supabase에 직접 접근하지 않습니다. Netlify Functions만
-- 서버 비밀키로 접근하므로 anon/authenticated용 공개 정책을 만들지 않습니다.
revoke all on table public.accounts from anon, authenticated;
revoke all on table public.gagyeboo_data from anon, authenticated;
grant all on table public.accounts to service_role;
grant all on table public.gagyeboo_data to service_role;
