create table if not exists public.lapgpt_records (
  id text primary key,
  kind text not null check (kind in ('order', 'request', 'contact')),
  created_at timestamptz not null default now(),
  data jsonb not null
);

create index if not exists lapgpt_records_kind_created_at_idx
  on public.lapgpt_records (kind, created_at desc);

alter table public.lapgpt_records enable row level security;

-- The application accesses this table only from the server using the
-- Supabase service-role key. Never put that key in frontend variables.
