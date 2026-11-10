-- ================================================================
-- TESTE 02 — registrar_relatorio(payload)
-- A função grava um relatório inteiro numa transação só:
--   * primeira vez: grava tudo e devolve novo = true;
--   * reenvio (mesmo executivo + id_cliente): não duplica nada;
--   * liga a visita à agência do cadastro ignorando maiúsculas/espaços;
--   * se um item for inválido, nada fica gravado (tudo ou nada);
--   * só a chave de serviço (service_role) pode chamar a função.
--
-- Rodar:  npm run backend:testar-banco
-- ================================================================

begin;
create extension if not exists pgtap with schema extensions;

select plan(25);

-- Payload de teste: executivo PAULO SOUZA (tarifa 1,30), 2 agências
-- (uma do cadastro escrita "  turismo AURORA ", outra desconhecida),
-- 2 trajetos e 2 despesas. Totais coerentes com os itens.
create function pg_temp.payload(id_cliente bigint) returns jsonb
language sql as $$
  select jsonb_build_object(
    'executivo_id', (select id from public.executivos where nome = 'PAULO SOUZA'),
    'id_cliente', id_cliente
  ) || $json${
    "fluxos": ["visita", "despesas"],
    "data_visita": "2026-11-05",
    "total_km": 32.5, "total_pessoal": 45.9, "total_abastecimento_clara": 30,
    "total_final": 48.4, "km_rodado": 25,
    "agencias": [
      { "nome": "  turismo AURORA ", "data_fundacao": "2010-03-01",
        "faturamento_anual": "1000000", "faturamento_anual_rotulo": "R$ 1 milhão",
        "produtos": ["Aéreo", "Hotel"], "atendentes": ["Atendente Teste"],
        "cep": "90000-000", "logradouro": "Rua Teste", "numero": "10",
        "complemento": null, "bairro": "Centro", "cidade": "Porto Alegre", "uf": "RS",
        "estresses": [{ "nivel": "Alto", "setores": ["Financeiro"], "descricao": "Atraso no repasse." }],
        "acoes": [{ "setor": "Financeiro", "detalhe": "Enviar extrato até sexta." }] },
      { "nome": "Agência Desconhecida Teste", "data_fundacao": null,
        "faturamento_anual": null, "faturamento_anual_rotulo": null,
        "produtos": [], "atendentes": [], "cep": null, "logradouro": null, "numero": null,
        "complemento": null, "bairro": null, "cidade": null, "uf": null,
        "estresses": [], "acoes": [] }
    ],
    "trajetos": [
      { "data": "2026-11-05", "partida": "Porto Alegre - RS", "destino": "Canoas - RS",
        "km": 10, "tarifa_km": 1.3, "reembolso": 13 },
      { "data": null, "partida": "Canoas - RS", "destino": "Porto Alegre - RS",
        "km": 15, "tarifa_km": 1.3, "reembolso": 19.5 }
    ],
    "despesas": [
      { "data": "2026-11-05", "cartao": "Cartão Pessoal", "categoria": "Refeição",
        "valor": 45.9, "nome_comprovante": "nota-refeicao.jpg" },
      { "data": null, "cartao": "Cartão Clara", "categoria": "Abastecimento",
        "valor": 30, "nome_comprovante": null }
    ]
  }$json$::jsonb
$$;

-- ── gravacao_completa ────────────────────────────────────────────
create temp table primeira as
  select * from public.registrar_relatorio(pg_temp.payload(777001));

select is((select novo from primeira), true, 'gravacao_completa: primeiro envio é novo');
select is((select email_ja_enviado from primeira), false,
  'gravacao_completa: ainda sem e-mail enviado');
select is((select count(*)::int from public.relatorios where id_cliente = 777001), 1,
  'gravacao_completa: 1 relatório');
select is((select count(*)::int from public.visitas_agencias v
           join primeira p on v.relatorio_id = p.relatorio_id), 2,
  'gravacao_completa: 2 visitas');
select is((select count(*)::int from public.registros_estresse e
           join public.visitas_agencias v on v.id = e.visita_agencia_id
           join primeira p on v.relatorio_id = p.relatorio_id), 1,
  'gravacao_completa: 1 registro de estresse');
select is((select count(*)::int from public.acoes_acordadas a
           join public.visitas_agencias v on v.id = a.visita_agencia_id
           join primeira p on v.relatorio_id = p.relatorio_id), 1,
  'gravacao_completa: 1 ação acordada');
select is((select count(*)::int from public.trajetos t
           join primeira p on t.relatorio_id = p.relatorio_id), 2,
  'gravacao_completa: 2 trajetos');
select is((select count(*)::int from public.despesas d
           join primeira p on d.relatorio_id = p.relatorio_id), 2,
  'gravacao_completa: 2 despesas');
select results_eq(
  $$select t.data, t.km, t.tarifa_km, t.reembolso from public.trajetos t
    join primeira p on t.relatorio_id = p.relatorio_id order by t.id$$,
  $$values ('2026-11-05'::date, 10.00::numeric, 1.30::numeric, 13.00::numeric),
           (null::date, 15.00, 1.30, 19.50)$$,
  'gravacao_completa: trajetos com data opcional, km, tarifa e reembolso');
select results_eq(
  $$select r.data_visita, r.total_km, r.total_pessoal, r.total_abastecimento_clara,
           r.total_final, r.km_rodado, r.fluxos
    from public.relatorios r join primeira p on r.id = p.relatorio_id$$,
  $$values ('2026-11-05'::date, 32.50::numeric, 45.90::numeric, 30.00::numeric,
            48.40::numeric, 25.00::numeric, array['visita', 'despesas'])$$,
  'gravacao_completa: totais e fluxos gravados');

-- ── reenvio_nao_duplica ──────────────────────────────────────────
create temp table segunda as
  select * from public.registrar_relatorio(pg_temp.payload(777001));

select is((select novo from segunda), false, 'reenvio_nao_duplica: reenvio não é novo');
select is((select relatorio_id from segunda), (select relatorio_id from primeira),
  'reenvio_nao_duplica: devolve o mesmo relatório');
select is((select count(*)::int from public.relatorios where id_cliente = 777001), 1,
  'reenvio_nao_duplica: continua 1 relatório');
select is((select count(*)::int from public.visitas_agencias v
           join primeira p on v.relatorio_id = p.relatorio_id), 2,
  'reenvio_nao_duplica: continuam 2 visitas');

-- ── liga_agencia_normalizada ─────────────────────────────────────
select is(
  (select v.agencia_id from public.visitas_agencias v
   join primeira p on v.relatorio_id = p.relatorio_id
   where v.nome_agencia = 'turismo AURORA'),
  (select id from public.agencias where nome = 'Turismo Aurora'),
  'liga_agencia_normalizada: "  turismo AURORA " liga em Turismo Aurora');
select is(
  (select v.agencia_id from public.visitas_agencias v
   join primeira p on v.relatorio_id = p.relatorio_id
   where v.nome_agencia = 'Agência Desconhecida Teste'),
  null::bigint,
  'liga_agencia_normalizada: nome fora do cadastro fica sem agencia_id');

-- ── tudo_ou_nada ─────────────────────────────────────────────────
select throws_ok(
  $$select * from public.registrar_relatorio(jsonb_set(
      pg_temp.payload(777002), '{agencias,0,estresses,0}',
      '{"nivel": "Crítico", "setores": ["Comercial"], "descricao": "  "}'))$$,
  '23514', null, 'tudo_ou_nada: estresse Crítico sem descrição é recusado');
select is((select count(*)::int from public.relatorios where id_cliente = 777002), 0,
  'tudo_ou_nada: nada do relatório recusado ficou gravado');

-- ── email_ja_enviado ─────────────────────────────────────────────
insert into public.emails_enviados (relatorio_id, destino, assunto, situacao, detalhe_erro)
select relatorio_id, 'teste@empresa.exemplo', 'Assunto de teste', 'falhou', 'caixa cheia'
from primeira;
select is(
  (select email_ja_enviado from public.registrar_relatorio(pg_temp.payload(777001))),
  false, 'email_ja_enviado: uma tentativa que falhou não conta');

insert into public.emails_enviados (relatorio_id, destino, assunto, situacao)
select relatorio_id, 'teste@empresa.exemplo', 'Assunto de teste', 'enviado'
from primeira;
select is(
  (select email_ja_enviado from public.registrar_relatorio(pg_temp.payload(777001))),
  true, 'email_ja_enviado: reenvio avisa que a cópia já foi enviada');

-- ── Segurança da função ──────────────────────────────────────────
select function_privs_are('public', 'registrar_relatorio', array['jsonb'],
  'anon', array[]::text[], 'anon não executa registrar_relatorio');
select function_privs_are('public', 'registrar_relatorio', array['jsonb'],
  'authenticated', array[]::text[], 'authenticated não executa registrar_relatorio');
select function_privs_are('public', 'registrar_relatorio', array['jsonb'],
  'service_role', array['EXECUTE'], 'service_role executa registrar_relatorio');
select isnt_definer('public', 'registrar_relatorio', array['jsonb'],
  'registrar_relatorio roda com as permissões de quem chama (security invoker)');
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc
   where oid = 'public.registrar_relatorio(jsonb)'::regprocedure),
  'registrar_relatorio fixa search_path vazio');

select * from finish();
rollback;
