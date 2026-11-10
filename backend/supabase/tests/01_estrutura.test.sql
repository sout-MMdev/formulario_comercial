-- ================================================================
-- TESTE 01 — ESTRUTURA DO BANCO
-- Confere o que a migration promete: as 9 tabelas, RLS ligado em
-- todas, nenhum acesso para anon/authenticated (só as Edge Functions,
-- com a chave de serviço, falam com o banco), índice em toda chave
-- estrangeira, os dados fictícios do seed e as regras de integridade.
--
-- Rodar:  npm run backend:testar-banco
-- ================================================================

begin;
create extension if not exists pgtap with schema extensions;

select plan(52);

-- ── As 9 tabelas existem ──────────────────────────────────────────
select has_table('public', t, format('tabela %s existe', t))
from unnest(array[
  'executivos', 'agencias', 'relatorios', 'visitas_agencias',
  'registros_estresse', 'acoes_acordadas', 'trajetos', 'despesas',
  'emails_enviados'
]) as t;

-- ── RLS ligado em todas ───────────────────────────────────────────
select ok(c.relrowsecurity, format('RLS ligado em %s', c.relname))
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = any(array[
    'executivos', 'agencias', 'relatorios', 'visitas_agencias',
    'registros_estresse', 'acoes_acordadas', 'trajetos', 'despesas',
    'emails_enviados'
  ])
order by c.relname;

-- ── Nenhum privilégio para anon e authenticated ───────────────────
select table_privs_are('public', t, 'anon', array[]::text[],
  format('anon sem acesso a %s', t))
from unnest(array[
  'executivos', 'agencias', 'relatorios', 'visitas_agencias',
  'registros_estresse', 'acoes_acordadas', 'trajetos', 'despesas',
  'emails_enviados'
]) as t;

select table_privs_are('public', t, 'authenticated', array[]::text[],
  format('authenticated sem acesso a %s', t))
from unnest(array[
  'executivos', 'agencias', 'relatorios', 'visitas_agencias',
  'registros_estresse', 'acoes_acordadas', 'trajetos', 'despesas',
  'emails_enviados'
]) as t;

-- ── A negação é explícita: uma política "sem acesso pelo navegador" ──
select policies_are('public', t, array['sem acesso pelo navegador'],
  format('%s tem só a política que nega acesso ao navegador', t))
from unnest(array[
  'executivos', 'agencias', 'relatorios', 'visitas_agencias',
  'registros_estresse', 'acoes_acordadas', 'trajetos', 'despesas',
  'emails_enviados'
]) as t;

-- ── Toda chave estrangeira tem índice ─────────────────────────────
select is_empty($$
  select c.conrelid::regclass::text, a.attname
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
  join pg_namespace n on n.oid = (select relnamespace from pg_class where oid = c.conrelid)
  where c.contype = 'f'
    and n.nspname = 'public'
    and not exists (
      select 1 from pg_index i
      where i.indrelid = c.conrelid and i.indkey[0] = a.attnum
    )
$$, 'toda chave estrangeira tem índice');

-- ── Enums com os valores do front ─────────────────────────────────
select enum_has_labels('public', 'nivel_estresse',
  array['Baixo', 'Médio', 'Alto', 'Crítico'], 'níveis do termômetro de estresse');
select enum_has_labels('public', 'tipo_cartao',
  array['Cartão Pessoal', 'Cartão Clara'], 'tipos de cartão');

-- ── Seed fictício ─────────────────────────────────────────────────
select results_eq('select count(*)::int from public.executivos', array[12],
  'seed tem 12 executivos fictícios');
select results_eq('select count(*)::int from public.agencias', array[24],
  'seed tem 24 agências fictícias');

-- ── Regras de integridade ─────────────────────────────────────────
-- Monta um relatório e uma visita só para testar o estresse.
insert into public.relatorios (
  executivo_id, id_cliente, fluxos, total_km, total_pessoal,
  total_abastecimento_clara, total_final, km_rodado
)
select id, 999001, array['visita'], 0, 0, 0, 0, 0
from public.executivos order by id limit 1;

insert into public.visitas_agencias (relatorio_id, nome_agencia)
select id, 'Agência de teste' from public.relatorios where id_cliente = 999001;

select throws_ok($$
  insert into public.registros_estresse (visita_agencia_id, nivel, descricao)
  select id, 'Alto', '   ' from public.visitas_agencias
  where nome_agencia = 'Agência de teste'
$$, '23514', null, 'estresse Alto sem descrição é recusado');

select throws_ok($$
  insert into public.agencias (nome) values ('  turismo aurora ')
$$, '23505', null, 'agência repetida (maiúsculas e espaços) é recusada');

select * from finish();
rollback;
