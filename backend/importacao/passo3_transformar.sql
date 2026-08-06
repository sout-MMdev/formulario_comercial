-- ==============================================================
-- IMPORTAÇÃO — PASSO 3: transformar o staging em dados reais
-- Roda DEPOIS do CSV estar em app.stg_import (count = 17816).
-- ==============================================================

-- 1. Cada promotor distinto vira um executivo (perfil Executivo, sem login).
insert into app.executivos (nome, perfil)
select distinct trim(s.promotor), 'Executivo'
from app.stg_import s
where coalesce(trim(s.promotor), '') <> ''
  and not exists (
    select 1 from app.executivos e where e.nome = trim(s.promotor)
  );

-- 2. Insere as agências, ligando ao promotor (executivo) e mapeando o status.
--    Sim -> Ativa · qualquer outra coisa -> Inativa.
--    Promotor em branco -> executivo_id nulo (sem dono, você atribui depois).
insert into app.agencias
  (nome, uf, cidade, bairro, logradouro, cep, cnpj, comissao, executivo_id, status)
select
  trim(s.nome),
  nullif(trim(s.estado), ''),
  nullif(trim(s.cidade), ''),
  nullif(trim(s.bairro), ''),
  nullif(trim(s.endereco), ''),
  nullif(trim(s.cep), ''),
  nullif(trim(s.cnpj), ''),
  nullif(trim(s.comissao), ''),
  e.id,
  case when upper(trim(coalesce(s.ativa, ''))) = 'SIM' then 'Ativa' else 'Inativa' end
from app.stg_import s
left join app.executivos e
  on e.nome = trim(s.promotor) and coalesce(trim(s.promotor), '') <> ''
where coalesce(trim(s.nome), '') <> '';

-- 3. Fim do staging.
drop table app.stg_import;
