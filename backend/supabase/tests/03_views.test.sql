-- ================================================================
-- TESTE 03 — VIEWS DE GESTÃO
--   v_reembolso_mensal: quanto cada executivo recebe por mês, com a
--     mesma classificação de despesas da tela.
--   v_agencias_em_alerta: agências cujo registro de estresse mais
--     recente é Alto ou Crítico.
-- Os relatórios extras são criados aqui e desfeitos no rollback.
--
-- Rodar:  npm run backend:testar-banco
-- ================================================================

begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

-- Relatório fictício gravado pela própria função.
create function pg_temp.registrar(executivo text, id_cliente bigint, resto jsonb) returns bigint
language sql as $$
  select relatorio_id from public.registrar_relatorio(
    jsonb_build_object(
      'executivo_id', (select id from public.executivos where nome = executivo),
      'id_cliente', id_cliente,
      'total_km', 0, 'total_pessoal', 0, 'total_abastecimento_clara', 0,
      'total_final', 0, 'km_rodado', 0, 'data_visita', null,
      'agencias', '[]'::jsonb, 'trajetos', '[]'::jsonb, 'despesas', '[]'::jsonb
    ) || resto
  )
$$;

-- ── v_reembolso_mensal ───────────────────────────────────────────
select results_eq(
  $$select e.nome, coalesce(sum(v.total_final), 0)
    from public.executivos e
    left join public.v_reembolso_mensal v on v.executivo = e.nome
    group by e.nome order by e.nome$$,
  $$select e.nome, coalesce(sum(r.total_final), 0)
    from public.executivos e
    left join public.relatorios r on r.executivo_id = e.id
    group by e.nome order by e.nome$$,
  'confere_com_relatorios: por executivo, a view soma o mesmo que os relatórios'
);

-- Só despesas, sem data: Pessoal soma, Clara+Abastecimento desconta,
-- Clara+Hospedagem é informativo (fica de fora).
select pg_temp.registrar('CAMILA RIBEIRO', 888001, $json${
  "fluxos": ["despesas"],
  "total_pessoal": 20, "total_abastecimento_clara": 5, "total_final": 15,
  "despesas": [
    { "data": null, "cartao": "Cartão Pessoal", "categoria": "Refeição", "valor": 20, "nome_comprovante": "nota.jpg" },
    { "data": null, "cartao": "Cartão Clara", "categoria": "Abastecimento", "valor": 5, "nome_comprovante": null },
    { "data": null, "cartao": "Cartão Clara", "categoria": "Hospedagem", "valor": 300, "nome_comprovante": null }
  ]
}$json$::jsonb);

select results_eq(
  $$select mes, total_km, total_pessoal, total_abastecimento_clara, total_final
    from public.v_reembolso_mensal where executivo = 'CAMILA RIBEIRO'$$,
  $$select date_trunc('month', recebido_em)::date, 0::numeric, 20.00::numeric, 5.00::numeric, 15.00::numeric
    from public.relatorios where id_cliente = 888001$$,
  'mes_sem_data: itens sem data caem no mês do recebimento, com a classificação da tela'
);

select results_eq(
  $$select mes, total_km from public.v_reembolso_mensal
    where executivo = 'BRUNO ROCHA' and mes = '2026-10-01'$$,
  $$values ('2026-10-01'::date, 60.06::numeric)$$,
  'item com data conta no mês da própria data (trajeto de outubro do seed)'
);

-- ── v_agencias_em_alerta ─────────────────────────────────────────
select ok(
  exists (select 1 from public.v_agencias_em_alerta where agencia = 'Turismo Aurora' and nivel = 'Alto'),
  'alerta_aparece: Turismo Aurora (Alto no seed) está em alerta'
);
select ok(
  not exists (select 1 from public.v_agencias_em_alerta where agencia = 'Rota Sul Turismo'),
  'agência com estresse Médio não entra no alerta'
);

-- Uma visita mais nova deixa a Turismo Aurora em Baixo.
select pg_temp.registrar('GUSTAVO MENDES', 888002, $json${
  "fluxos": ["visita"], "data_visita": "2026-12-01",
  "agencias": [{ "nome": "turismo aurora", "estresses": [
    { "nivel": "Baixo", "setores": ["Comercial"], "descricao": null }
  ], "acoes": [] }]
}$json$::jsonb);

select ok(
  not exists (select 1 from public.v_agencias_em_alerta where agencia = 'Turismo Aurora'),
  'alerta_mais_recente: o registro mais novo (Baixo) tira a agência do alerta'
);

-- Dois registros no mesmo relatório: vale o mais grave.
select pg_temp.registrar('GUSTAVO MENDES', 888003, $json${
  "fluxos": ["visita"], "data_visita": "2026-12-02",
  "agencias": [{ "nome": "Serra Azul Viagens", "estresses": [
    { "nivel": "Médio", "setores": ["Atendimento"], "descricao": "Fila de cotações." },
    { "nivel": "Crítico", "setores": ["Financeiro"], "descricao": "Repasse bloqueado." }
  ], "acoes": [] }]
}$json$::jsonb);

select results_eq(
  $$select agencia, nivel::text, executivo, data from public.v_agencias_em_alerta
    where agencia = 'Serra Azul Viagens'$$,
  $$values ('Serra Azul Viagens', 'Crítico', 'GUSTAVO MENDES', '2026-12-02'::date)$$,
  'empate no mesmo relatório: vale o nível mais grave'
);

-- ── Segurança ────────────────────────────────────────────────────
select ok(
  (select 'security_invoker=true' = any(reloptions) from pg_class
   where oid = 'public.v_reembolso_mensal'::regclass),
  'v_reembolso_mensal roda com as permissões de quem consulta'
);
select ok(
  (select 'security_invoker=true' = any(reloptions) from pg_class
   where oid = 'public.v_agencias_em_alerta'::regclass),
  'v_agencias_em_alerta roda com as permissões de quem consulta'
);
select table_privs_are('public', 'v_reembolso_mensal', 'anon', array[]::text[],
  'anon sem acesso a v_reembolso_mensal');
select table_privs_are('public', 'v_reembolso_mensal', 'authenticated', array[]::text[],
  'authenticated sem acesso a v_reembolso_mensal');
select table_privs_are('public', 'v_agencias_em_alerta', 'anon', array[]::text[],
  'anon sem acesso a v_agencias_em_alerta');
select table_privs_are('public', 'v_agencias_em_alerta', 'authenticated', array[]::text[],
  'authenticated sem acesso a v_agencias_em_alerta');

select * from finish();
rollback;
