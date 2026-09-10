# `to_delete/` — backup do backend Supabase antigo

> **Congelado em 10/09/2026**, a partir do commit `ad2170f` (branch `main`).
> Nada aqui é executado pelo sistema. É uma **caixa-preta de consulta**:
> guarda o que já foi construído no Supabase antigo, caso algo precise ser
> conferido ou recuperado depois da migração para o novo acesso.

## Por que esta pasta existe

O acesso ao Supabase foi substituído (projeto novo, instruções novas). O
conteúdo de `backend/supabase/` descrevia o projeto **antigo** e ficou
desatualizado — então saiu do caminho. Mas o *desenho* daquele backend
(modelo de dados, regras de segurança, contratos das funções) custou meses
de decisões, e boa parte continua válida como referência.

Resumindo: **os dados de acesso morreram; a arquitetura não.**

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `LEIA-ME.md` | Este arquivo — a porta de entrada. |
| `ARQUITETURA.md` | **O desenho do sistema.** Schema, 16 tabelas, RLS, buckets, funções. É o documento que importa. |
| `ETAPAS.md` | **A ordem em que foi construído.** As 15 etapas, o que cada uma resolveu e por quê. |
| `backend-supabase/` | Os 24 arquivos originais, **byte a byte**, com a estrutura de pastas intacta. |

Leia nesta ordem: `ARQUITETURA.md` (o quê) → `ETAPAS.md` (em que ordem) →
os `.sql` (o detalhe).

## Como restaurar, se precisar

A cópia é fiel, então voltar é um `cp`:

```bash
# de volta ao lugar original
cp -r to_delete/backend-supabase backend/supabase
```

Ou, se preferir pelo histórico do git (o commit ainda tem tudo):

```bash
git checkout ad2170f -- backend/supabase
```

## Para montar o banco novo do zero

Não recomendo colar o SQL antigo direto no projeto novo sem ler. Duas razões:

1. `setup_completo.sql` referencia o projeto antigo pelo nome e assume
   buckets/segredos que talvez não existam ainda no novo.
2. As instruções novas podem mudar decisões de fundo (nomes de schema,
   modelo de perfis, política de RLS).

O caminho seguro é usar `ARQUITETURA.md` como **especificação** e reescrever
o SQL conforme as instruções novas — aproveitando as decisões que continuarem
fazendo sentido.

## Quando apagar

Depois que o backend novo estiver rodando e validado em produção. Aí esta
pasta some de vez (o git ainda guarda o histórico, então nada se perde).
