-- ==============================================================
-- IMPORTAÇÃO — PASSO 1: preparar o banco (substituição completa)
-- Roda no SQL Editor ANTES de subir o CSV pela tabela de staging.
-- (Se houver visitas/estresse/etc., rode antes o passo0_limpar_teste.sql.)
-- ==============================================================

-- 1. Apaga a base atual de agências (a lista nova entra do zero).
delete from app.agencias;

-- 2. Campos usados no CRM (idempotente). id_infotera = a chave estável do
--    Infotera; guardá-la permite ATUALIZAR por ela no futuro (upsert), sem
--    precisar apagar tudo de novo.
alter table app.agencias
  add column if not exists cnpj        text,
  add column if not exists comissao    text,
  add column if not exists id_infotera bigint;
create unique index if not exists uq_agencias_id_infotera on app.agencias (id_infotera);

-- Promotores importados são executivos sem login → e-mail opcional.
alter table app.executivos alter column email drop not null;

-- 3. Tabela de staging que recebe o CSV (colunas = cabeçalho do agencias_novo.csv)
drop table if exists app.stg_import;
create table app.stg_import (
  id_infotera text, nome text, cnpj text, cep text, endereco text,
  cidade text, estado text, bairro text, promotor text, comissao text, ativa text
);
-- Trava o staging pra API (só o painel/serviço mexe nele).
alter table app.stg_import enable row level security;
