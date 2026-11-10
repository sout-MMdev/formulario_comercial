# 📱 App Mobile (PWA)

Formulário para celular: **uma pergunta por tela**, botões grandes para o
toque, instalável na tela inicial e com funcionamento offline (PWA). Usa as
mesmas regras do desktop (`@cativa/nucleo`) e os mesmos tokens visuais
(`@cativa/tema`).

```bash
npm run dev:mobile       # na raiz → http://localhost:5502
```

Sem back-end, roda no **modo demonstração**. Para usar o Supabase local, veja
[`backend/README.md`](../../backend/README.md).

## Pastas (`src/`)

| Pasta | O que tem |
|---|---|
| `passos/` | Um arquivo por passo: `Executivo`, `Relatorio`, `DataVisita`, `AgenciasVisitadas`, `Analise`, `Trajetos`, `Gastos`, `Resumo` |
| `navegacao/` | `passos.ts`: títulos e a ordem dos passos de cada relatório |
| `componentes/ui/` | Peças genéricas: `Botao`, `Campo`, `Folha` (painel que sobe de baixo), `SeletorData`, `MultiSelecao`… |
| `componentes/layout/` e `campos/` | Estrutura da tela e campos compostos |
| `contexto/` | `FormularioContexto`: o mesmo reducer do desktop + a navegação por passos |
| `hooks/` | `useDiasSalvos`, `useDebounce` |
| `estilos/` | CSS global em camadas (`@layer`) |
| `login/` | Protótipo da tela de login, aberto com `/?login` (plano em `docs/planejamento/login-mobile.md`) |

`public/` tem o `manifest.webmanifest` e os ícones do app instalável; o
service worker é gerado pelo `vite-plugin-pwa` (`vite.config.ts`).

## Onde mexer para…

- **Mudar uma tela:** o arquivo do passo em `passos/`.
- **Mudar a ordem dos passos:** `navegacao/passos.ts`.
- **Mudar uma conta ou validação:** em `packages/nucleo/src/regras/` (vale para os dois apps).
