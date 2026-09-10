-- ==============================================================
-- SEED DE DESENVOLVIMENTO — dados de amostra pra testar a leitura.
-- NÃO é migration (não roda em produção). Rode uma vez no SQL Editor.
-- As agências de verdade virão da importação do Infotera (fase 6).
-- ==============================================================

-- Time comercial (perfil Executivo)
insert into app.executivos (nome, email, perfil) values
  ('Rafael Andrade',    'rafael.andrade@cativa.local',    'Executivo'),
  ('Marcos Tre',        'marcos.tre@cativa.local',        'Executivo'),
  ('Adriana Schlichta', 'adriana.schlichta@cativa.local', 'Executivo'),
  ('Pablo Santana',     'pablo.santana@cativa.local',     'Executivo'),
  ('Fabio Viana',       'fabio.viana@cativa.local',       'Executivo')
on conflict (email) do nothing;

-- >>> VOCÊ (Administrador) — TROQUE o e-mail pelo que vai usar no login <<<
insert into app.executivos (nome, email, perfil) values
  ('Administrador', 'SEU-EMAIL@AQUI.com', 'Administrador')
on conflict (email) do nothing;

-- Agências (amostra do mock)
insert into app.agencias
  (nome, uf, executivo_id, status, data_fundacao, faturamento_anual, produtos, atendentes, logradouro, bairro, cidade, cep)
values
  ('AGENCIA MONTENEGRO - TZ VIAGENS', 'RS',
    (select id from app.executivos where nome='Rafael Andrade'),
    'Ativa', '2024-05-06', '50 mil a 100 mil',
    '["Cruzeiros","Grupos com Guia"]', '["Ana Teixeira","Claudia Correa"]',
    'Rua Ramiro Barcelos, 234', 'Centro', 'Montenegro', '95780-000'),
  ('VIAJAR MAIS TURISMO', 'SC',
    (select id from app.executivos where nome='Marcos Tre'),
    'Ativa', '2024-05-06', '50 mil a 100 mil',
    '["Cruzeiros","Grupos com Guia"]', '["Ana Teixeira","Claudia Correa"]',
    'Rua XV de Novembro, 789', 'Centro', 'Blumenau', '89010-000'),
  ('MUNDO TRAVEL', 'PR',
    (select id from app.executivos where nome='Adriana Schlichta'),
    'Em recuperação', '2024-05-06', '50 mil a 100 mil',
    '["Cruzeiros","Grupos com Guia"]', '["Ana Teixeira","Claudia Correa"]',
    'Av. Vicente Machado, 300', 'Centro', 'Ponta Grossa', '84010-000'),
  ('CAMINHOS DO SUL VIAGENS', 'RS',
    (select id from app.executivos where nome='Pablo Santana'),
    'Prospecção', '2024-05-06', '50 mil a 100 mil',
    '["Cruzeiros","Grupos com Guia"]', '["Ana Teixeira","Claudia Correa"]',
    'Av. Júlio de Castilhos, 1200', 'São Pelegrino', 'Caxias do Sul', '95010-000'),
  ('TURISMO SÃO PAULO LTDA', 'SP',
    (select id from app.executivos where nome='Fabio Viana'),
    'Inativa', '2024-05-06', '50 mil a 100 mil',
    '["Cruzeiros","Grupos com Guia"]', '["Ana Teixeira","Claudia Correa"]',
    'Av. Paulista, 1500', 'Bela Vista', 'São Paulo', '01310-000');

-- Estresse (define o nível atual das agências 1 e 3)
insert into app.estresse_agencia
  (agencia_id, executivo_id, nivel, setores, descricao, data_registro)
values
  ((select id from app.agencias where nome='AGENCIA MONTENEGRO - TZ VIAGENS'),
   (select id from app.executivos where nome='Rafael Andrade'),
   'Alto', '["Financeiro"]', 'Atraso no reembolso gerou desgaste.', '2026-07-07'),
  ((select id from app.agencias where nome='MUNDO TRAVEL'),
   (select id from app.executivos where nome='Adriana Schlichta'),
   'Crítico', '["Comercial","Pós-Venda"]', 'Falta de retorno em cotações.', '2026-05-15');
