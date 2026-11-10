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

-- ── Relatórios de exemplo ─────────────────────────────────────────
-- Gravados pela própria registrar_relatorio, como a Edge Function faz.
-- Totais conferidos com calcularTotaisDia() do núcleo:
--   reembolso = km × tarifa do executivo;
--   total = km + Cartão Pessoal − Abastecimento no Cartão Clara.

-- 1) Só visita (outubro): BRUNO ROCHA, estresse Alto no Financeiro.
select * from public.registrar_relatorio(
  jsonb_build_object('executivo_id', (select id from public.executivos where nome = 'BRUNO ROCHA'))
  || $json${
    "id_cliente": 1760450000001,
    "fluxos": ["visita"],
    "data_visita": "2026-10-14",
    "total_km": 0, "total_pessoal": 0, "total_abastecimento_clara": 0, "total_final": 0, "km_rodado": 0,
    "agencias": [
      { "nome": "Turismo Aurora", "data_fundacao": "2008-05-12",
        "faturamento_anual": "2500000", "faturamento_anual_rotulo": "Entre R$ 1 mi e R$ 5 mi",
        "produtos": ["Aéreo", "Hotel"], "atendentes": ["Atendente Fictícia A"],
        "cep": null, "logradouro": null, "numero": null, "complemento": null,
        "bairro": null, "cidade": "Porto Alegre", "uf": "RS",
        "estresses": [{ "nivel": "Alto", "setores": ["Financeiro"],
                        "descricao": "Atraso recorrente no repasse de comissões." }],
        "acoes": [{ "setor": "Financeiro", "detalhe": "Enviar o extrato de comissões até sexta-feira." }] }
    ],
    "trajetos": [],
    "despesas": []
  }$json$::jsonb
);

-- 2) Só despesas: BRUNO ROCHA (tarifa 1,43). Trajeto em outubro e
--    despesas sem data (no mês, contam pela data de recebimento).
select * from public.registrar_relatorio(
  jsonb_build_object('executivo_id', (select id from public.executivos where nome = 'BRUNO ROCHA'))
  || $json${
    "id_cliente": 1761000000002,
    "fluxos": ["despesas"],
    "data_visita": null,
    "total_km": 60.06, "total_pessoal": 38.5, "total_abastecimento_clara": 50,
    "total_final": 48.56, "km_rodado": 42,
    "agencias": [],
    "trajetos": [
      { "data": "2026-10-21", "partida": "Porto Alegre - RS", "destino": "Novo Hamburgo - RS",
        "km": 42, "tarifa_km": 1.43, "reembolso": 60.06 }
    ],
    "despesas": [
      { "data": null, "cartao": "Cartão Pessoal", "categoria": "Refeição",
        "valor": 38.5, "nome_comprovante": "nota-almoco.jpg" },
      { "data": null, "cartao": "Cartão Clara", "categoria": "Abastecimento",
        "valor": 50, "nome_comprovante": null }
    ]
  }$json$::jsonb
);

-- 3) Completo (novembro): PAULO SOUZA (tarifa 1,30), 2 agências.
select * from public.registrar_relatorio(
  jsonb_build_object('executivo_id', (select id from public.executivos where nome = 'PAULO SOUZA'))
  || $json${
    "id_cliente": 1762250000003,
    "fluxos": ["visita", "despesas"],
    "data_visita": "2026-11-04",
    "total_km": 304.2, "total_pessoal": 54.9, "total_abastecimento_clara": 180,
    "total_final": 179.1, "km_rodado": 234,
    "agencias": [
      { "nome": "Rota Sul Turismo", "data_fundacao": null,
        "faturamento_anual": null, "faturamento_anual_rotulo": null,
        "produtos": ["Pacotes"], "atendentes": [],
        "cep": null, "logradouro": null, "numero": null, "complemento": null,
        "bairro": null, "cidade": "Curitiba", "uf": "PR",
        "estresses": [{ "nivel": "Médio", "setores": ["Atendimento"],
                        "descricao": "Fila de cotações acima do normal na semana." }],
        "acoes": [] },
      { "nome": "Serra Azul Viagens", "data_fundacao": null,
        "faturamento_anual": null, "faturamento_anual_rotulo": null,
        "produtos": [], "atendentes": [],
        "cep": null, "logradouro": null, "numero": null, "complemento": null,
        "bairro": null, "cidade": "Ponta Grossa", "uf": "PR",
        "estresses": [{ "nivel": "Baixo", "setores": [], "descricao": null }],
        "acoes": [{ "setor": "Comercial", "detalhe": "Apresentar o pacote de fim de ano." }] }
    ],
    "trajetos": [
      { "data": "2026-11-04", "partida": "Curitiba - PR", "destino": "Ponta Grossa - PR",
        "km": 117, "tarifa_km": 1.3, "reembolso": 152.1 },
      { "data": "2026-11-04", "partida": "Ponta Grossa - PR", "destino": "Curitiba - PR",
        "km": 117, "tarifa_km": 1.3, "reembolso": 152.1 }
    ],
    "despesas": [
      { "data": "2026-11-04", "cartao": "Cartão Pessoal", "categoria": "Refeição",
        "valor": 54.9, "nome_comprovante": "nota-jantar.jpg" },
      { "data": "2026-11-04", "cartao": "Cartão Clara", "categoria": "Abastecimento",
        "valor": 180, "nome_comprovante": null },
      { "data": "2026-11-04", "cartao": "Cartão Clara", "categoria": "Pedágio",
        "valor": 22.4, "nome_comprovante": null }
    ]
  }$json$::jsonb
);
