-- ==============================================================
-- TRAJETOS — os deslocamentos (KM) que o executivo registra no
-- formulário: partida → destino, KM e o reembolso calculado.
-- Antes viravam uma despesa "Quilometragem" (perdendo cidade/KM);
-- agora têm casa própria — normalizado, sem perder dado, escalável.
-- RLS: o executivo vê os dele; Admin/Gestor veem todos.
--
-- Rode no SQL Editor do cativa-crm. É idempotente (pode repetir).
-- ==============================================================

create table if not exists app.trajetos (
  id            bigint generated always as identity primary key,
  executivo_id  bigint not null references app.executivos (id) on delete restrict,
  data          date not null,
  partida       text,
  destino       text,
  km            numeric(10, 2) not null default 0,
  reembolso     numeric(12, 2) not null default 0,   -- valor apurado no formulário
  criado_em     timestamptz not null default now()
);
create index if not exists idx_trajetos_executivo on app.trajetos (executivo_id);

alter table app.trajetos enable row level security;

-- Executivo vê/registra os seus; quem vê tudo (Admin/Gestor) vê todos.
drop policy if exists trajetos_select on app.trajetos;
create policy trajetos_select on app.trajetos for select to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());

drop policy if exists trajetos_ins on app.trajetos;
create policy trajetos_ins on app.trajetos for insert to authenticated
  with check (executivo_id = app.executivo_atual() or app.ve_tudo());

drop policy if exists trajetos_upd on app.trajetos;
create policy trajetos_upd on app.trajetos for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());

drop policy if exists trajetos_del on app.trajetos;
create policy trajetos_del on app.trajetos for delete to authenticated
  using (app.ve_tudo());

-- Grants (o setup concede em massa, mas garante p/ esta tabela nova).
grant select, insert, update, delete on app.trajetos to authenticated;
grant select, insert, update, delete on app.trajetos to service_role;
