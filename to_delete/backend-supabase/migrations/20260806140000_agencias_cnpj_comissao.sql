-- ==============================================================
-- FASE 6 (schema) — campos vindos da planilha do Infotravel
-- A planilha traz CNPJ e Comissão por agência, e o "Promotor" (executivo).
-- O e-mail do executivo passa a ser opcional: os promotores entram sem
-- login (cada um ganha acesso quando for cadastrado no Auth).
-- ==============================================================

alter table app.agencias
  add column if not exists cnpj     text,   -- CNPJ da agência
  add column if not exists comissao text;   -- faixa de comissão (ex.: "AG PADRÃO 12%")

-- Promotores importados são executivos sem login → e-mail opcional.
alter table app.executivos alter column email drop not null;
