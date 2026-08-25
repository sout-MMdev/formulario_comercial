-- ==============================================================
-- PASSO 0 (re-importação) — limpa os dados de MOVIMENTO antes de
-- substituir a base de agências.
--
-- Necessário porque visitas/estresse/ocorrências/etc. têm foreign key
-- pras agências: sem limpar, o "delete from app.agencias" do passo 1 falha.
--
-- ⚠️ Use SÓ numa substituição COMPLETA da base (isto apaga esses
--    registros). Numa atualização por id_infotera (upsert) NÃO rode isto.
-- ==============================================================
delete from app.ocorrencia_anexos;
delete from app.ocorrencia_andamentos;
delete from app.ocorrencias;
delete from app.notas_fiscais;
delete from app.despesas;
delete from app.notificacoes;
delete from app.historico_agencia;
delete from app.estresse_agencia;
delete from app.agencia_visita;
delete from app.trajetos;
delete from app.visitas;
