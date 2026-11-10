-- ================================================================
-- MIGRATION — VIEWS NO HORÁRIO DE BRASÍLIA
-- O banco guarda recebido_em em UTC. Converter direto para data usa o
-- dia em UTC: um relatório recebido às 22h de 31/10 (Brasília) já é
-- 01/11 em UTC e caía no mês seguinte. As views passam a usar o dia
-- em America/Sao_Paulo quando o item não tem data.
-- Mesmas colunas: create or replace mantém permissões e security_invoker.
-- ================================================================

-- ── Reembolso por executivo e mês ────────────────────────────────
create or replace view public.v_reembolso_mensal
with (security_invoker = true) as
with itens as (
  -- Trajetos: o reembolso de km já gravado (km × tarifa do executivo).
  select
    r.executivo_id,
    date_trunc('month', coalesce(t.data, (r.recebido_em at time zone 'America/Sao_Paulo')::date))::date as mes,
    t.reembolso as km,
    0::numeric as pessoal,
    0::numeric as abastecimento_clara
  from public.trajetos t
  join public.relatorios r on r.id = t.relatorio_id

  union all

  -- Despesas: espelha classificarDespesa() em packages/nucleo/src/regras/reembolso.ts
  --   Cartão Pessoal ............... soma (a empresa devolve)
  --   Cartão Clara + Abastecimento . subtrai (a empresa já pagou)
  --   Cartão Clara + outras ........ informativo (fica de fora)
  select
    r.executivo_id,
    date_trunc('month', coalesce(d.data, (r.recebido_em at time zone 'America/Sao_Paulo')::date))::date,
    0,
    case when d.cartao = 'Cartão Pessoal' then d.valor else 0 end,
    case when d.cartao = 'Cartão Clara' and d.categoria = 'Abastecimento' then d.valor else 0 end
  from public.despesas d
  join public.relatorios r on r.id = d.relatorio_id
)
select
  e.nome as executivo,
  i.mes,
  sum(i.km) as total_km,
  sum(i.pessoal) as total_pessoal,
  sum(i.abastecimento_clara) as total_abastecimento_clara,
  sum(i.km + i.pessoal - i.abastecimento_clara) as total_final
from itens i
join public.executivos e on e.id = i.executivo_id
group by e.nome, i.mes;

comment on view public.v_reembolso_mensal is
  'Reembolso por executivo e mês. Item sem data conta no mês em que o relatório foi recebido (horário de Brasília).';

-- ── Agências em alerta ───────────────────────────────────────────
create or replace view public.v_agencias_em_alerta
with (security_invoker = true) as
with registros as (
  select
    coalesce(a.nome, v.nome_agencia) as agencia,
    e.nivel,
    e.setores,
    e.descricao,
    ex.nome as executivo,
    coalesce(r.data_visita, (r.recebido_em at time zone 'America/Sao_Paulo')::date) as data,
    row_number() over (
      -- Mesma agência: pelo cadastro ou, sem cadastro, pelo nome normalizado.
      partition by coalesce('id:' || v.agencia_id, 'nome:' || lower(btrim(v.nome_agencia)))
      -- O mais recente vence; no mesmo relatório, o nível mais grave.
      order by
        coalesce(r.data_visita, (r.recebido_em at time zone 'America/Sao_Paulo')::date) desc,
        r.recebido_em desc,
        r.id desc,
        e.nivel desc
    ) as ordem
  from public.registros_estresse e
  join public.visitas_agencias v on v.id = e.visita_agencia_id
  join public.relatorios r on r.id = v.relatorio_id
  join public.executivos ex on ex.id = r.executivo_id
  left join public.agencias a on a.id = v.agencia_id
)
select agencia, nivel, setores, descricao, executivo, data
from registros
where ordem = 1
  and nivel in ('Alto', 'Crítico');

comment on view public.v_agencias_em_alerta is
  'Agências cujo registro de estresse mais recente é Alto ou Crítico.';
