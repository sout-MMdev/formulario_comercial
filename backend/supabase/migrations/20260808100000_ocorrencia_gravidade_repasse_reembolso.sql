-- ==============================================================
-- OCORRÊNCIAS: gravidade (1–5) + responsável (repasse) + notificação
-- REEMBOLSO: Executivo deixa de editar o status (só Admin/Gestor alteram)
--
-- Rode no SQL Editor do Supabase (schema app). É idempotente:
-- pode rodar de novo sem quebrar (if not exists / drop trigger if exists).
-- ==============================================================

-- --------- Ocorrências: campos novos ---------
alter table app.ocorrencias
  add column if not exists gravidade smallint not null default 3
    check (gravidade between 1 and 5),
  add column if not exists responsavel_id bigint
    references app.executivos (id) on delete set null;

-- "as ocorrências que caíram pra mim"
create index if not exists idx_ocorrencias_responsavel
  on app.ocorrencias (responsavel_id);

-- --------- Repasse: notifica o novo responsável ---------
-- Ao mudar responsavel_id (repassar a ocorrência), cria a notificação
-- do sino pra pessoa escolhida. Server-side (SECURITY DEFINER), igual ao
-- gatilho de abertura — o cliente não decide o destinatário sozinho.
create or replace function app.on_ocorrencia_repassada()
returns trigger language plpgsql security definer set search_path = app, public as $$
declare
  v_agencia text;
begin
  -- só quando o responsável muda pra alguém (não-nulo e diferente do anterior)
  if new.responsavel_id is null
     or new.responsavel_id is not distinct from old.responsavel_id then
    return new;
  end if;
  select nome into v_agencia from app.agencias where id = new.agencia_id;
  insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
  values (
    new.responsavel_id,
    'Ocorrência repassada a você',
    coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
    new.setor,
    new.agencia_id
  );
  return new;
end;
$$;

drop trigger if exists trg_ocorrencia_repassada on app.ocorrencias;
create trigger trg_ocorrencia_repassada
  after update on app.ocorrencias
  for each row execute function app.on_ocorrencia_repassada();

-- --------- Reembolso: Executivo não edita mais o status ---------
-- A permissão 'editar_status_despesa' já existe no catálogo; aqui só a
-- REMOVEMOS do perfil Executivo. Administrador e Gestor continuam com ela
-- (e dá pra reconfigurar na tela de Admin depois). Executivo passa a só ver.
delete from app.perfil_permissoes
 where perfil = 'Executivo' and permissao_chave = 'editar_status_despesa';
