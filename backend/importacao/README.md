# Importação de agências (Infotera)

A base de agências vem da planilha do **Infotera** exportada como CSV.
Os arquivos `.csv`/`.xlsx` desta pasta são **ignorados pelo Git** — dado
real (nomes, CNPJ, e-mails) não vai pro repositório.

O arquivo do Infotera vem com **`;`** como delimitador, campos entre
**aspas** e ~30 colunas.

## Re-importar a base (substituição completa)

1. **Converter** a planilha do Infotera pro formato de import:
   ```bash
   node converter-infotera.js <arquivo-do-infotera.csv>
   ```
   Gera `agencias_novo.csv` (vírgula, limpo, com `id_infotera` + comissão).

2. No **SQL Editor** do Supabase (projeto `cativa-crm`), na ordem:
   - `passo0_limpar_teste.sql` — limpa visitas/estresse/ocorrências/etc.
     (só rode se houver esses registros — senão o passo 1 falha na FK).
   - `passo1_preparar.sql` — apaga a base atual + cria a tabela `stg_import`.

3. **Table Editor** → schema `app` → `stg_import` → **Insert → Import data
   from CSV** → `agencias_novo.csv`.
   Confira: `select count(*) from app.stg_import;` (tem que bater com o CSV).

4. `passo3_transformar.sql` — cria os executivos (promotores) + insere as
   agências + apaga o staging.

5. Conferir:
   ```sql
   select
     (select count(*) from app.agencias)                               as agencias,
     (select count(*) from app.agencias where id_infotera is not null) as com_id,
     (select count(*) from app.executivos)                             as executivos;
   ```

## A chave `id_infotera`

Cada agência guarda o `id` do Infotera em `app.agencias.id_infotera` (único).
Isso permite, no futuro, **atualizar por ele** (upsert: atualiza as que já
existem, insere as novas) — sem precisar apagar tudo. Enquanto isso não é
feito, a re-importação é uma **substituição completa** (passos acima).

## Colunas que o conversor usa (da planilha do Infotera)

`Id` · `Nome` (ou `Razão Social` se vazio) · `CNPJ` (ou `CPF`) · `CEP` ·
`Endereço` · `Cidade` · `Estado` · `Bairro` · `Promotor` · `Comissão` · `Ativo?`.

O `Promotor` é padronizado em MAIÚSCULO para casar com os executivos do banco.
