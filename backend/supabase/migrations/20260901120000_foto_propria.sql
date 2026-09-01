-- ==============================================================
-- FOTO PRÓPRIA — cada usuário edita a SUA foto (self-service).
--
-- Até aqui só Admin/Gestor mexiam em foto (app.ve_tudo()). Aqui liberamos
-- o próprio usuário a gerenciar a foto DELE — sem abrir pra bagunçar a dos
-- outros. Duas travas:
--   1) Storage: a pessoa só escreve na PRÓPRIA pasta do bucket
--      (o caminho começa com o auth.uid() dela).
--   2) Banco: funções SECURITY DEFINER que mexem SÓ na linha do próprio
--      usuário (where auth_id = auth.uid()) e SÓ no campo foto_url.
--
-- As políticas de Admin/Gestor (ve_tudo) continuam valendo — políticas são
-- permissivas (somam-se via OR).
-- ==============================================================

-- --------- Storage: a pessoa gerencia a PRÓPRIA pasta (<auth.uid()>/...) ---------
drop policy if exists avatares_insere_propria on storage.objects;
create policy avatares_insere_propria on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatares_atualiza_propria on storage.objects;
create policy avatares_atualiza_propria on storage.objects for update to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatares_apaga_propria on storage.objects;
create policy avatares_apaga_propria on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- --------- Banco: define/remove a PRÓPRIA foto (só a própria linha) ---------
create or replace function app.definir_minha_foto(caminho text)
returns void
language sql
security definer
set search_path = app, public
as $$
  update app.executivos
     set foto_url = caminho
   where auth_id = auth.uid();
$$;
grant execute on function app.definir_minha_foto(text) to authenticated;

create or replace function app.remover_minha_foto()
returns void
language sql
security definer
set search_path = app, public
as $$
  update app.executivos
     set foto_url = null
   where auth_id = auth.uid();
$$;
grant execute on function app.remover_minha_foto() to authenticated;
