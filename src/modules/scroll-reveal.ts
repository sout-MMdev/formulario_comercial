// ================================================================
// SCROLL REVEAL — revela campos e cards conforme o usuário rola
// a tela, sem biblioteca externa. Usa IntersectionObserver.
// ================================================================

import { SCROLL_REVEAL_SELETOR } from "../config/dados";


// Cria o observer uma única vez (ou null se o navegador não suportar).
const observer: IntersectionObserver | null =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
              entrada.target.classList.add("reveal-visivel");
              observer!.unobserve(entrada.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
      )
    : null;


/**
 * Marca e observa elementos dentro do escopo que ainda não
 * tenham sido ligados ao efeito. Chamar de novo sempre que
 * conteúdo novo for inserido dinamicamente na página.
 */
export function observarReveals(escopo?: HTMLElement | Document): void {
  const raiz = escopo || document;

  // Elementos filhos que batem com o seletor
  const elementos = raiz.querySelectorAll
    ? raiz.querySelectorAll<HTMLElement>(SCROLL_REVEAL_SELETOR)
    : [];

  // Se o próprio escopo bate com o seletor, inclui ele também
  const candidatos: HTMLElement[] =
    raiz instanceof HTMLElement &&
    raiz.matches(SCROLL_REVEAL_SELETOR)
      ? [raiz, ...Array.from(elementos)]
      : Array.from(elementos);

  candidatos.forEach((elemento) => {
    if (elemento.dataset.revealLigado === "true") return;
    elemento.dataset.revealLigado = "true";
    elemento.classList.add("reveal");

    if (observer) {
      observer.observe(elemento);
    } else {
      // Fallback: mostra tudo direto se não tiver observer
      elemento.classList.add("reveal-visivel");
    }
  });
}