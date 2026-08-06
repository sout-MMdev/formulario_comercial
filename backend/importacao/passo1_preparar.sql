-- ==============================================================
-- IMPORTAÇÃO — PASSO 1: preparar o banco
-- Roda no SQL Editor ANTES de subir o CSV pela tabela de staging.
-- ==============================================================

-- 1. Limpa a AMOSTRA (mantém você, o Administrador)
delete from app.estresse_agencia;
delete from app.agencias;
delete from app.executivos where perfil <> 'Administrador';

-- 2. Campos novos + e-mail opcional (mesma coisa da migration cnpj_comissao)
alter table app.agencias
  add column if not exists cnpj     text,
  add column if not exists comissao text;
alter table app.executivos alter column email drop not null;

-- 3. Tabela de staging que vai receber o CSV (colunas = cabeçalhos do CSV)
drop table if exists app.stg_import;
create table app.stg_import (
  nome     text, cnpj   text, cep      text, endereco text, cidade text,
  estado   text, bairro text, promotor text, comissao text, ativa  text
);
-- Trava o staging pra API (só o painel/serviço mexe nele; ninguém pela API)
alter table app.stg_import enable row level security;
