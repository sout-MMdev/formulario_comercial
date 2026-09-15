# API de Unidades (agências) — acesso para o CRM_CATIVA_COMERCIAL

> Guia de consumo da **base oficial de agências parceiras da Cativa**, que substitui a
> importação por planilha do Infotera no CRM Comercial. A base é mantida pelo pipeline de dados
> da Cativa e **atualizada todo dia de madrugada**.
>
> O acesso é **por login pessoal** (e-mail + senha) e dá acesso **somente a esta base**.

---

## 1. Seus dados de acesso

| Item | Valor |
|---|---|
| URL base | `https://qglcvhgnifzugxwmokxd.supabase.co` |
| Chave do projeto (`apikey`) | `sb_publishable_L4xPd2fHclj3u7QExEOTQQ_4vCqnJjJ` |
| Tabela | `dUnidades` |
| Usuário | seu e-mail (cadastrado pela Cativa) |
| Senha | enviada por canal separado |
| Grupo de acesso | `unidades` — libera esta tabela e nada mais |

> ⚠️ Este projeto é o **ambiente analítico da Cativa**, diferente do projeto do seu CRM
> (`CRM_CATIVA_COMERCIAL`). São duas credenciais distintas, para dois fins distintos: aqui você
> **lê** a base de agências; lá você **grava** os dados do seu sistema.

## 2. Como consultar (2 passos)

**Passo 1 — login** (o token vale ~1 hora; repita a cada execução da rotina):

```
POST https://qglcvhgnifzugxwmokxd.supabase.co/auth/v1/token?grant_type=password
Headers:  apikey: <CHAVE>        Content-Type: application/json
Body:     {"email": "seu@email.com", "password": "sua_senha"}
```

**Passo 2 — consultar** (sempre com os dois headers):

```
GET https://qglcvhgnifzugxwmokxd.supabase.co/rest/v1/dUnidades?select=*
Headers:  apikey: <CHAVE>        Authorization: Bearer <access_token>
```

Somente leitura — inserção e alteração são bloqueadas no servidor.

## 3. O que a base contém

**18.466 unidades** (1 linha por agência), das quais **18.350 com CNPJ** (99,4%).

| Coluna | O que é |
|---|---|
| `ID_UNIDADE` | **chave estável da agência** — use-a como chave do seu `upsert` (é o equivalente ao antigo `id_infotera`) |
| `Unidade` | nome da agência |
| `CNPJ` | somente dígitos, sem pontuação; nulo em 116 casos (agências com CPF como documento principal ou sem documento) |
| `Cidade`, `Estado`, `Bairro` | localização; `Estado` é a sigla da UF |
| `Região_Brasil` | macrorregião já derivada da UF: `Sudeste` (9.624), `Sul` (4.146), `Nordeste` (1.953), `Centro-Oeste` (1.926), `Norte` (792), `Exterior` (25) |
| `Contato` | nome do contato comercial |
| `DDD`, `Telefone` | telefone da agência |
| `Ativo?` | situação na origem: **`S` = ativa (10.240)**, `N` = inativa (8.222), `A` (4 casos) |
| `Promotor` | **o executivo responsável pela agência** (27 promotores distintos). É o vínculo que o CRM usa como executivo da carteira |
| `Comissao` | regra de comissão da unidade |
| `Virtual` | `S`/`N` — unidade virtual (hoje só 1 caso) |
| `DT_INCLUSAO` | data de cadastro na origem |

> **Nomes de coluna com acento ou símbolo** (`Região_Brasil`, `Ativo?`) precisam de aspas
> codificadas na URL quando usados em `select`/filtro: `&select=%22Ativo?%22`. Se preferir,
> traga `select=*` e trate no seu lado.

## 4. Filtros e paginação

Máximo de **1.000 linhas por chamada** — para carregar tudo, pagine com `limit`/`offset` e
**ordenação fixa**:

```
&order=ID_UNIDADE.asc&limit=1000&offset=0   → depois offset=1000, 2000, ...
```

São ~19 requisições para a base inteira. Filtros úteis:

| O que você quer | Acrescente |
|---|---|
| Só ativas | `&%22Ativo?%22=eq.S` |
| Por UF | `&Estado=eq.PR` |
| Por executivo | `&Promotor=eq.NOME%20DO%20PROMOTOR` |
| Só as alteradas recentemente | *(não disponível hoje — ver §5)* |

## 5. Como sincronizar no CRM (recomendação)

A base é reconstruída inteira todas as noites e **não expõe carimbo de atualização por linha**.
A rotina recomendada é um **upsert completo por `ID_UNIDADE`**, uma vez ao dia (depois das
04:00 de Brasília):

1. baixe as 18,5 mil linhas (~19 requisições);
2. `upsert` em `app.agencias` usando `ID_UNIDADE` como chave única;
3. **agência que sumiu da base** → marque como inativa no CRM, **nunca apague** (há visitas e
   ocorrências apontando para ela);
4. **campos próprios do CRM** (perfil comercial, observações internas) ficam fora do upsert —
   o sync manda apenas nos campos que vêm da origem.

Se no futuro for necessário sincronizar com mais frequência ou só o que mudou, a Cativa pode
acrescentar uma coluna de data de atualização à base — é só pedir.

## 6. Regras

- **Somente leitura**; o acesso é pessoal e revogável.
- **Atualização 1×/dia** (~04:00, horário de Brasília) — não é tempo real.
- Dados de agências parceiras, incluindo CNPJ e contato comercial: uso restrito à finalidade do
  CRM, sem redistribuição (LGPD).
- Dúvidas, erro `400 invalid_credentials` (senha) ou resposta `[]` (grupo): falar com a Cativa.
