# 🖥️ App Desktop

Formulário para computador: **abas** em sequência e um **resumo ao vivo** na
lateral. Usa as regras de `@cativa/nucleo` e os tokens visuais de
`@cativa/tema`.

```bash
npm run dev:desktop      # na raiz → http://localhost:5501
```

Sem back-end, roda no **modo demonstração**. Para usar o Supabase local, veja
[`backend/README.md`](../../backend/README.md).

## Pastas (`src/`)

| Pasta | O que tem |
|---|---|
| `abas/` | Uma pasta por etapa: `Identificacao`, `Visita`, `Agencias`, `Despesas`, `Resumo` (cada uma com `.tsx`, `.css` e `componentes/` próprios) |
| `componentes/ui/` | Peças genéricas: `Botao`, `Campo`, `Modal`, `SeletorData`, `Autocomplete`, `MultiSelecao`, `Icone` |
| `componentes/layout/` | Estrutura da página: cabeçalho, rodapé, splash, trilha de etapas, resumo ao vivo |
| `componentes/campos/` | Campos compostos (agência, endereço, arquivo…) |
| `contexto/` | `FormularioContexto`: liga o reducer do núcleo às abas e expõe `salvarDia` |
| `hooks/` | `useDiasSalvos`, `useDebounce`, `useCliqueFora`, `useTeclaEscape` |
| `estilos/` | CSS global em camadas (`@layer`): tema → root → base → compartilhado |

## Onde mexer para…

- **Mudar uma tela:** a pasta da aba em `abas/`.
- **Mudar uma conta ou validação:** não é aqui — é em `packages/nucleo/src/regras/`.
- **Mudar o que acontece ao salvar:** `contexto/FormularioContexto.tsx` (`salvarDia`)
  e a confirmação em `abas/Resumo/Resumo.tsx`.
