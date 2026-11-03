-- Métricas de éxito del feature 02 (cotizaciones): ver .kiro/specs/002-cotizaciones/requirements.md.
-- Ejecutar en el SQL Editor de Supabase. Solo lectura.
-- Excluye los autos de demostración (token que empieza por "demo-")
with c as (
  select cot.*
  from cotizaciones cot
  join autos a on a.id = cot.auto_id
  where a.token_publico not like 'demo-%'
)
select
  (select percentile_cont(0.5) within group (order by extract(epoch from decidida_en - enviada_en) / 3600)
     from c where estado in ('aprobada', 'rechazada')) as mediana_horas,
  (select avg((decidida_en - enviada_en < interval '24 hours')::int) * 100
     from c where estado in ('aprobada', 'rechazada')) as pct_en_24h,
  (select count(*) filter (where estado in ('aprobada', 'rechazada'))::numeric
          / nullif(count(*) filter (where estado <> 'anulada'), 0) * 100
     from c) as tasa_respuesta,
  (select extract(epoch from min(decidida_en)
            - (select min(creado_en) from autos where token_publico not like 'demo-%')) / 3600
     from c where decidida_en is not null) as horas_hasta_primer_valor,
  (select count(distinct date_trunc('week', enviada_en)) from c) as semanas_con_cotizacion;
