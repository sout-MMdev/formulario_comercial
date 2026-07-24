import "./styles/index.css";
import { inicializarSplash } from "./modules/splash";
import {
  buscarAgencias,
  configurarTodosAutocompletesAgencia,
} from "./modules/agencias";
import {
  buscarCidadesIBGE,
  configurarTodosAutocompletes,
} from "./modules/cidades";
import { inicializarDataPicker } from "./modules/data-picker";
import {
  configurarBotoesNavegacao,
  configurarBotoesFluxo,
  configurarPreenchimentoEmail,
  registrarCallbackResumo,
} from "./modules/fluxo";
import {
  configurarBotoesAdicionar,
  configurarCalculoKm,
  configurarDespesaInicial,
} from "./modules/despesas";
import { observarReveals } from "./modules/scroll-reveal";
import {
  montarResumo,
  renderizarDiasSalvos,
  salvarDiaCompleto,
} from "./modules/resumo";

document.addEventListener("DOMContentLoaded", async () => {
  // Splash + APIs
  await inicializarSplash({
    buscarAgencias,
    buscarCidades: buscarCidadesIBGE,
    configurarAutocompletes: configurarTodosAutocompletes,
    configurarAutocompletesAgencia: configurarTodosAutocompletesAgencia,
  });

  // Registra o callback do resumo (evita dependência circular)
  registrarCallbackResumo(montarResumo);

  // Navegação e e-mail
  configurarBotoesNavegacao();
  configurarBotoesFluxo();
  configurarPreenchimentoEmail();

  // Blocos dinâmicos
  configurarBotoesAdicionar();
  configurarDespesaInicial();

  // Botão salvar dia
  const btnSalvar = document.getElementById("btn-salvar-dia");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarDiaCompleto);
  }

  // KM nos inputs que já existem
  document
    .querySelectorAll<HTMLInputElement>('input[name*="[km]"]')
    .forEach((input) => configurarCalculoKm(input));

  // Data picker e scroll reveal
  inicializarDataPicker();
  observarReveals();

  // Dias salvos no painel
  renderizarDiasSalvos();

  // Ano no rodapé
  const spanAno = document.getElementById("ano-atual");
  if (spanAno) spanAno.textContent = String(new Date().getFullYear());

  console.log("✅ Aplicação TypeScript inicializada!");
});