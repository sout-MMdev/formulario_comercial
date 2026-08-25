-- ==============================================================
-- ADMIN — foto do colaborador + primeiro acesso + bucket de avatares
--
-- 1) app.executivos ganha:
--    - foto_url             : caminho do arquivo no bucket 'avatares'
--    - precisa_trocar_senha : marca o 1º acesso (senha provisória pendente)
-- 2) Bucket PRIVADO 'avatares' (foto de gente interna não é pública).
--    Leitura: qualquer logado (mostra o colega no CRM, via URL assinada).
--    Enviar/trocar/apagar: só quem "vê tudo" (Administrador/Gestor).
-- ==============================================================

alter table app.executivos
  add column if not exists foto_url             text,
  add column if not exists precisa_trocar_senha boolean not null default false;

-- --------- Bucket de avatares (privado) ---------
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', false)
on conflict (id) do nothing;

-- --------- Políticas do bucket (drop guard: pode rodar de novo) ---------
drop policy if exists avatares_leitura on storage.objects;
create policy avatares_leitura on storage.objects for select to authenticated
  using (bucket_id = 'avatares');

-- Enviar/atualizar/apagar exige "ver tudo" (Admin/Gestor). app.ve_tudo()
-- é security definer (lê o perfil do logado sem esbarrar no RLS).
drop policy if exists avatares_insere on storage.objects;
create policy avatares_insere on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and app.ve_tudo());

drop policy if exists avatares_atualiza on storage.objects;
create policy avatares_atualiza on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and app.ve_tudo())
  with check (bucket_id = 'avatares' and app.ve_tudo());

drop policy if exists avatares_apaga on storage.objects;
create policy avatares_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and app.ve_tudo());
