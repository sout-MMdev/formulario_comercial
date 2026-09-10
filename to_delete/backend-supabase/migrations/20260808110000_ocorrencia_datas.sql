-- ==============================================================
-- OCORRÊNCIAS: data de início (quando entra "Em andamento").
-- A data de finalização já existe (data_resolucao). Um gatilho carimba
-- início/fim automaticamente conforme a situação muda (server-side).
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ==============================================================

alter table app.ocorrencias
  add column if not exists data_inicio date;

-- Carimba as datas conforme a situação muda:
--   Em andamento -> registra data_inicio (só na 1ª vez)
--   Resolvido    -> registra data_resolucao; sair de Resolvido limpa
create or replace function app.on_ocorrencia_situacao()
returns trigger language plpgsql set search_path = app, public as $$
begin
  if new.situacao = 'Em andamento' and new.data_inicio is null then
    new.data_inicio := current_date;
  end if;
  if new.situacao = 'Resolvido' then
    if new.data_resolucao is null then
      new.data_resolucao := current_date;
    end if;
  else
    new.data_resolucao := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ocorrencia_situacao on app.ocorrencias;
create trigger trg_ocorrencia_situacao
  before update on app.ocorrencias
  for each row execute function app.on_ocorrencia_situacao();
