-- ==============================================================
-- PRIMEIRO ACESSO — a pessoa troca a senha provisória ao entrar.
--
-- Depois de definir a nova senha (supabase.auth.updateUser no front),
-- precisamos baixar a marca precisa_trocar_senha. Mas o RLS de
-- app.executivos só deixa Admin/Gestor darem UPDATE — um Executivo não
-- conseguiria limpar a própria marca.
--
-- Solução: uma função SECURITY DEFINER que mexe SÓ na linha do próprio
-- usuário (auth.uid()) e SÓ nesse campo. Não dá pra usar pra virar
-- Administrador nem tocar em outra linha.
-- ==============================================================

create or replace function app.marcar_senha_trocada()
returns void
language sql
security definer
set search_path = app, public
as $$
  update app.executivos
     set precisa_trocar_senha = false
   where auth_id = auth.uid();
$$;

grant execute on function app.marcar_senha_trocada() to authenticated;
