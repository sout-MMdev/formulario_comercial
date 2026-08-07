-- ==============================================================
-- PERMISSÕES & LIBERAÇÕES (admin) — configuração de acesso do CRM.
--   permissoes        = catálogo (o que existe pra permitir)
--   perfil_permissoes = quais permissões cada perfil concede
--   liberacoes        = feature flags (ligar/desligar sem código)
-- Todos autenticados LEEM (o app precisa saber o que pode); só quem
-- vê tudo (Admin/Gestor) EDITA. O back-end é a fonte da verdade.
-- ==============================================================

-- --------- Catálogo de permissões ---------
create table app.permissoes (
  chave     text primary key,
  rotulo    text not null,
  descricao text
);
insert into app.permissoes (chave, rotulo, descricao) values
  ('ver_todos_dados', 'Ver todos os dados', 'Enxerga dados de todos os executivos (não só os próprios).'),
  ('acompanhar_ocorrencias', 'Acompanhar ocorrências', 'Recebe e trata as ocorrências direcionadas ao seu setor.'),
  ('editar_status_despesa', 'Editar status de reembolso', 'Alterna uma despesa entre Pendente e Reembolsada.'),
  ('marcar_nao_reembolsavel', 'Marcar como não reembolsável', 'Define despesas como não reembolsáveis (decisão da gestão).'),
  ('gerenciar_agencias', 'Gerenciar agências', 'Edita status e dados cadastrais das agências.'),
  ('gerenciar_usuarios', 'Gerenciar usuários', 'Acessa a administração de usuários e acessos.'),
  ('importar_agencias', 'Importar agências', 'Sobe a planilha do Infotera para atualizar a base.')
on conflict (chave) do nothing;

-- --------- Mapa perfil → permissões ---------
create table app.perfil_permissoes (
  perfil          text not null
                  check (perfil in ('Administrador', 'Gestor', 'Executivo', 'Operacional')),
  permissao_chave text not null references app.permissoes (chave) on delete cascade,
  primary key (perfil, permissao_chave)
);
-- Administrador = todas
insert into app.perfil_permissoes (perfil, permissao_chave)
  select 'Administrador', chave from app.permissoes
on conflict do nothing;
-- Gestor = 5
insert into app.perfil_permissoes (perfil, permissao_chave) values
  ('Gestor', 'ver_todos_dados'),
  ('Gestor', 'acompanhar_ocorrencias'),
  ('Gestor', 'editar_status_despesa'),
  ('Gestor', 'marcar_nao_reembolsavel'),
  ('Gestor', 'gerenciar_agencias')
on conflict do nothing;
-- Executivo / Operacional
insert into app.perfil_permissoes (perfil, permissao_chave) values
  ('Executivo', 'editar_status_despesa'),
  ('Operacional', 'acompanhar_ocorrencias')
on conflict do nothing;

-- --------- Liberações (feature flags) ---------
create table app.liberacoes (
  chave     text primary key,
  nome      text not null,
  descricao text,
  ativa     boolean not null default false
);
insert into app.liberacoes (chave, nome, descricao, ativa) values
  ('envio_email_relatorio', 'Envio de relatório por e-mail', 'Libera os botões de enviar relatórios por e-mail.', true),
  ('importacao_infotera', 'Importação de agências (Infotera)', 'Permite subir a planilha para atualizar a base de agências.', false),
  ('kanban_ocorrencias', 'Kanban de ocorrências', 'Quadro de arrastar as ocorrências entre as colunas de situação.', false)
on conflict (chave) do nothing;

-- --------- Segurança (RLS) ---------
alter table app.permissoes        enable row level security;
alter table app.perfil_permissoes enable row level security;
alter table app.liberacoes        enable row level security;

-- leitura: todo usuário logado (o app precisa saber o que é permitido)
create policy perm_select  on app.permissoes        for select to authenticated using (true);
create policy pperm_select on app.perfil_permissoes for select to authenticated using (true);
create policy lib_select   on app.liberacoes        for select to authenticated using (true);

-- edição: só quem vê tudo (Administrador/Gestor)
create policy pperm_ins on app.perfil_permissoes for insert to authenticated with check (app.ve_tudo());
create policy pperm_del on app.perfil_permissoes for delete to authenticated using (app.ve_tudo());
create policy lib_upd   on app.liberacoes for update to authenticated using (app.ve_tudo()) with check (app.ve_tudo());
