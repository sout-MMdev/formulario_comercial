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
