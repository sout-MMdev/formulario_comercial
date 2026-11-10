-- ================================================================
-- SEED — DADOS FICTÍCIOS PARA DESENVOLVIMENTO E TESTES
-- Nenhum dado real: nomes, e-mails (@empresa.exemplo) e agências são
-- inventados e são os mesmos do modo demonstração do front
-- (packages/nucleo/src/config e apps/*/public/agencias.json).
-- Roda a cada `npm run backend:resetar`.
-- ================================================================

-- Executivos: tarifa 1,43 para os 5 com tarifa especial
-- (config/tarifas.ts) e 1,30 para os demais.
insert into public.executivos (nome, email, tarifa_km) values
  ('BRUNO ROCHA', 'sul01@empresa.exemplo', 1.43),
  ('DIEGO MARTINS', 'sul02@empresa.exemplo', 1.43),
  ('CARLOS NUNES', 'santacatarina@empresa.exemplo', 1.43),
  ('FERNANDA LIMA', 'parana@empresa.exemplo', 1.43),
  ('RENATA DIAS', 'parana02@empresa.exemplo', 1.43),
  ('PAULO SOUZA', 'saopaulo@empresa.exemplo', 1.30),
  ('MARIANA COSTA', 'norte@empresa.exemplo', 1.30),
  ('RICARDO ALVES', 'riodejaneiro@empresa.exemplo', 1.30),
  ('JULIANA PEREIRA', 'bahia@empresa.exemplo', 1.30),
  ('ANDRÉ OLIVEIRA', 'minasgerais@empresa.exemplo', 1.30),
  ('CAMILA RIBEIRO', 'goias@empresa.exemplo', 1.30),
  ('GUSTAVO MENDES', 'brasilia@empresa.exemplo', 1.30);

-- Agências: as 24 do fallback do front (apps/desktop/public/agencias.json).
insert into public.agencias (nome) values
  ('Turismo Aurora'),
  ('Viagens Bela Vista'),
  ('Rota Sul Turismo'),
  ('Mundo Aberto Viagens'),
  ('Horizonte Travel'),
  ('Caminho das Águas Turismo'),
  ('Estrela do Mar Viagens'),
  ('Vento Norte Turismo'),
  ('Serra Azul Viagens'),
  ('Porto Feliz Turismo'),
  ('Sol Nascente Viagens'),
  ('Terra Nova Turismo'),
  ('Ondas Viagens e Turismo'),
  ('Cidade Alta Turismo'),
  ('Bússola Viagens'),
  ('Trilha Verde Turismo'),
  ('Litoral Sul Viagens'),
  ('Grande Rota Turismo'),
  ('Céu Aberto Viagens'),
  ('Passaporte Turismo'),
  ('Nova Era Viagens'),
  ('Recanto Turismo'),
  ('Alvorada Viagens'),
  ('Ponto de Partida Turismo');
