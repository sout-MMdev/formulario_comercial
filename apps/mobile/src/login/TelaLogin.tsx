// ================================================================
// TELA DE LOGIN (mobile)
// Etapa 1 de docs/planejamento/login-mobile.md: visual e comportamento.
//
// A tela só mostra e avisa. Quem confere a senha de verdade é quem
// passa `aoEntrar` — hoje um login de teste, depois o simulado do
// núcleo e, por fim, o Supabase. Trocar um pelo outro não muda nada
// aqui.
// ================================================================

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Botao, BotaoIcone } from "@/componentes/ui/Botao";
import { Icone } from "@/componentes/ui/Icone";
import {
  CAMINHO_LOGO_BRANCA,
  NOME_APP,
  NOME_EMPRESA,
} from "@cativa/nucleo/config";
import { emailValido } from "@cativa/nucleo/regras";
import "./TelaLogin.css";

// ── Contrato (docs/planejamento/login-mobile.md §5) ──────────────
// Na etapa 2 estes três tipos mudam para @cativa/nucleo/tipos.

/** Quem entrou. `nome` é a chave usada na tarifa por km. */
export interface UsuarioSessao {
  nome: string;
  email: string;
  precisaTrocarSenha: boolean;
}

export type MotivoFalhaLogin =
  | "credenciais"
  | "limite"
  | "conexao"
  | "bloqueado"
  | "desconhecido";

export type ResultadoEntrar =
  | { ok: true; usuario: UsuarioSessao }
  | { ok: false; motivo: MotivoFalhaLogin; mensagem: string };

interface PropsTelaLogin {
  /** E-mail lembrado neste celular ("" se não houver). */
  emailLembrado: string;
  /** Tenta entrar. A tela não sabe se o login é simulado ou real. */
  aoEntrar: (dados: {
    email: string;
    senha: string;
    lembrarEmail: boolean;
  }) => Promise<ResultadoEntrar>;
}

export function TelaLogin({
  emailLembrado,
  aoEntrar,
}: PropsTelaLogin) {
  const [email, setEmail] = useState(emailLembrado);
  const [senha, setSenha] = useState("");
  const [lembrarEmail, setLembrarEmail] = useState(Boolean(emailLembrado));
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const campoSenha = useRef<HTMLInputElement>(null);

  // Com e-mail lembrado, o cursor já vai para a senha. Sem ele, nenhum
  // campo ganha foco — o teclado não sobe sozinho por cima da marca.
  useEffect(() => {
    if (emailLembrado) campoSenha.current?.focus();
  }, [emailLembrado]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    // Dois toques não viram duas tentativas
    if (entrando) return;

    // Lê do próprio formulário, não só do estado: o preenchimento
    // automático do navegador às vezes não dispara o onChange (problema
    // comum em telas de login).
    const dados = new FormData(evento.currentTarget);
    const emailDigitado = String(dados.get("email") ?? "").trim();
    const senhaDigitada = String(dados.get("senha") ?? "");
    setEmail(emailDigitado);

    // Confere antes de chamar alguém
    if (!emailDigitado || !senhaDigitada) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    if (!emailValido(emailDigitado)) {
      setErro("Digite um e-mail válido.");
      return;
    }

    setErro(null);
    setEntrando(true);

    const resultado = await aoEntrar({
      email: emailDigitado,
      senha: senhaDigitada,
      lembrarEmail,
    });

    // Deu certo: o "Entrando..." fica até o app trocar de tela
    if (resultado.ok) return;

    setErro(resultado.mensagem);
    setEntrando(false);

    // Senha errada: apaga e devolve o cursor. Nos outros motivos (sem
    // internet, muitas tentativas...) o que foi digitado continua valendo.
    if (resultado.motivo === "credenciais") {
      setSenha("");
      campoSenha.current?.focus();
    }
  }

  return (
    <div className="login">
      <div className="login__fundo" aria-hidden="true" />
      <div className="login__veu" aria-hidden="true" />

      <main className="login__cartao">
        <header className="login__cabecalho">
          <img
            src={CAMINHO_LOGO_BRANCA}
            alt={NOME_EMPRESA}
            className="login__logo"
          />
          <h1 className="login__titulo">Boas-vindas!</h1>
          <span className="login__linha" aria-hidden="true" />
          <p className="login__app">{NOME_APP}</p>
        </header>

        {/* noValidate: as mensagens são as da tela, não os balões do navegador */}
        <form className="login__formulario" noValidate onSubmit={enviar}>
          <div className="login__campo">
            <Icone nome="email" className="login__icone" />
            <input
              className="login__entrada"
              type="email"
              name="email"
              aria-label="E-mail"
              placeholder="E-mail"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              value={email}
              onChange={(evento) => {
                setEmail(evento.target.value);
                setErro(null);
              }}
              onKeyDown={(evento) => {
                // "Próximo" no teclado vai para a senha em vez de enviar
                if (evento.key === "Enter") {
                  evento.preventDefault();
                  campoSenha.current?.focus();
                }
              }}
            />
          </div>

          <div className="login__campo">
            <Icone nome="chave" className="login__icone" />
            <input
              ref={campoSenha}
              className="login__entrada login__entrada--senha"
              type={mostrarSenha ? "text" : "password"}
              name="senha"
              aria-label="Senha"
              placeholder="Senha"
              autoComplete="current-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              value={senha}
              onChange={(evento) => {
                setSenha(evento.target.value);
                setErro(null);
              }}
            />
            <BotaoIcone
              icone={mostrarSenha ? "olho_fechado" : "olho"}
              rotulo={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={mostrarSenha}
              tamanho={20}
              className="login__olho"
              onClick={() => setMostrarSenha((atual) => !atual)}
            />
          </div>

          <label className="login__lembrar">
            <input
              type="checkbox"
              checked={lembrarEmail}
              onChange={(evento) => setLembrarEmail(evento.target.checked)}
            />
            Lembrar meu e-mail
          </label>

          {erro && (
            <p className="login__erro" role="alert">
              <Icone nome="alerta" tamanho={18} />
              <span>{erro}</span>
            </p>
          )}

          <Botao
            type="submit"
            variante="destaque"
            largo
            disabled={entrando}
            className="login__entrar"
          >
            {entrando ? "Entrando..." : "Entrar"}
          </Botao>
        </form>
      </main>

      <footer className="login__rodape">
        <p>Esqueceu a senha? Fale com seu gestor.</p>
        <p>
          {NOME_EMPRESA} &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
