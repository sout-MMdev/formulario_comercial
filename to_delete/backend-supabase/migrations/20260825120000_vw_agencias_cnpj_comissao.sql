-- ==============================================================
-- FASE 6 (ajuste) — expõe CNPJ e Comissão na view do CRM
--
-- As colunas já existem em app.agencias (migration ...140000). Aqui elas
-- entram na vw_agencias pra aparecerem na ficha da agência.
--
-- Segurança: a view continua security_invoker + grant SÓ pra authenticated.
-- O RLS de agencias vale por linha (executivo vê a comissão da carteira
-- dele; Administrador/Gestor veem tudo). O papel `anon` NÃO tem acesso —
-- então a chave pública do formulário nunca lê esses campos.
--
-- create or replace view: as duas colunas entram no FIM (cnpj, comissao),
-- sem mexer na ordem das existentes — é o que o Postgres permite.
-- ==============================================================

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
  coalesce(a.cep, '')                              as cep,
  coalesce(a.cnpj, '')                             as cnpj,
  coalesce(a.comissao, '')                         as comissao
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
