-- ================================================================
-- MIGRATION — registrar_relatorio(payload jsonb)
--
-- Grava um relatório inteiro (relatório + visitas + estresses + ações
-- + trajetos + despesas) numa transação só: ou entra tudo, ou nada.
--
-- Idempotente: o app gera um id por dia (id_cliente). Se o mesmo
-- executivo reenviar o mesmo id (rede caiu, clique duplo), a função
-- não grava de novo e devolve o relatório que já existe, dizendo se a
-- cópia por e-mail já foi enviada (para não mandar duas vezes).
--
-- Quem chama: só a Edge Function receber-formulario, com a chave de
-- serviço. O payload chega validado e com os totais recalculados no
-- servidor (backend/supabase/functions/_compartilhado/montagem.ts).
-- ================================================================

create function public.registrar_relatorio(payload jsonb)
returns table (relatorio_id bigint, novo boolean, email_ja_enviado boolean)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_executivo_id bigint := (payload ->> 'executivo_id')::bigint;
  v_id_cliente bigint := (payload ->> 'id_cliente')::bigint;
  v_relatorio_id bigint;
  v_visita_id bigint;
  v_agencia jsonb;
begin
  -- 1) Relatório. "on conflict do nothing" resolve até dois envios
  --    simultâneos do mesmo dia: só um insere, o outro cai no reenvio.
  insert into public.relatorios (
    executivo_id, id_cliente, fluxos, data_visita,
    total_km, total_pessoal, total_abastecimento_clara, total_final, km_rodado
  )
  values (
    v_executivo_id,
    v_id_cliente,
    array(select jsonb_array_elements_text(payload -> 'fluxos')),
    (payload ->> 'data_visita')::date,
    (payload ->> 'total_km')::numeric,
    (payload ->> 'total_pessoal')::numeric,
    (payload ->> 'total_abastecimento_clara')::numeric,
    (payload ->> 'total_final')::numeric,
    (payload ->> 'km_rodado')::numeric
  )
  on conflict (executivo_id, id_cliente) do nothing
  returning id into v_relatorio_id;

  -- 2) Reenvio: não grava nada, devolve o que já existe.
  if v_relatorio_id is null then
    select r.id into v_relatorio_id
    from public.relatorios r
    where r.executivo_id = v_executivo_id and r.id_cliente = v_id_cliente;

    return query
      select v_relatorio_id, false,
        exists (
          select 1 from public.emails_enviados e
          where e.relatorio_id = v_relatorio_id and e.situacao = 'enviado'
        );
    return;
  end if;

  -- 3) Agências visitadas, cada uma com seus estresses e ações.
  for v_agencia in
    select value from jsonb_array_elements(coalesce(payload -> 'agencias', '[]'::jsonb))
  loop
    insert into public.visitas_agencias (
      relatorio_id, agencia_id, nome_agencia, data_fundacao,
      faturamento_anual, faturamento_anual_rotulo, produtos, atendentes,
      cep, logradouro, numero, complemento, bairro, cidade, uf
    )
    values (
      v_relatorio_id,
      -- Liga ao cadastro ignorando maiúsculas e espaços; fora dele, fica nulo.
      (select a.id from public.agencias a
       where lower(btrim(a.nome)) = lower(btrim(v_agencia ->> 'nome'))),
      btrim(v_agencia ->> 'nome'),
      (v_agencia ->> 'data_fundacao')::date,
      v_agencia ->> 'faturamento_anual',
      v_agencia ->> 'faturamento_anual_rotulo',
      array(select jsonb_array_elements_text(coalesce(v_agencia -> 'produtos', '[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(v_agencia -> 'atendentes', '[]'::jsonb))),
      v_agencia ->> 'cep',
      v_agencia ->> 'logradouro',
      v_agencia ->> 'numero',
      v_agencia ->> 'complemento',
      v_agencia ->> 'bairro',
      v_agencia ->> 'cidade',
      v_agencia ->> 'uf'
    )
    returning id into v_visita_id;

    insert into public.registros_estresse (visita_agencia_id, nivel, setores, descricao)
    select v_visita_id, e.nivel, coalesce(e.setores, '{}'), e.descricao
    from jsonb_to_recordset(coalesce(v_agencia -> 'estresses', '[]'::jsonb))
      as e (nivel public.nivel_estresse, setores text[], descricao text);

    insert into public.acoes_acordadas (visita_agencia_id, setor, detalhe)
    select v_visita_id, a.setor, a.detalhe
    from jsonb_to_recordset(coalesce(v_agencia -> 'acoes', '[]'::jsonb))
      as a (setor text, detalhe text);
  end loop;

  -- 4) Trajetos e despesas.
  insert into public.trajetos (relatorio_id, data, partida, destino, km, tarifa_km, reembolso)
  select v_relatorio_id, t.data, t.partida, t.destino, t.km, t.tarifa_km, t.reembolso
  from jsonb_to_recordset(coalesce(payload -> 'trajetos', '[]'::jsonb))
    as t (data date, partida text, destino text, km numeric, tarifa_km numeric, reembolso numeric);

  insert into public.despesas (relatorio_id, data, cartao, categoria, valor, nome_comprovante)
  select v_relatorio_id, d.data, d.cartao, d.categoria, d.valor, d.nome_comprovante
  from jsonb_to_recordset(coalesce(payload -> 'despesas', '[]'::jsonb))
    as d (data date, cartao public.tipo_cartao, categoria text, valor numeric, nome_comprovante text);

  return query select v_relatorio_id, true, false;
end;
$$;

comment on function public.registrar_relatorio(jsonb) is
  'Grava um relatório completo de forma atômica e idempotente por (executivo_id, id_cliente). Só para service_role.';

-- Só a chave de serviço (Edge Functions) executa a função.
revoke all on function public.registrar_relatorio(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_relatorio(jsonb) to service_role;
