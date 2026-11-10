// ================================================================
// HTTP — respostas padronizadas das Edge Functions
// O navegador chama as funções a partir de outro domínio (o site na
// Vercel), então toda resposta leva os cabeçalhos CORS.
//
// Arquivo puro: só usa Request/Response (padrão web, existe no Deno
// e no Node). Testado em backend/testes/unidade/http.teste.ts.
// ================================================================

export const CABECALHOS_CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/** Tamanho máximo do corpo aceito (256 KB). Um dia real tem poucos KB. */
export const LIMITE_CORPO_BYTES = 256 * 1024;

export function responderJson(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CABECALHOS_CORS, "content-type": "application/json; charset=utf-8" },
  });
}

/** Resposta ao "preflight" (OPTIONS) que o navegador faz antes do POST. */
export function responderPreflight(): Response {
  return new Response(null, { status: 204, headers: CABECALHOS_CORS });
}

/**
 * O app manda a chave pública (publishable) no cabeçalho `apikey`.
 * A própria função confere, porque o JWT do gateway está desligado
 * (as chaves novas do Supabase não são JWT).
 */
export function chavePublicaValida(req: Request, chavesAceitas: string[]): boolean {
  const chave = req.headers.get("apikey");
  return Boolean(chave) && chavesAceitas.includes(chave as string);
}

/**
 * Lê uma variável de ambiente com chaves. Aceita os formatos que o
 * Supabase usa: objeto JSON { "default": "sb_..." }, lista JSON ou
 * uma chave só em texto.
 */
export function lerListaDeChaves(valor: string | undefined): string[] {
  const texto = (valor ?? "").trim();
  if (texto === "") return [];
  try {
    const lido: unknown = JSON.parse(texto);
    const valores = Array.isArray(lido)
      ? lido
      : typeof lido === "object" && lido !== null
        ? Object.values(lido)
        : [lido];
    return valores.filter((chave): chave is string => typeof chave === "string" && chave !== "");
  } catch {
    return [texto];
  }
}

// ── Corpo da requisição ──────────────────────────────────────────

export const ERRO_JSON_INVALIDO = "O corpo da requisição não é um JSON válido.";

export type LeituraCorpo = { ok: true; corpo: unknown } | { ok: false; resposta: Response };

const ERRO_GRANDE_DEMAIS = "O relatório é grande demais.";

/**
 * Lê o corpo aos pedaços e para assim que passar do limite: um corpo
 * enorme (ou que nunca termina) não chega a ser guardado na memória.
 * Devolve null quando passou do limite.
 */
async function lerTextoComLimite(req: Request, limite: number): Promise<string | null> {
  if (!req.body) return "";
  const leitor = req.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      leitor.cancel().catch(() => {});
      return null;
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const parte of partes) {
    bytes.set(parte, posicao);
    posicao += parte.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** Lê o corpo como JSON: 413 se passar do limite, 400 se não for JSON. */
export async function lerCorpoJson(req: Request): Promise<LeituraCorpo> {
  const tamanhoDeclarado = Number(req.headers.get("content-length") ?? 0);
  if (tamanhoDeclarado > LIMITE_CORPO_BYTES) {
    return { ok: false, resposta: responderJson(413, { erro: ERRO_GRANDE_DEMAIS }) };
  }

  const texto = await lerTextoComLimite(req, LIMITE_CORPO_BYTES);
  if (texto === null) {
    return { ok: false, resposta: responderJson(413, { erro: ERRO_GRANDE_DEMAIS }) };
  }

  try {
    return { ok: true, corpo: JSON.parse(texto) };
  } catch {
    return { ok: false, resposta: responderJson(400, { erro: ERRO_JSON_INVALIDO }) };
  }
}

// ── Tratador padrão das Edge Functions ───────────────────────────

export const ERRO_CHAVE = "Chave de acesso inválida.";
export const ERRO_INTERNO = "Erro interno. Tente de novo em instantes.";

export interface OpcoesTratador {
  metodo: "GET" | "POST";
  /** Chaves públicas aceitas (lidas do ambiente a cada pedido). */
  chavesAceitas: () => string[];
  tratar: (req: Request) => Promise<Response>;
}

/**
 * A mesma sequência para as três funções:
 *   OPTIONS → 204 | sem chave → 401 | método errado → 405 |
 *   tratamento | erro inesperado → 500 (detalhe só no log).
 */
export function criarTratador(opcoes: OpcoesTratador): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === "OPTIONS") return responderPreflight();
    if (!chavePublicaValida(req, opcoes.chavesAceitas())) {
      return responderJson(401, { erro: ERRO_CHAVE });
    }
    if (req.method !== opcoes.metodo) {
      return responderJson(405, { erro: `Use o método ${opcoes.metodo}.` });
    }
    try {
      return await opcoes.tratar(req);
    } catch (erro) {
      // O detalhe (SQL, stack) fica no log do servidor, nunca na resposta.
      console.error("Erro inesperado na função:", erro);
      return responderJson(500, { erro: ERRO_INTERNO });
    }
  };
}
