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
