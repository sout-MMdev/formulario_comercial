# Backend — Cativa CRM Comercial

Back end do CRM Comercial e do formulário. **Não é um servidor separado pra
hospedar** — é o Supabase (projeto `Dados_Cativa`) mais o código versionado aqui.

O Supabase entrega, em camadas:

| Peça | Função |
| --- | --- |
| **Postgres** (schema `app`) | banco — as 8 tabelas do modelo |
| **Auth** | login real (perfil: Administrador / Gestor / Executivo / Operacional) |
| **RLS** | segurança por linha: executivo vê o dele; Administrador/Gestor veem tudo |
| **Storage** | arquivos: notas fiscais e planilhas de importação |
| **Edge Functions** | o "servidor" da lógica secreta: importar planilha, enviar e-mail, chamar APIs |

## Organização da pasta

```
backend/
  supabase/
    migrations/     SQL versionado do banco (fonte da verdade do schema)
    functions/      Edge Functions (importar-agencias, enviar-email, ...)
  .env.example      modelo das variáveis — SEM segredo de verdade
  README.md         este arquivo
```

O schema fica em `app` (separado do `public`, onde vive o data warehouse de
bloqueios/IATAs). O schema `app` **não é exposto à API por padrão** — só passa a
ser acessível quando ligarmos isso de propósito, junto com o RLS (fase 2).

## Segurança — regras de ouro

1. **Tudo que vai pro navegador é público.** Nenhum segredo (chave de e-mail,
   `service_role`, API do Infotera) pode estar no front. Segredo mora só nas
   Edge Functions (`supabase secrets`).
2. No front, a única chave é a **pública (anon)** — feita pra ser pública. Quem
   protege os dados é o **RLS**, não a chave.
3. `.env` com prefixo `VITE_` **entra no bundle e vira público** → lá só vai URL
   + chave pública. Segredo nenhum.
4. O back end **revalida toda requisição** (RLS + checagem de perfil nas funções).
   O front-end só valida por conveniência.

## Como o banco é aplicado

As migrations em `supabase/migrations/` são a fonte da verdade e também são
aplicadas no projeto `Dados_Cativa` (via conector do Supabase / CLI). Nunca
alterar o banco "na mão" sem uma migration correspondente aqui.
