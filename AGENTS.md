# Instruções para Agentes

## Idioma e Comunicação
- **Sempre responder em português (pt-BR)** em todas as interações e respostas com o usuário.
- Manter comunicação técnica, clara e estruturada.

## Onde fica cada coisa
- Regras de negócio (usadas pelos apps e pelo servidor): `packages/nucleo/src/regras/`
- Telas: `apps/desktop/src/abas/` e `apps/mobile/src/passos/`
- Banco: `backend/supabase/migrations/` (sempre uma migration nova, nunca editar as antigas)
- Edge Functions: `backend/supabase/functions/` (código comum em `_compartilhado/`)
- Visão geral e decisões: `docs/ARQUITETURA.md`

## Comandos Principais
- Gerenciador de pacotes: **npm** (workspaces)
- Testes de unidade (núcleo + back-end): `npm test`
- Verificação de tipos: `npm run typecheck`
- Executar Desktop: `npm run dev:desktop`
- Executar Mobile PWA: `npm run dev:mobile`
- Back-end local (Docker): `npm run backend:iniciar` · `npm run backend:conectar-apps` · `npm run backend:parar`
- Testes do banco e das funções: `npm run backend:testar`

## Regras
- Só dados fictícios em seeds e testes (e-mails `@empresa.exemplo` / `@teste.com`).
- Nenhuma chave no código: scripts e testes leem do `supabase status`.
- Toda tabela nova com RLS e sem privilégios para `anon`/`authenticated`.
