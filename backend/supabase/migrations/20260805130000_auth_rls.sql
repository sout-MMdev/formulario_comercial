-- ==============================================================
-- FASE 2 — Auth + RLS por perfil
-- Princípio: o executivo vê o mundo dele; quem "vê tudo" é Administrador
-- ou Gestor (mesma regra do CRM em SessaoContexto.tsx).
--
-- O role de acesso é o `perfil` (espelha o tipo PerfilUsuario do CRM):
--   Administrador | Gestor | Executivo | Operacional
--
-- NOTA: o CRM tem um sistema mais rico (permissões por perfil + liberações/
-- feature flags + acesso do Operacional por setor). Isso vira tabelas numa
-- fase dedicada. Aqui o RLS cobre o essencial: "vê tudo" (Admin/Gestor) x
-- "vê o dele" (Executivo). O Operacional entra no refinamento seguinte.
-- ==============================================================

-- --------------------------------------------------------------
-- Permissões de tabela (o RLS filtra as LINHAS; o grant libera a TABELA)
-- --------------------------------------------------------------
grant usage on schema app to authenticated;
grant select, insert, update, delete on all tables in schema app to authenticated;
alter default privileges in schema app
  grant select, insert, update, delete on tables to authenticated;

-- --------------------------------------------------------------
-- Funções de apoio — rodam como dono (bypassam RLS), sem recursão.
-- --------------------------------------------------------------

-- id do executivo logado (ou NULL se não houver / inativo)
create or replace function app.executivo_atual()
returns bigint
language sql stable security definer
set search_path = app, public
as $$
  select e.id
  from app.executivos e
  where e.auth_id = auth.uid() and e.ativo
  limit 1
$$;

-- perfil do usuário logado (Administrador | Gestor | Executivo | Operacional)
create or replace function app.perfil_atual()
returns text
language sql stable security definer
set search_path = app, public
as $$
  select e.perfil
  from app.executivos e
  where e.auth_id = auth.uid() and e.ativo
  limit 1
$$;

-- o usuário logado "vê tudo"? (Administrador ou Gestor) — igual ao CRM
create or replace function app.ve_tudo()
returns boolean
language sql stable security definer
set search_path = app, public
as $$
  select exists (
    select 1 from app.executivos e
    where e.auth_id = auth.uid() and e.ativo
      and e.perfil in ('Administrador', 'Gestor')
  )
$$;

-- a agência é visível pro usuário logado? (vê tudo, ou é o responsável)
create or replace function app.agencia_visivel(p_agencia_id bigint)
returns boolean
language sql stable security definer
set search_path = app, public
as $$
  select app.ve_tudo() or exists (
    select 1 from app.agencias a
    where a.id = p_agencia_id and a.executivo_id = app.executivo_atual()
  )
$$;

-- a despesa é visível pro usuário logado?
create or replace function app.despesa_visivel(p_despesa_id bigint)
returns boolean
language sql stable security definer
set search_path = app, public
as $$
  select app.ve_tudo() or exists (
    select 1 from app.despesas d
    where d.id = p_despesa_id and d.executivo_id = app.executivo_atual()
  )
$$;

-- --------------------------------------------------------------
-- Gatilho: liga o login ao executivo cadastrado (pelo e-mail).
-- --------------------------------------------------------------
create or replace function app.on_auth_user_created()
returns trigger
language plpgsql security definer
set search_path = app, public
as $$
begin
  update app.executivos
     set auth_id = new.id
   where lower(email) = lower(new.email)
     and auth_id is null;
  return new;
end;
$$;

drop trigger if exists trg_link_executivo on auth.users;
create trigger trg_link_executivo
  after insert on auth.users
  for each row execute function app.on_auth_user_created();

-- ==============================================================
-- POLÍTICAS RLS  ("vê tudo" = Administrador/Gestor)
-- ==============================================================

-- ---- executivos: cada um vê a si; quem vê tudo gerencia todos ----
create policy executivos_select on app.executivos for select to authenticated
  using (app.ve_tudo() or auth_id = auth.uid());
create policy executivos_gestao_ins on app.executivos for insert to authenticated
  with check (app.ve_tudo());
create policy executivos_gestao_upd on app.executivos for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy executivos_gestao_del on app.executivos for delete to authenticated
  using (app.ve_tudo());

-- ---- agencias: executivo vê/edita as dele; criar/apagar = quem vê tudo ----
create policy agencias_select on app.agencias for select to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy agencias_ins on app.agencias for insert to authenticated
  with check (app.ve_tudo());
create policy agencias_upd on app.agencias for update to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual())
  with check (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy agencias_del on app.agencias for delete to authenticated
  using (app.ve_tudo());

-- ---- visitas: executivo vê/registra as suas; histórico não muda ----
create policy visitas_select on app.visitas for select to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy visitas_ins on app.visitas for insert to authenticated
  with check (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy visitas_gestao_upd on app.visitas for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy visitas_gestao_del on app.visitas for delete to authenticated
  using (app.ve_tudo());

-- ---- agencia_visita: segue a visibilidade da agência ----
create policy agvisita_select on app.agencia_visita for select to authenticated
  using (app.agencia_visivel(agencia_id));
create policy agvisita_ins on app.agencia_visita for insert to authenticated
  with check (app.agencia_visivel(agencia_id));
create policy agvisita_upd on app.agencia_visita for update to authenticated
  using (app.agencia_visivel(agencia_id)) with check (app.agencia_visivel(agencia_id));
create policy agvisita_gestao_del on app.agencia_visita for delete to authenticated
  using (app.ve_tudo());

-- ---- estresse_agencia: ENTRADA só do formulário (executivo grava o seu);
--      CRM é leitura → sem UPDATE por usuário comum (só quem vê tudo corrige) ----
create policy estresse_select on app.estresse_agencia for select to authenticated
  using (app.agencia_visivel(agencia_id));
create policy estresse_ins on app.estresse_agencia for insert to authenticated
  with check (executivo_id = app.executivo_atual() or app.ve_tudo());
create policy estresse_gestao_upd on app.estresse_agencia for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy estresse_gestao_del on app.estresse_agencia for delete to authenticated
  using (app.ve_tudo());

-- ---- despesas: executivo cuida das suas; quem vê tudo vê todas e muda status ----
create policy despesas_select on app.despesas for select to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy despesas_ins on app.despesas for insert to authenticated
  with check (executivo_id = app.executivo_atual() or app.ve_tudo());
create policy despesas_upd on app.despesas for update to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual())
  with check (app.ve_tudo() or executivo_id = app.executivo_atual());
create policy despesas_del on app.despesas for delete to authenticated
  using (app.ve_tudo() or executivo_id = app.executivo_atual());

-- ---- notas_fiscais: seguem a visibilidade da despesa ----
create policy notas_select on app.notas_fiscais for select to authenticated
  using (app.despesa_visivel(despesa_id));
create policy notas_ins on app.notas_fiscais for insert to authenticated
  with check (app.despesa_visivel(despesa_id));
create policy notas_upd on app.notas_fiscais for update to authenticated
  using (app.despesa_visivel(despesa_id)) with check (app.despesa_visivel(despesa_id));
create policy notas_del on app.notas_fiscais for delete to authenticated
  using (app.despesa_visivel(despesa_id));

-- ---- historico_agencia: segue a visibilidade da agência; edição = quem vê tudo ----
create policy historico_select on app.historico_agencia for select to authenticated
  using (app.agencia_visivel(agencia_id));
create policy historico_ins on app.historico_agencia for insert to authenticated
  with check (app.agencia_visivel(agencia_id));
create policy historico_gestao_upd on app.historico_agencia for update to authenticated
  using (app.ve_tudo()) with check (app.ve_tudo());
create policy historico_gestao_del on app.historico_agencia for delete to authenticated
  using (app.ve_tudo());
