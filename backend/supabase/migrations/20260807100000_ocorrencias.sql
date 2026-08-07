-- ==============================================================
-- OCORRÊNCIAS — nativas do CRM (abertas na ficha da agência).
-- 3 tabelas (ocorrência + andamentos + anexos) + bucket de Storage.
-- RLS: segue a visibilidade da agência (Executivo vê as dele; Admin/Gestor tudo).
-- ==============================================================

-- --------- Tabelas ---------
create table app.ocorrencias (
  id             bigint generated always as identity primary key,
  agencia_id     bigint not null references app.agencias (id) on delete cascade,
  setor          text,                                   -- null = ocorrência geral (sem setor)
  descricao      text not null,
  situacao       text not null default 'Em aberto'
                 check (situacao in ('Em aberto', 'Em andamento', 'Resolvido')),
  data_abertura  date not null default current_date,
  data_resolucao date,
  aberto_por     bigint references app.executivos (id) on delete set null,
  criado_em      timestamptz not null default now()
);
create index idx_ocorrencias_agencia on app.ocorrencias (agencia_id);

create table app.ocorrencia_andamentos (
  id             bigint generated always as identity primary key,
  ocorrencia_id  bigint not null references app.ocorrencias (id) on delete cascade,
  texto          text not null,
  autor_id       bigint references app.executivos (id) on delete set null,
  data           date not null default current_date,
  criado_em      timestamptz not null default now()
);
create index idx_andamentos_ocorrencia on app.ocorrencia_andamentos (ocorrencia_id);

create table app.ocorrencia_anexos (
  id             bigint generated always as identity primary key,
  ocorrencia_id  bigint not null references app.ocorrencias (id) on delete cascade,
  nome           text not null,
  tipo           text not null check (tipo in ('imagem', 'arquivo')),
  caminho        text not null,                          -- caminho no bucket do Storage
  criado_em      timestamptz not null default now()
);
create index idx_anexos_ocorrencia on app.ocorrencia_anexos (ocorrencia_id);

-- --------- Segurança (RLS) ---------
alter table app.ocorrencias           enable row level security;
alter table app.ocorrencia_andamentos enable row level security;
alter table app.ocorrencia_anexos     enable row level security;

-- helper: a ocorrência é visível? (segue a visibilidade da agência)
create or replace function app.ocorrencia_visivel(p_ocorrencia_id bigint)
returns boolean language sql stable security definer set search_path = app, public as $$
  select exists (
    select 1 from app.ocorrencias o
    where o.id = p_ocorrencia_id and app.agencia_visivel(o.agencia_id)
  )
$$;

create policy ocor_select on app.ocorrencias for select to authenticated
  using (app.agencia_visivel(agencia_id));
create policy ocor_ins on app.ocorrencias for insert to authenticated
  with check (app.agencia_visivel(agencia_id));
create policy ocor_upd on app.ocorrencias for update to authenticated
  using (app.agencia_visivel(agencia_id)) with check (app.agencia_visivel(agencia_id));
create policy ocor_del on app.ocorrencias for delete to authenticated
  using (app.ve_tudo());

create policy and_select on app.ocorrencia_andamentos for select to authenticated
  using (app.ocorrencia_visivel(ocorrencia_id));
create policy and_ins on app.ocorrencia_andamentos for insert to authenticated
  with check (app.ocorrencia_visivel(ocorrencia_id));
create policy and_del on app.ocorrencia_andamentos for delete to authenticated
  using (app.ve_tudo());

create policy anx_select on app.ocorrencia_anexos for select to authenticated
  using (app.ocorrencia_visivel(ocorrencia_id));
create policy anx_ins on app.ocorrencia_anexos for insert to authenticated
  with check (app.ocorrencia_visivel(ocorrencia_id));
create policy anx_del on app.ocorrencia_anexos for delete to authenticated
  using (app.ocorrencia_visivel(ocorrencia_id));

-- --------- Storage: bucket privado pros anexos ---------
insert into storage.buckets (id, name, public)
values ('ocorrencia-anexos', 'ocorrencia-anexos', false)
on conflict (id) do nothing;

-- usuário logado lê e envia anexos; só quem vê tudo apaga
create policy "anexos ocor leitura" on storage.objects for select to authenticated
  using (bucket_id = 'ocorrencia-anexos');
create policy "anexos ocor upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'ocorrencia-anexos');
create policy "anexos ocor delete" on storage.objects for delete to authenticated
  using (bucket_id = 'ocorrencia-anexos' and app.ve_tudo());
