-- ==============================================================
-- OCORRÊNCIAS: prazo (data-limite pra concluir) + o responsável
-- escolhido NA ABERTURA também é notificado.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ==============================================================

alter table app.ocorrencias
  add column if not exists prazo date;

-- Recria on_ocorrencia_criada: notifica o SETOR (como antes) E o
-- RESPONSÁVEL escolhido na abertura (se houver e não for do mesmo setor,
-- pra não duplicar a notificação).
create or replace function app.on_ocorrencia_criada()
returns trigger language plpgsql security definer set search_path = app, public as $$
declare
  v_agencia text;
begin
  select nome into v_agencia from app.agencias where id = new.agencia_id;

  if new.setor is not null then
    insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
    select e.id,
           'Nova ocorrência · ' || new.setor,
           coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
           new.setor,
           new.agencia_id
      from app.executivos e
     where e.ativo and e.setor = new.setor;
  end if;

  if new.responsavel_id is not null then
    insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
    select new.responsavel_id,
           'Você é responsável por uma ocorrência',
           coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
           new.setor,
           new.agencia_id
     where not exists (
       select 1 from app.executivos e
        where e.id = new.responsavel_id and e.ativo
          and e.setor is not distinct from new.setor
     );
  end if;

  return new;
end;
$$;
-- (o gatilho trg_ocorrencia_notifica já aponta pra essa função)
