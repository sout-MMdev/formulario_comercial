-- ============================================================
-- SETUP COMPLETO — CRM Cativa (projeto cativa-crm)
-- Rode no SQL Editor do projeto cativa-crm. É RE-EXECUTAVEL:
-- limpa o schema app + as politicas de storage antes de recriar,
-- entao pode rodar de novo sem erro se algo parar no meio.
-- Cria o schema app + RLS + funcoes/gatilhos + view + seeds,
-- expoe o schema a API e cria/liga o executivo Administrador.
-- ============================================================

drop schema if exists app cascade;

-- ==================== 20260805120000_schema_app.sql ====================
-- ==============================================================
-- FASE 1 — Schema do CRM Comercial (modelo do PDF, 8 tabelas)
-- Projeto: Dados_Cativa · schema: app (separado do warehouse em public)
--
-- Princípio central: o executivo vê o mundo dele; o gestor vê todos.
-- Cada registro guarda QUEM o criou, então o histórico permanece íntegro
-- mesmo que um executivo troque de região ou saia da empresa.
--
-- Segurança: RLS já é LIGADO aqui (deny-all por padrão). As POLÍTICAS de
-- quem-vê-o-quê entram na fase 2, junto com a exposição do schema à API.
-- Enquanto isso, o schema `app` nem é exposto ao PostgREST por padrão.
-- ==============================================================

create schema if not exists app;

-- --------------------------------------------------------------
-- 3.1 executivos — quem tem acesso ao sistema (executivos e gestores)
-- --------------------------------------------------------------
create table app.executivos (
  id         bigint generated always as identity primary key,
  nome       text not null,
  email      text not null unique,
  perfil     text not null default 'Executivo'          -- role de acesso (= PerfilUsuario no CRM)
             check (perfil in ('Administrador', 'Gestor', 'Executivo', 'Operacional')),
  setor      text,                                       -- p/ perfil Operacional: setor que a pessoa atende
  ativo      boolean not null default true,              -- desativa sem apagar (preserva histórico)
  auth_id    uuid unique references auth.users (id) on delete set null, -- liga ao login do Supabase
  criado_em  timestamptz not null default now()
);
comment on table app.executivos is 'Usuários do sistema. perfil = role de acesso; auth_id liga ao login (auth.users).';

-- --------------------------------------------------------------
-- 3.2 agencias — cadastro das agências parceiras
-- --------------------------------------------------------------
create table app.agencias (
  id            bigint generated always as identity primary key,
  nome          text not null,
  uf            text,
  executivo_id  bigint references app.executivos (id) on delete set null, -- responsável ATUAL
  status        text not null default 'Prospecção'
                check (status in ('Ativa', 'Inativa', 'Em recuperação', 'Prospecção')),
  data_fundacao date,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on column app.agencias.executivo_id is
  'Responsável atual. Ao trocar de região, muda aqui; as visitas antigas NÃO mudam.';
create index idx_agencias_executivo on app.agencias (executivo_id);

-- --------------------------------------------------------------
-- 3.3 visitas — cada visita a campo, numa data
-- --------------------------------------------------------------
create table app.visitas (
  id            bigint generated always as identity primary key,
  executivo_id  bigint not null references app.executivos (id) on delete restrict, -- HISTÓRICO: nunca muda
  data_visita   date not null,
  criado_em     timestamptz not null default now()
);
comment on column app.visitas.executivo_id is
  'Quem FEZ a visita (registro histórico). Não muda quando a agência troca de responsável.';
create index idx_visitas_executivo on app.visitas (executivo_id);

-- --------------------------------------------------------------
-- 3.4 agencia_visita — o que foi tratado com cada agência numa visita
--     (uma visita pode cobrir várias agências no mesmo dia)
-- --------------------------------------------------------------
create table app.agencia_visita (
  id                 bigint generated always as identity primary key,
  visita_id          bigint not null references app.visitas (id) on delete cascade,
  agencia_id         bigint not null references app.agencias (id) on delete restrict,
  faturamento_anual  text,
  produtos           jsonb not null default '[]'::jsonb,   -- lista que varia de tamanho
  atendentes         jsonb not null default '[]'::jsonb,
  acoes              jsonb not null default '[]'::jsonb     -- ações acordadas por setor
);
create index idx_agvisita_visita  on app.agencia_visita (visita_id);
create index idx_agvisita_agencia on app.agencia_visita (agencia_id);

-- --------------------------------------------------------------
-- 3.5 estresse_agencia — termômetro de relacionamento
--     Captura acontece no FORMULÁRIO; o CRM é somente leitura.
--     visita_id é opcional (estresse pode nascer fora de uma visita formal).
-- --------------------------------------------------------------
create table app.estresse_agencia (
  id            bigint generated always as identity primary key,
  agencia_id    bigint not null references app.agencias (id) on delete cascade,
  executivo_id  bigint references app.executivos (id) on delete set null, -- quem registrou
  visita_id     bigint references app.visitas (id) on delete set null,    -- opcional
  nivel         text not null check (nivel in ('Baixo', 'Médio', 'Alto', 'Crítico')),
  setores       jsonb not null default '[]'::jsonb,
  descricao     text,
  data_registro date not null default current_date,
  criado_em     timestamptz not null default now()
);
create index idx_estresse_agencia on app.estresse_agencia (agencia_id);

-- --------------------------------------------------------------
-- 3.6 despesas — gastos de viagem dos executivos
-- --------------------------------------------------------------
create table app.despesas (
  id            bigint generated always as identity primary key,
  executivo_id  bigint not null references app.executivos (id) on delete restrict,
  data          date not null,
  cartao        text,       -- Cartão Pessoal / Cartão Clara
  categoria     text,       -- Abastecimento, Hospedagem, etc.
  valor         numeric(12, 2) not null,
  status        text not null default 'Pendente'
                check (status in ('Pendente', 'Reembolsada', 'Não reembolsável')),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_despesas_executivo on app.despesas (executivo_id);

-- --------------------------------------------------------------
-- 3.7 notas_fiscais — comprovantes anexados a uma despesa (0..N)
-- --------------------------------------------------------------
create table app.notas_fiscais (
  id            bigint generated always as identity primary key,
  despesa_id    bigint not null references app.despesas (id) on delete cascade,
  arquivo_url   text not null,       -- caminho no Storage
  nome_arquivo  text,
  criado_em     timestamptz not null default now()
);
create index idx_notas_despesa on app.notas_fiscais (despesa_id);

-- --------------------------------------------------------------
-- 3.8 historico_agencia — linha do tempo completa da agência
--     Feed único: tudo que acontece na agência aparece aqui,
--     inclusive os registros de estresse (evento "Estresse").
-- --------------------------------------------------------------
create table app.historico_agencia (
  id            bigint generated always as identity primary key,
  agencia_id    bigint not null references app.agencias (id) on delete cascade,
  executivo_id  bigint references app.executivos (id) on delete set null, -- quem registrou
  tipo_evento   text not null,     -- Contato, Visita, Ligação, E-mail, Reunião, Nota, Ocorrência, Estresse...
  descricao     text,
  setor         text,              -- setor envolvido (opcional)
  origem        text not null default 'manual' check (origem in ('sistema', 'manual')),
  data_evento   date not null default current_date,
  criado_em     timestamptz not null default now()
);
create index idx_historico_agencia on app.historico_agencia (agencia_id);

-- --------------------------------------------------------------
-- Segurança: liga o RLS em TODAS as tabelas (deny-all até a fase 2).
-- Sem política = ninguém lê/escreve. Estado seguro por padrão.
-- --------------------------------------------------------------
alter table app.executivos       enable row level security;
alter table app.agencias         enable row level security;
alter table app.visitas          enable row level security;
alter table app.agencia_visita   enable row level security;
alter table app.estresse_agencia enable row level security;
alter table app.despesas         enable row level security;
alter table app.notas_fiscais    enable row level security;
alter table app.historico_agencia enable row level security;

-- ==================== 20260805130000_auth_rls.sql ====================
-- ==============================================================
-- FASE 2 — Auth + RLS por perfil
-- Princípio: o executivo vê o mundo dele; quem "vê tudo" é Administrador
-- ou Gestor (mesma regra do CRM em SessaoContexto.tsx).
--
-- O role de acesso é o `perfil` (espelha o tipo PerfilUsuario do CRM):
--   Administrador | Gestor | Executivo | Operacional
--
-- NOTA: o CRM tem um sistema mais rico (permissões por perfil + liberações/
-- feature flags + acesso do Operacional por setor). Isso vira tabelas numa
-- fase dedicada. Aqui o RLS cobre o essencial: "vê tudo" (Admin/Gestor) x
-- "vê o dele" (Executivo). O Operacional entra no refinamento seguinte.
-- ==============================================================

-- --------------------------------------------------------------
-- Permissões de tabela (o RLS filtra as LINHAS; o grant libera a TABELA)
-- --------------------------------------------------------------
grant usage on schema app to authenticated;
grant select, insert, update, delete on all tables in schema app to authenticated;
alter default privileges in schema app
  grant select, insert, update, delete on tables to authenticated;

-- service_role (usado pelas Edge Functions, ex.: listar-agencias) tambem precisa
-- acessar o schema `app` — senao a funcao recebe "permission denied for schema app".
grant usage on schema app to service_role;
grant select, insert, update, delete on all tables in schema app to service_role;
grant usage, select on all sequences in schema app to service_role;
alter default privileges in schema app
  grant select, insert, update, delete on tables to service_role;

-- --------------------------------------------------------------
-- Funções de apoio — rodam como dono (bypassam RLS), sem recursão.
-- --------------------------------------------------------------

-- id do executivo logado (ou NULL se não houver / inativo)
create or replace function app.executivo_atual()
returns bigint
language sql stable security definer
set search_path = app, public
as $$
  select e.id
  from app.executivos e
  where e.auth_id = auth.uid() and e.ativo
  limit 1
$$;

-- perfil do usuário logado (Administrador | Gestor | Executivo | Operacional)
create or replace function app.perfil_atual()
returns text
language sql stable security definer
set search_path = app, public
as $$
  select e.perfil
  from app.executivos e
  where e.auth_id = auth.uid() and e.ativo
  limit 1
$$;

-- o usuário logado "vê tudo"? (Administrador ou Gestor) — igual ao CRM
create or replace function app.ve_tudo()
returns boolean
language sql stable security definer
set search_path = app, public
as $$
  select exists (
    select 1 from app.executivos e
    where e.auth_id = auth.uid() and e.ativo
      and e.perfil in ('Administrador', 'Gestor')
  )
$$;

-- a agência é visível pro usuário logado? (vê tudo, ou é o responsável)
create or replace function app.agencia_visivel(p_agencia_id bigint)
returns boolean
language sql stable security definer
set search_path = app, public
as $$
  select app.ve_tudo() or exists (
    select 1 from app.agencias a
    where a.id = p_agencia_id and a.executivo_id = app.executivo_atual()
  )
$$;

-- a despesa é visível pro usuário logado?
create or replace function app.despesa_visivel(p_despesa_id bigint)
returns boolean
language sql stable security definer
set search_path = app, public
as $$
  select app.ve_tudo() or exists (
    select 1 from app.despesas d
    where d.id = p_despesa_id and d.executivo_id = app.executivo_atual()
  )
$$;

-- --------------------------------------------------------------
-- Gatilho: liga o login ao executivo cadastrado (pelo e-mail).
-- --------------------------------------------------------------
create or replace function app.on_auth_user_created()
returns trigger
language plpgsql security definer
set search_path = app, public
as $$
begin
  update app.executivos
     set auth_id = new.id
   where lower(email) = lower(new.email)
     and auth_id is null;
  return new;
end;
$$;

drop trigger if exists trg_link_executivo on auth.users;
create trigger trg_link_executivo
  after insert on auth.users
  for each row execute function app.on_auth_user_created();

-- ==============================================================
-- POLÍTICAS RLS  ("vê tudo" = Administrador/Gestor)
-- ==============================================================

-- ---- executivos: cada um vê a si; quem vê tudo gerencia todos ----
create policy executivos_select on app.executivos for select to authenticated
  using (app.ve_tudo() or auth_id = auth.uid());
create policy executivos_gestao_ins on app.executivos for insert to authenticated
  with check (app.ve_tudo());
create policy executivos_gestao_upd on app.executivos for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy executivos_gestao_del on app.executivos for delete to authenticated
  using (app.ve_tudo());

-- ---- agencias: executivo vê/edita as dele; criar/apagar = quem vê tudo ----
create policy agencias_select on app.agencias for select to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy agencias_ins on app.agencias for insert to authenticated
  with check (app.ve_tudo());
create policy agencias_upd on app.agencias for update to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual())
  with check (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy agencias_del on app.agencias for delete to authenticated
  using (app.ve_tudo());

-- ---- visitas: executivo vê/registra as suas; histórico não muda ----
create policy visitas_select on app.visitas for select to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy visitas_ins on app.visitas for insert to authenticated
  with check (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy visitas_gestao_upd on app.visitas for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy visitas_gestao_del on app.visitas for delete to authenticated
  using (app.ve_tudo());

-- ---- agencia_visita: segue a visibilidade da agência ----
create policy agvisita_select on app.agencia_visita for select to authenticated
  using (app.agencia_visivel(agencia_id));
create policy agvisita_ins on app.agencia_visita for insert to authenticated
  with check (app.agencia_visivel(agencia_id));
create policy agvisita_upd on app.agencia_visita for update to authenticated
  using (app.agencia_visivel(agencia_id)) with check (app.agencia_visivel(agencia_id));
create policy agvisita_gestao_del on app.agencia_visita for delete to authenticated
  using (app.ve_tudo());

-- ---- estresse_agencia: ENTRADA só do formulário (executivo grava o seu);
--      CRM é leitura → sem UPDATE por usuário comum (só quem vê tudo corrige) ----
create policy estresse_select on app.estresse_agencia for select to authenticated
  using (app.agencia_visivel(agencia_id));
create policy estresse_ins on app.estresse_agencia for insert to authenticated
  with check (executivo_id = app.executivo_atual() or app.ve_tudo());
create policy estresse_gestao_upd on app.estresse_agencia for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy estresse_gestao_del on app.estresse_agencia for delete to authenticated
  using (app.ve_tudo());

-- ---- despesas: executivo cuida das suas; quem vê tudo vê todas e muda status ----
create policy despesas_select on app.despesas for select to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy despesas_ins on app.despesas for insert to authenticated
  with check (executivo_id = app.executivo_atual() or app.ve_tudo());
create policy despesas_upd on app.despesas for update to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual())
  with check (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy despesas_del on app.despesas for delete to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());

-- ---- notas_fiscais: seguem a visibilidade da despesa ----
create policy notas_select on app.notas_fiscais for select to authenticated
  using (app.despesa_visivel(despesa_id));
create policy notas_ins on app.notas_fiscais for insert to authenticated
  with check (app.despesa_visivel(despesa_id));
create policy notas_upd on app.notas_fiscais for update to authenticated
  using (app.despesa_visivel(despesa_id)) with check (app.despesa_visivel(despesa_id));
create policy notas_del on app.notas_fiscais for delete to authenticated
  using (app.despesa_visivel(despesa_id));

-- ---- historico_agencia: segue a visibilidade da agência; edição = quem vê tudo ----
create policy historico_select on app.historico_agencia for select to authenticated
  using (app.agencia_visivel(agencia_id));
create policy historico_ins on app.historico_agencia for insert to authenticated
  with check (app.agencia_visivel(agencia_id));
create policy historico_gestao_upd on app.historico_agencia for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy historico_gestao_del on app.historico_agencia for delete to authenticated
  using (app.ve_tudo());

-- ==================== 20260806100000_agencias_view.sql ====================
-- ==============================================================
-- FASE 4 (ajuste) — agencias ganha o perfil completo + view do CRM
--
-- O CRM mostra endereço e o perfil comercial (faturamento/produtos/
-- atendentes) como atributos ATUAIS da agência. O PDF só tinha esses
-- por visita; aqui trazemos pra `agencias` (o histórico por visita
-- continua em `agencia_visita`).
--
-- A view `vw_agencias` entrega a agência no formato EXATO que a tela do
-- CRM espera, já com os campos derivados calculados (responsável,
-- total de visitas, última visita, nível de estresse atual).
-- security_invoker = as políticas RLS de cada tabela valem pro usuário
-- logado (Executivo vê as dele; Administrador/Gestor veem tudo).
-- ==============================================================

alter table app.agencias
  add column if not exists logradouro        text,
  add column if not exists bairro            text,
  add column if not exists cidade            text,
  add column if not exists cep               text,
  add column if not exists faturamento_anual text,
  add column if not exists produtos          jsonb not null default '[]'::jsonb,
  add column if not exists atendentes        jsonb not null default '[]'::jsonb;

create or replace view app.vw_agencias
with (security_invoker = true) as
select
  a.id,
  a.nome,
  coalesce(a.uf, '')                                as uf,
  coalesce(e.nome, '')                             as "executivoResponsavel",
  a.status,
  coalesce(v.total, 0)                             as "totalVisitas",
  coalesce(to_char(v.ultima, 'YYYY-MM-DD'), '')    as "ultimaVisita",
  coalesce(es.nivel, 'Baixo')                      as "nivelEstresseAtual",
  coalesce(to_char(a.data_fundacao, 'YYYY-MM-DD'), '') as "dataFundacao",
  coalesce(a.faturamento_anual, '')                as "faturamentoAnual",
  coalesce(a.produtos, '[]'::jsonb)                as produtos,
  coalesce(a.atendentes, '[]'::jsonb)              as atendentes,
  coalesce(a.logradouro, '')                       as logradouro,
  coalesce(a.bairro, '')                           as bairro,
  coalesce(a.cidade, '')                           as cidade,
  coalesce(a.cep, '')                              as cep
from app.agencias a
left join app.executivos e on e.id = a.executivo_id
left join lateral (
  select count(*) as total, max(vi.data_visita) as ultima
  from app.agencia_visita av
  join app.visitas vi on vi.id = av.visita_id
  where av.agencia_id = a.id
) v on true
left join lateral (
  select ea.nivel
  from app.estresse_agencia ea
  where ea.agencia_id = a.id
  order by ea.data_registro desc, ea.id desc
  limit 1
) es on true;

grant select on app.vw_agencias to authenticated;

-- ==================== 20260806140000_agencias_cnpj_comissao.sql ====================
-- ==============================================================
-- FASE 6 (schema) — campos vindos da planilha do Infotravel
-- A planilha traz CNPJ e Comissão por agência, e o "Promotor" (executivo).
-- O e-mail do executivo passa a ser opcional: os promotores entram sem
-- login (cada um ganha acesso quando for cadastrado no Auth).
-- ==============================================================

alter table app.agencias
  add column if not exists cnpj     text,   -- CNPJ da agência
  add column if not exists comissao text;   -- faixa de comissão (ex.: "AG PADRÃO 12%")

-- Promotores importados são executivos sem login → e-mail opcional.
alter table app.executivos alter column email drop not null;

-- ==================== 20260807100000_ocorrencias.sql ====================
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
-- (drop antes do create: essas políticas vivem no schema `storage`, então o
--  "drop schema app cascade" não as remove — o guard deixa re-rodar sem erro)
drop policy if exists "anexos ocor leitura" on storage.objects;
create policy "anexos ocor leitura" on storage.objects for select to authenticated
  using (bucket_id = 'ocorrencia-anexos');
drop policy if exists "anexos ocor upload" on storage.objects;
create policy "anexos ocor upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'ocorrencia-anexos');
drop policy if exists "anexos ocor delete" on storage.objects;
create policy "anexos ocor delete" on storage.objects for delete to authenticated
  using (bucket_id = 'ocorrencia-anexos' and app.ve_tudo());

-- ==================== 20260807110000_notificacoes.sql ====================
-- ==============================================================
-- NOTIFICAÇÕES (o sino) — criadas pelo SERVIDOR.
-- Um gatilho: ao abrir uma ocorrência com setor, cria a notificação
-- para cada executivo ATIVO daquele setor. Assim o cliente não decide
-- destinatário — só busca "as minhas".
-- ==============================================================

create table app.notificacoes (
  id                bigint generated always as identity primary key,
  para_executivo_id bigint not null references app.executivos (id) on delete cascade,
  titulo            text not null,
  descricao         text,
  setor             text,
  agencia_id        bigint references app.agencias (id) on delete cascade,
  lida              boolean not null default false,
  criado_em         timestamptz not null default now()
);
create index idx_notificacoes_para on app.notificacoes (para_executivo_id);

alter table app.notificacoes enable row level security;

-- Cada um vê/mexe nas suas; quem vê tudo também consegue ler
create policy notif_select on app.notificacoes for select to authenticated
  using (para_executivo_id = app.executivo_atual() or app.ve_tudo());
create policy notif_upd on app.notificacoes for update to authenticated
  using (para_executivo_id = app.executivo_atual())
  with check (para_executivo_id = app.executivo_atual());
create policy notif_del on app.notificacoes for delete to authenticated
  using (para_executivo_id = app.executivo_atual() or app.ve_tudo());

-- Gatilho: abriu ocorrência com setor → notifica os executivos do setor.
-- (Sem política de INSERT pra usuário: só o gatilho grava, como SECURITY DEFINER.)
create or replace function app.on_ocorrencia_criada()
returns trigger language plpgsql security definer set search_path = app, public as $$
declare
  v_agencia text;
begin
  if new.setor is null then
    return new;
  end if;
  select nome into v_agencia from app.agencias where id = new.agencia_id;
  insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
  select e.id,
         'Nova ocorrência · ' || new.setor,
         coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
         new.setor,
         new.agencia_id
    from app.executivos e
   where e.ativo and e.setor = new.setor;
  return new;
end;
$$;

drop trigger if exists trg_ocorrencia_notifica on app.ocorrencias;
create trigger trg_ocorrencia_notifica
  after insert on app.ocorrencias
  for each row execute function app.on_ocorrencia_criada();

-- ==================== 20260807120000_permissoes_liberacoes.sql ====================
-- ==============================================================
-- PERMISSÕES & LIBERAÇÕES (admin) — configuração de acesso do CRM.
--   permissoes        = catálogo (o que existe pra permitir)
--   perfil_permissoes = quais permissões cada perfil concede
--   liberacoes        = feature flags (ligar/desligar sem código)
-- Todos autenticados LEEM (o app precisa saber o que pode); só quem
-- vê tudo (Admin/Gestor) EDITA. O back-end é a fonte da verdade.
-- ==============================================================

-- --------- Catálogo de permissões ---------
create table app.permissoes (
  chave     text primary key,
  rotulo    text not null,
  descricao text
);
insert into app.permissoes (chave, rotulo, descricao) values
  ('ver_todos_dados', 'Ver todos os dados', 'Enxerga dados de todos os executivos (não só os próprios).'),
  ('acompanhar_ocorrencias', 'Acompanhar ocorrências', 'Recebe e trata as ocorrências direcionadas ao seu setor.'),
  ('editar_status_despesa', 'Editar status de reembolso', 'Alterna uma despesa entre Pendente e Reembolsada.'),
  ('marcar_nao_reembolsavel', 'Marcar como não reembolsável', 'Define despesas como não reembolsáveis (decisão da gestão).'),
  ('gerenciar_agencias', 'Gerenciar agências', 'Edita status e dados cadastrais das agências.'),
  ('gerenciar_usuarios', 'Gerenciar usuários', 'Acessa a administração de usuários e acessos.'),
  ('importar_agencias', 'Importar agências', 'Sobe a planilha do Infotera para atualizar a base.')
on conflict (chave) do nothing;

-- --------- Mapa perfil → permissões ---------
create table app.perfil_permissoes (
  perfil          text not null
                  check (perfil in ('Administrador', 'Gestor', 'Executivo', 'Operacional')),
  permissao_chave text not null references app.permissoes (chave) on delete cascade,
  primary key (perfil, permissao_chave)
);
-- Administrador = todas
insert into app.perfil_permissoes (perfil, permissao_chave)
  select 'Administrador', chave from app.permissoes
on conflict do nothing;
-- Gestor = 5
insert into app.perfil_permissoes (perfil, permissao_chave) values
  ('Gestor', 'ver_todos_dados'),
  ('Gestor', 'acompanhar_ocorrencias'),
  ('Gestor', 'editar_status_despesa'),
  ('Gestor', 'marcar_nao_reembolsavel'),
  ('Gestor', 'gerenciar_agencias')
on conflict do nothing;
-- Executivo / Operacional
insert into app.perfil_permissoes (perfil, permissao_chave) values
  ('Executivo', 'editar_status_despesa'),
  ('Operacional', 'acompanhar_ocorrencias')
on conflict do nothing;

-- --------- Liberações (feature flags) ---------
create table app.liberacoes (
  chave     text primary key,
  nome      text not null,
  descricao text,
  ativa     boolean not null default false
);
insert into app.liberacoes (chave, nome, descricao, ativa) values
  ('envio_email_relatorio', 'Envio de relatório por e-mail', 'Libera os botões de enviar relatórios por e-mail.', true),
  ('importacao_infotera', 'Importação de agências (Infotera)', 'Permite subir a planilha para atualizar a base de agências.', false),
  ('kanban_ocorrencias', 'Kanban de ocorrências', 'Quadro de arrastar as ocorrências entre as colunas de situação.', false)
on conflict (chave) do nothing;

-- --------- Segurança (RLS) ---------
alter table app.permissoes        enable row level security;
alter table app.perfil_permissoes enable row level security;
alter table app.liberacoes        enable row level security;

-- leitura: todo usuário logado (o app precisa saber o que é permitido)
create policy perm_select  on app.permissoes        for select to authenticated using (true);
create policy pperm_select on app.perfil_permissoes for select to authenticated using (true);
create policy lib_select   on app.liberacoes        for select to authenticated using (true);

-- edição: só quem vê tudo (Administrador/Gestor)
create policy pperm_ins on app.perfil_permissoes for insert to authenticated with check (app.ve_tudo());
create policy pperm_del on app.perfil_permissoes for delete to authenticated using (app.ve_tudo());
create policy lib_upd   on app.liberacoes for update to authenticated using (app.ve_tudo()) with check (app.ve_tudo());

-- ==================== 20260808100000_ocorrencia_gravidade_repasse_reembolso.sql ====================
-- ==============================================================
-- OCORRÊNCIAS: gravidade (1–5) + responsável (repasse) + notificação
-- REEMBOLSO: Executivo deixa de editar o status (só Admin/Gestor alteram)
--
-- Rode no SQL Editor do Supabase (schema app). É idempotente:
-- pode rodar de novo sem quebrar (if not exists / drop trigger if exists).
-- ==============================================================

-- --------- Ocorrências: campos novos ---------
alter table app.ocorrencias
  add column if not exists gravidade smallint not null default 3
    check (gravidade between 1 and 5),
  add column if not exists responsavel_id bigint
    references app.executivos (id) on delete set null;

-- "as ocorrências que caíram pra mim"
create index if not exists idx_ocorrencias_responsavel
  on app.ocorrencias (responsavel_id);

-- --------- Repasse: notifica o novo responsável ---------
-- Ao mudar responsavel_id (repassar a ocorrência), cria a notificação
-- do sino pra pessoa escolhida. Server-side (SECURITY DEFINER), igual ao
-- gatilho de abertura — o cliente não decide o destinatário sozinho.
create or replace function app.on_ocorrencia_repassada()
returns trigger language plpgsql security definer set search_path = app, public as $$
declare
  v_agencia text;
begin
  -- só quando o responsável muda pra alguém (não-nulo e diferente do anterior)
  if new.responsavel_id is null
     or new.responsavel_id is not distinct from old.responsavel_id then
    return new;
  end if;
  select nome into v_agencia from app.agencias where id = new.agencia_id;
  insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
  values (
    new.responsavel_id,
    'Ocorrência repassada a você',
    coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
    new.setor,
    new.agencia_id
  );
  return new;
end;
$$;

drop trigger if exists trg_ocorrencia_repassada on app.ocorrencias;
create trigger trg_ocorrencia_repassada
  after update on app.ocorrencias
  for each row execute function app.on_ocorrencia_repassada();

-- --------- Reembolso: Executivo não edita mais o status ---------
-- A permissão 'editar_status_despesa' já existe no catálogo; aqui só a
-- REMOVEMOS do perfil Executivo. Administrador e Gestor continuam com ela
-- (e dá pra reconfigurar na tela de Admin depois). Executivo passa a só ver.
delete from app.perfil_permissoes
 where perfil = 'Executivo' and permissao_chave = 'editar_status_despesa';

-- ==================== 20260808110000_ocorrencia_datas.sql ====================
-- ==============================================================
-- OCORRÊNCIAS: data de início (quando entra "Em andamento").
-- A data de finalização já existe (data_resolucao). Um gatilho carimba
-- início/fim automaticamente conforme a situação muda (server-side).
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ==============================================================

alter table app.ocorrencias
  add column if not exists data_inicio date;

-- Carimba as datas conforme a situação muda:
--   Em andamento -> registra data_inicio (só na 1ª vez)
--   Resolvido    -> registra data_resolucao; sair de Resolvido limpa
create or replace function app.on_ocorrencia_situacao()
returns trigger language plpgsql set search_path = app, public as $$
begin
  if new.situacao = 'Em andamento' and new.data_inicio is null then
    new.data_inicio := current_date;
  end if;
  if new.situacao = 'Resolvido' then
    if new.data_resolucao is null then
      new.data_resolucao := current_date;
    end if;
  else
    new.data_resolucao := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ocorrencia_situacao on app.ocorrencias;
create trigger trg_ocorrencia_situacao
  before update on app.ocorrencias
  for each row execute function app.on_ocorrencia_situacao();

-- ==================== 20260808120000_ocorrencia_prazo.sql ====================
-- ==============================================================
-- OCORRÊNCIAS: prazo (data-limite pra concluir) + o responsável
-- escolhido NA ABERTURA também é notificado.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ==============================================================

alter table app.ocorrencias
  add column if not exists prazo date;

-- Recria on_ocorrencia_criada: notifica o SETOR (como antes) E o
-- RESPONSÁVEL escolhido na abertura (se houver e não for do mesmo setor,
-- pra não duplicar a notificação).
create or replace function app.on_ocorrencia_criada()
returns trigger language plpgsql security definer set search_path = app, public as $$
declare
  v_agencia text;
begin
  select nome into v_agencia from app.agencias where id = new.agencia_id;

  if new.setor is not null then
    insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
    select e.id,
           'Nova ocorrência · ' || new.setor,
           coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
           new.setor,
           new.agencia_id
      from app.executivos e
     where e.ativo and e.setor = new.setor;
  end if;

  if new.responsavel_id is not null then
    insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
    select new.responsavel_id,
           'Você é responsável por uma ocorrência',
           coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
           new.setor,
           new.agencia_id
     where not exists (
       select 1 from app.executivos e
        where e.id = new.responsavel_id and e.ativo
          and e.setor is not distinct from new.setor
     );
  end if;

  return new;
end;
$$;
-- (o gatilho trg_ocorrencia_notifica já aponta pra essa função)

-- ==================== 20260822100000_trajetos.sql ====================
create table if not exists app.trajetos (
  id            bigint generated always as identity primary key,
  executivo_id  bigint not null references app.executivos (id) on delete restrict,
  data          date not null,
  partida       text,
  destino       text,
  km            numeric(10, 2) not null default 0,
  reembolso     numeric(12, 2) not null default 0,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_trajetos_executivo on app.trajetos (executivo_id);
alter table app.trajetos enable row level security;
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
grant select, insert, update, delete on app.trajetos to authenticated;
grant select, insert, update, delete on app.trajetos to service_role;

-- ==================== exposicao do schema a API ====================
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, app';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

-- ==================== admin (TROQUE pelo SEU nome e e-mail do login) ====================
-- IMPORTANTE: use o MESMO e-mail que voce cria em Authentication -> Add user,
-- senao o vinculo (auth_id) abaixo nao acontece e o admin nao enxerga os dados.
insert into app.executivos (nome, email, perfil, ativo)
values ('Seu Nome', 'seu-email@exemplo.com', 'Administrador', true)
on conflict (email) do update set perfil = 'Administrador', ativo = true;
-- liga ao login que voce ja criou no Auth (por e-mail):
update app.executivos e set auth_id = u.id
from auth.users u where lower(e.email) = lower(u.email) and e.auth_id is null;
