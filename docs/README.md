# 📚 Documentação

| Documento | Para quê | Ler quando |
|---|---|---|
| [ARQUITETURA.md](ARQUITETURA.md) | Visão geral, caminho de um relatório, banco, pastas, decisões e limitações | **Primeiro.** Para entender o sistema inteiro |
| [FORMULARIO.md](FORMULARIO.md) | Os dois apps: telas, núcleo, estilos e deploy | Para mexer no front-end |
| [../backend/README.md](../backend/README.md) | Rodar o back-end local, comandos e onde mexer | Para rodar ou mudar o servidor e o banco |
| [planejamento/login-mobile.md](planejamento/login-mobile.md) | Plano da tela de login do app mobile | Funcionalidade futura |

## Mapa rápido

| Quero… | Vá para |
|---|---|
| Mudar uma regra de cálculo ou validação | `packages/nucleo/src/regras/` |
| Mudar uma tela do computador | `apps/desktop/src/abas/` |
| Mudar uma tela do celular | `apps/mobile/src/passos/` |
| Mudar cores, fontes ou sombras | `packages/tema/src/` |
| Mudar o banco | Nova migration em `backend/supabase/migrations/` |
| Mudar o que o servidor faz ao receber um relatório | `backend/supabase/functions/_compartilhado/processar.ts` |
