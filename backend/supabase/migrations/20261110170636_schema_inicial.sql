-- ================================================================
-- MIGRATION — SCHEMA INICIAL
--
-- Modelo (um relatório = um dia preenchido por um executivo):
--
--   executivos ─┐
--               └─< relatorios ─┬─< visitas_agencias ─┬─< registros_estresse
--   agencias ───────────────────┘   (agencia_id)      └─< acoes_acordadas
--                               ├─< trajetos
--                               ├─< despesas
--                               └─< emails_enviados
--
-- Segurança: RLS ligado em todas as tabelas e NENHUM privilégio para
-- anon/authenticated. Quem fala com o banco são só as Edge Functions,
-- com a chave de serviço; o navegador nunca acessa as tabelas.
-- ================================================================

-- ── Tipos ────────────────────────────────────────────────────────
-- Os mesmos valores do front (packages/nucleo/src/tipos).
create type public.nivel_estresse as enum ('Baixo', 'Médio', 'Alto', 'Crítico');
create type public.tipo_cartao as enum ('Cartão Pessoal', 'Cartão Clara');

-- ── Cadastros ────────────────────────────────────────────────────
create table public.executivos (
  id bigint generated always as identity primary key,
  nome text not null unique check (btrim(nome) <> ''),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  tarifa_km numeric(6, 2) not null check (tarifa_km > 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
comment on table public.executivos is
  'Executivos de contas. A tarifa por km fica aqui: o servidor recalcula o reembolso com ela, sem confiar no valor enviado pelo navegador.';

create table public.agencias (
  id bigint generated always as identity primary key,
  nome text not null check (btrim(nome) <> '')
);
-- "Turismo Aurora" e "  turismo aurora " são a mesma agência.
create unique index agencias_nome_normalizado_key
  on public.agencias (lower(btrim(nome)));
comment on table public.agencias is
  'Agências de viagem atendidas. O nome é único sem diferenciar maiúsculas nem espaços nas pontas.';

-- ── Relatório do dia ─────────────────────────────────────────────
create table public.relatorios (
  id bigint generated always as identity primary key,
  executivo_id bigint not null references public.executivos (id),
  -- id gerado pelo app (DiaSalvo.id); com executivo_id torna o envio idempotente.
  id_cliente bigint not null,
  fluxos text[] not null check (
    cardinality(fluxos) > 0 and fluxos <@ array['visita', 'despesas']::text[]
  ),
  data_visita date,
  total_km numeric(12, 2) not null,
  total_pessoal numeric(12, 2) not null,
  total_abastecimento_clara numeric(12, 2) not null,
  total_final numeric(12, 2) not null,
  km_rodado numeric(10, 2) not null,
  recebido_em timestamptz not null default now(),
  -- Também serve de índice para a FK executivo_id (primeira coluna).
  unique (executivo_id, id_cliente)
);
comment on table public.relatorios is
  'Um dia preenchido por um executivo. Os totais são calculados no servidor.';

create table public.visitas_agencias (
  id bigint generated always as identity primary key,
  relatorio_id bigint not null references public.relatorios (id) on delete cascade,
  agencia_id bigint references public.agencias (id),
  nome_agencia text not null,
  data_fundacao date,
  faturamento_anual text,
  faturamento_anual_rotulo text,
  produtos text[] not null default '{}',
  atendentes text[] not null default '{}',
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text
);
create index visitas_agencias_relatorio_id_idx on public.visitas_agencias (relatorio_id);
create index visitas_agencias_agencia_id_idx on public.visitas_agencias (agencia_id);
comment on table public.visitas_agencias is
  'Agência visitada no dia, com os dados comerciais. agencia_id fica nulo quando o nome não está no cadastro.';

create table public.registros_estresse (
  id bigint generated always as identity primary key,
  visita_agencia_id bigint not null references public.visitas_agencias (id) on delete cascade,
  nivel public.nivel_estresse not null,
  setores text[] not null default '{}',
  descricao text,
  -- Mesma regra do front: a partir de "Médio" a descrição é obrigatória.
  check (nivel = 'Baixo' or nullif(btrim(descricao), '') is not null)
);
create index registros_estresse_visita_agencia_id_idx
  on public.registros_estresse (visita_agencia_id);
comment on table public.registros_estresse is
  'Termômetro de estresse por setor da agência.';

create table public.acoes_acordadas (
  id bigint generated always as identity primary key,
  visita_agencia_id bigint not null references public.visitas_agencias (id) on delete cascade,
  setor text not null,
  detalhe text not null
);
create index acoes_acordadas_visita_agencia_id_idx
  on public.acoes_acordadas (visita_agencia_id);
comment on table public.acoes_acordadas is
  'Ações combinadas com um setor da agência durante a visita.';

-- ── Despesas do dia ──────────────────────────────────────────────
create table public.trajetos (
  id bigint generated always as identity primary key,
  relatorio_id bigint not null references public.relatorios (id) on delete cascade,
  data date,
  partida text,
  destino text,
  km numeric(10, 2) not null check (km >= 0),
  -- Tarifa usada no cálculo, guardada para o histórico não mudar se a tarifa mudar.
  tarifa_km numeric(6, 2) not null,
  reembolso numeric(12, 2) not null
);
create index trajetos_relatorio_id_idx on public.trajetos (relatorio_id);
comment on table public.trajetos is
  'Trajetos rodados no dia; o reembolso é km × tarifa do executivo.';

create table public.despesas (
  id bigint generated always as identity primary key,
  relatorio_id bigint not null references public.relatorios (id) on delete cascade,
  data date,
  cartao public.tipo_cartao,
  categoria text,
  valor numeric(12, 2) not null check (valor >= 0),
  nome_comprovante text
);
create index despesas_relatorio_id_idx on public.despesas (relatorio_id);
comment on table public.despesas is
  'Despesas com cartão. Só o nome do comprovante é guardado (sem upload de arquivo).';

-- ── Auditoria do e-mail ──────────────────────────────────────────
create table public.emails_enviados (
  id bigint generated always as identity primary key,
  relatorio_id bigint not null references public.relatorios (id) on delete cascade,
  destino text not null,
  assunto text not null,
  situacao text not null check (situacao in ('enviado', 'falhou')),
  detalhe_erro text,
  criado_em timestamptz not null default now()
);
create index emails_enviados_relatorio_id_idx on public.emails_enviados (relatorio_id);
comment on table public.emails_enviados is
  'Cada tentativa de enviar a cópia por e-mail, com sucesso ou falha.';

-- ── Segurança ────────────────────────────────────────────────────
-- RLS ligado e sem políticas: anon e authenticated não leem nem gravam nada.
alter table public.executivos enable row level security;
alter table public.agencias enable row level security;
alter table public.relatorios enable row level security;
alter table public.visitas_agencias enable row level security;
alter table public.registros_estresse enable row level security;
alter table public.acoes_acordadas enable row level security;
alter table public.trajetos enable row level security;
alter table public.despesas enable row level security;
alter table public.emails_enviados enable row level security;

-- Política explícita que nega tudo ao navegador. Sem ela o efeito seria o
-- mesmo (RLS sem política já nega), mas assim a intenção fica escrita.
-- A chave de serviço das Edge Functions ignora RLS e continua funcionando.
do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'executivos', 'agencias', 'relatorios', 'visitas_agencias',
    'registros_estresse', 'acoes_acordadas', 'trajetos', 'despesas',
    'emails_enviados'
  ] loop
    execute format(
      'create policy "sem acesso pelo navegador" on public.%I
         for all to anon, authenticated using (false) with check (false)',
      tabela
    );
  end loop;
end
$$;

-- O Supabase dá privilégios padrão a anon/authenticated em tabelas novas;
-- aqui eles são retirados (defesa em profundidade, além do RLS).
revoke all on
  public.executivos, public.agencias, public.relatorios,
  public.visitas_agencias, public.registros_estresse, public.acoes_acordadas,
  public.trajetos, public.despesas, public.emails_enviados
from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
