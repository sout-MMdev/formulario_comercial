// ================================================================
// SPLASH — tela de carregamento com loader circular.
// Injeta o splash.html no body, atualiza o texto de status
// enquanto as APIs carregam, e remove tudo com fade out.
// ================================================================


/**
 * Busca o splash.html e injeta no início do body.
 * Se falhar, a página continua funcionando normalmente.
 */
async function carregarSplash(): Promise<void> {
  try {
    const resposta = await fetch("splash.html");

    if (!resposta.ok) {
      throw new Error("splash.html não encontrado.");
    }

    const html = await resposta.text();
    document.body.insertAdjacentHTML("afterbegin", html);
  } catch (erro) {
    console.warn("Splash não carregada:", (erro as Error).message);
  }
}


/**
 * Atualiza o texto de status abaixo do loader circular.
 * O parâmetro porcentagem existe por compatibilidade
 * mas não controla nenhum elemento visual (o loader
 * gira automaticamente via CSS).
 */
export function atualizarSplash(_porcentagem: number, texto: string): void {
  const status = document.getElementById("splash-status");
  if (status) status.textContent = texto;
}


/**
 * Dispara o fade out e remove o overlay do DOM.
 */
export function fecharSplash(): void {
  const overlay = document.getElementById("splash-overlay");
  if (!overlay) return;

  overlay.classList.add("splash-saindo");

  setTimeout(() => {
    overlay.remove();
  }, 600);
}


/**
 * Envolve uma Promise com um tempo máximo de espera.
 * Se a Promise demorar mais que `ms` milissegundos,
 * resolve mesmo assim para não travar a splash.
 */
function comTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
  return Promise.race([promise, timeout]);
}


/**
 * Orquestra toda a sequência da splash:
 * carrega as APIs em paralelo e atualiza o status.
 *
 * Recebe callbacks opcionais para carregar dados externos
 * (agências, cidades) e configurar autocompletes.
 * Isso evita que a splash precise importar módulos
 * que ainda não foram migrados.
 */
export async function inicializarSplash(callbacks?: {
  buscarAgencias?: () => Promise<void>;
  buscarCidades?: () => Promise<void>;
  configurarAutocompletes?: () => void;
  configurarAutocompletesAgencia?: () => void;
}): Promise<void> {

  // Injeta o HTML da splash no body
  await carregarSplash();

  // Preenche o ano no rodapé
  const anoSpan = document.getElementById("ano-splash");
  if (anoSpan) anoSpan.textContent = String(new Date().getFullYear());

  // Etapa 1 — início
  atualizarSplash(10, "Iniciando...");
  await new Promise<void>((r) => setTimeout(r, 1000));

  // Etapa 2 — carrega agências e cidades em paralelo
  atualizarSplash(30, "Carregando agências...");

  const carregarAgencias = callbacks?.buscarAgencias
    ? comTimeout(callbacks.buscarAgencias(), 10000)
    : Promise.resolve();

  const carregarCidades = callbacks?.buscarCidades
    ? comTimeout(callbacks.buscarCidades(), 12000)
    : Promise.resolve();

  await new Promise<void>((r) => setTimeout(r, 800));
  atualizarSplash(50, "Carregando cidades...");

  await new Promise<void>((r) => setTimeout(r, 800));
  atualizarSplash(70, "Quase lá...");

  // Espera as duas APIs terminarem
  await Promise.allSettled([carregarAgencias, carregarCidades]);

  // Etapa 3 — liga os autocompletes
  atualizarSplash(85, "Finalizando...");
  await new Promise<void>((r) => setTimeout(r, 600));

  callbacks?.configurarAutocompletes?.();
  callbacks?.configurarAutocompletesAgencia?.();

  // Etapa final
  atualizarSplash(100, "Pronto!");
  await new Promise<void>((r) => setTimeout(r, 700));

  fecharSplash();
}