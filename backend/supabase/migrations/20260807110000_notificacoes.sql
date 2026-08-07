-- ==============================================================
-- NOTIFICAÇÕES (o sino) — criadas pelo SERVIDOR.
-- Um gatilho: ao abrir uma ocorrência com setor, cria a notificação
-- para cada executivo ATIVO daquele setor. Assim o cliente não decide
-- destinatário — só busca "as minhas".
-- ==============================================================

create table app.notificacoes (
  id                bigint generated always as identity primary key,
  para_executivo_id bigint not null references app.executivos (id) on delete cascade,
  titulo            text not null,
  descricao         text,
  setor             text,
  agencia_id        bigint references app.agencias (id) on delete cascade,
  lida              boolean not null default false,
  criado_em         timestamptz not null default now()
);
create index idx_notificacoes_para on app.notificacoes (para_executivo_id);

alter table app.notificacoes enable row level security;

-- Cada um vê/mexe nas suas; quem vê tudo também consegue ler
create policy notif_select on app.notificacoes for select to authenticated
  using (para_executivo_id = app.executivo_atual() or app.ve_tudo());
create policy notif_upd on app.notificacoes for update to authenticated
  using (para_executivo_id = app.executivo_atual())
  with check (para_executivo_id = app.executivo_atual());
create policy notif_del on app.notificacoes for delete to authenticated
  using (para_executivo_id = app.executivo_atual() or app.ve_tudo());

-- Gatilho: abriu ocorrência com setor → notifica os executivos do setor.
-- (Sem política de INSERT pra usuário: só o gatilho grava, como SECURITY DEFINER.)
create or replace function app.on_ocorrencia_criada()
returns trigger language plpgsql security definer set search_path = app, public as $$
declare
  v_agencia text;
begin
  if new.setor is null then
    return new;
  end if;
  select nome into v_agencia from app.agencias where id = new.agencia_id;
  insert into app.notificacoes (para_executivo_id, titulo, descricao, setor, agencia_id)
  select e.id,
         'Nova ocorrência · ' || new.setor,
         coalesce(v_agencia, 'Agência') || ' — ' || new.descricao,
         new.setor,
         new.agencia_id
    from app.executivos e
   where e.ativo and e.setor = new.setor;
  return new;
end;
$$;

drop trigger if exists trg_ocorrencia_notifica on app.ocorrencias;
create trigger trg_ocorrencia_notifica
  after insert on app.ocorrencias
  for each row execute function app.on_ocorrencia_criada();
