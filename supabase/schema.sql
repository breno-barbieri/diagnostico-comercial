-- Tabela única do diagnóstico. Rode uma vez no SQL Editor do Supabase.
create table if not exists public.respostas (
  id text primary key,
  criado_em timestamptz not null default now(),
  turma text not null,
  dados jsonb not null
);
create index if not exists idx_respostas_turma on public.respostas (turma);

-- Acesso só pelo servidor (chave service_role). Nenhum acesso público direto.
alter table public.respostas enable row level security;
