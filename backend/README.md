# Backend — aguardando o novo acesso Supabase

> **Estado atual: vazio de propósito.** O backend Supabase antigo foi retirado
> em 10/09/2026, e o novo ainda não chegou.

## O que aconteceu

O projeto Supabase que sustentava este backend foi substituído. Todo o SQL
(schema, RLS, gatilhos) e as Edge Functions saíram daqui para não induzir a
erro — descreviam um projeto que não é mais o nosso.

**Nada foi perdido.** Está tudo em [`../to_delete/`](../to_delete/), com a
arquitetura documentada:

| Onde | O quê |
|---|---|
| [`../to_delete/ARQUITETURA.md`](../to_delete/ARQUITETURA.md) | o desenho do sistema — schema, tabelas, RLS, buckets, funções |
| [`../to_delete/ETAPAS.md`](../to_delete/ETAPAS.md) | as 15 etapas, na ordem em que foram construídas |
| [`../to_delete/backend-supabase/`](../to_delete/backend-supabase/) | os arquivos originais, intactos |

## O que ainda vive aqui

```
backend/
  importacao/     tratamento da planilha do Infotravel (independe do Supabase)
  .env.example    modelo das variáveis — SEM segredo de verdade
```

## Quando o novo acesso chegar

1. Ler `ARQUITETURA.md` como **especificação**, não como script — boa parte das
   decisões continua válida, mas confirme cada uma contra as instruções novas.
2. Recriar `supabase/migrations/` do zero, uma migration por mudança.
3. Ligar o CLI (`supabase link` + `supabase db push`) **desde o começo**. No
   projeto antigo o SQL era colado à mão no editor, e isso era uma dívida
   conhecida.

## Segurança — as regras que continuam valendo

Independem de qual projeto Supabase esteja conectado:

1. **Tudo que vai pro navegador é público.** Segredo (`service_role`, chave de
   e-mail, API do Infotera) mora só nas Edge Functions.
2. No front, só a chave **pública (anon)** — ela é pública por design. Quem
   protege os dados é o **RLS**.
3. Variável com prefixo `VITE_` **entra no bundle**. Lá só vai URL e chave
   pública.
4. O back end **revalida toda requisição** (RLS + checagem de perfil). O front
   valida só por conveniência.
