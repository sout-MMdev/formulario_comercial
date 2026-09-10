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
