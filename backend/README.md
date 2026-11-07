# 🔌 Backend & Integração Supabase

Este diretório descreve a camada de serviços e backend do **Formulário Comercial**, projetado sob a infraestrutura do **Supabase** (PostgreSQL, Row Level Security e Edge Functions).

---

## 🏛️ Arquitetura de Comunicação

O formulário adota o princípio de **mínima exposição de privilégios**:

```
[Formulário Desktop / Mobile]
       │
       │  Requisições públicas sem credencial administrativa
       ▼
[Supabase Edge Functions] ──(Validação & RLS)──► [PostgreSQL - Schema app]
  ├── listar-agencias (autocomplete protegido)
  ├── listar-executivos (apenas nomes e e-mails)
  └── receber-formulario (transação completa do dia + cópia por e-mail)
```

1. **Frontend Desacoplado:** O formulário público no navegador utiliza apenas a chave pública `anon`. Nenhuma chave administrativa (`service_role`) trafega no cliente.
2. **Edge Functions como Barreira de Proteção:** Consultas a agências e gravação de visitas passam por funções no servidor (Deno) que filtram colunas sensíveis (como CNPJ de agências, dados financeiros completos ou senhas).
3. **Segurança no Banco (RLS):** Toda a integridade e isolamento de dados reside nas políticas de **Row Level Security** do PostgreSQL.

---

## 🛡️ Modo Offline / Demonstração (Portfólio & Testes)

Quando o projeto é executado localmente sem as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`:

* O sistema entra automaticamente em **modo de simulação (`TEM_BACKEND = false`)**.
* O serviço de envio chaveia para `envioMock.ts`, salvando os dados no `localStorage` do navegador e simulando a resposta da API com sucesso.
* O autocomplete utiliza a base demonstrativa segura em `agencias.json`.

Isso permite que qualquer avaliador teste a aplicação completa de ponta a ponta sem necessidade de provisionar banco de dados.

---

## ⚙️ Conectando a um Supabase Real

Para apontar o formulário para um ambiente Supabase real:

1. Crie um arquivo `.env` na raiz do app desejado (`apps/desktop/.env` ou `apps/mobile/.env`) com base no `.env.example`:
   ```bash
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_publica_anon
   ```
2. Ao reiniciar a aplicação (`npm run dev:desktop` ou `npm run dev:mobile`), o formulário detectará as variáveis e alternará automaticamente para `envioApi.ts`.
