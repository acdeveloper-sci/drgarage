# drGarage · Feature 02 — Cotizaciones con aprobación del cliente

> Se construye sobre el feature 01, ya desplegado: no cambia sus rutas, tablas ni comportamiento salvo lo indicado aquí.

## 1. Problema

Cuando el mecánico encuentra una reparación adicional, necesita la aprobación del cliente para seguir. Hoy la pide por llamada o WhatsApp suelto: el cliente tarda horas en contestar, el auto se queda frenado ocupando espacio, y no queda registro de qué aprobó ni cuándo. Eso termina en discusiones ("yo no autoricé eso") y en rebajas en la cuenta.

**Usuario principal:** el dueño o mecánico del taller (ver `docs/producto/icp-y-personas.md`). **Usuario secundario:** el cliente, desde el mismo enlace del feature 01.

## 2. Diseño de la solución

1. En la ficha del auto, el botón "Cotización adicional" abre un formulario: **descripción** y **costo en pesos** (entero mayor que 0).
2. Al guardar, la cotización queda **Pendiente**, el auto pasa a **Cotización enviada** y se registra un evento. Si ya había una pendiente, la anterior pasa a **Anulada** (no se borra).
3. El botón verde de WhatsApp, con una cotización pendiente, cambia su mensaje a: `Hola {nombre}, en Taller Don Ramiro encontramos una reparación adicional para tu {modelo} ({placa}): {descripción} Costo: {costo}. Apruébala o recházala aquí: {enlace}`.
4. En su página (`/auto/{token}`), el cliente ve la cotización pendiente con descripción, costo y dos botones: **Aprobar** y **Rechazar**. Rechazar pide una nota opcional (máx. 140 caracteres) con atajos: "Muy costoso por ahora", "Prefiero revisarlo después", "Solo lo reportado".
5. La decisión se guarda con fecha y hora, es definitiva y **no cambia el estado del auto**: el mecánico la ve en la lista ("Esperando aprobación" / "Cotización aprobada" / "Cotización rechazada") y en el historial de la ficha, y decide qué hacer.
6. **Time to value y diseño intuitivo.** El valor llega cuando el cliente decide, y para eso no necesita cuenta ni instalar nada: abre el enlace, toca Aprobar o Rechazar y, solo si rechaza, escribe una nota (la nota aparece al tocar Rechazar, no antes). El mecánico crea y envía una cotización en menos de 60 s: dos campos y el botón verde de WhatsApp. Cada acción da respuesta clara: "Aprobada el {fecha}" para el cliente y un aviso en la ficha para el mecánico.
7. **Datos de demostración.** `seed:demo` suma cotizaciones a los autos de demostración (una pendiente, una aprobada y una rechazada con nota) y `seed:clear` las borra antes que los autos.

Pantallas de referencia: `design/pantallas/` 08 (formulario), 09 a 11 (cliente), 12 (historial en la ficha). Textos y comportamiento: `design/prototipo/prototipo.html`.

Datos nuevos:

```
cotizaciones: id, auto_id, descripcion, costo_cop (entero), estado (pendiente|aprobada|rechazada|anulada),
              enviada_en, decidida_en (nullable), nota (≤140, nullable)
```

Restricciones: `auto_id` con llave foránea a `autos(id)`; un índice único parcial sobre `auto_id` donde `estado = 'pendiente'` garantiza una sola cotización pendiente por auto, aun con dos envíos simultáneos; RLS activado sin políticas para el rol anónimo.

Arquitectura: igual que el feature 01. Todo acceso a datos en el servidor de Next.js con la clave de servicio; RLS activado sin acceso anónimo. La decisión del cliente es una Server Action (o Route Handler) que recibe el token del auto y el id de la cotización, y valida en el servidor que la cotización pertenezca a ese auto y siga pendiente. La página del cliente ya consulta cada 15 a 20 s, así que la cotización aparece sola.

## 3. Criterios de aceptación

1. **Crear cotización.** DADA la ficha de un auto, CUANDO el mecánico guarda una descripción y un costo mayor que 0, ENTONCES la cotización queda Pendiente con fecha y hora de envío, el auto pasa a Cotización enviada y se registra un evento. SI ya existía otra pendiente, esa pasa a Anulada. SI falta la descripción o el costo no es válido, se muestra un error que dice cómo corregirlo y se conserva lo escrito.
2. **Mensaje de WhatsApp.** DADO un auto con cotización pendiente, CUANDO el mecánico toca el botón verde, ENTONCES se abre `wa.me` con el mensaje de cotización que incluye primer nombre, modelo, placa, descripción, costo con formato `$380.000` y el enlace del auto.
3. **Aprobar.** DADA la página del cliente con una cotización pendiente, CUANDO toca Aprobar, ENTONCES la cotización queda Aprobada con fecha y hora, los botones se reemplazan por "Aprobada el {fecha}", y en la lista del taller el auto muestra "Cotización aprobada".
4. **Rechazar con nota.** DADA la misma página, CUANDO toca Rechazar, escribe o elige una nota (opcional, máx. 140 caracteres) y envía, ENTONCES la cotización queda Rechazada con fecha, hora y nota, y la ficha del taller muestra la nota del cliente en el historial.
5. **Decisión única y segura.** DADA una cotización ya aprobada, rechazada o anulada, CUANDO llega otra decisión (doble toque, otra pestaña, o un token que no corresponde al auto), ENTONCES el servidor no la modifica y devuelve el estado existente. El historial de la ficha lista todas las cotizaciones con estado, monto, descripción, fecha de envío, fecha de decisión y nota.

## 4. Métricas de éxito

Se calculan con los datos de `cotizaciones` y `autos` (consulta SQL en Supabase), sin contar los autos de demostración; no requieren pantalla nueva. No se miden visitas ni páginas vistas.

| Métrica | Definición | Meta para el piloto (4 semanas) |
| --- | --- | --- |
| **Tiempo de decisión (principal)** | Mediana de `decidida_en − enviada_en` en cotizaciones decididas | Menos de 2 horas (línea base estimada: medio día) |
| **Respuesta en el día** | % de cotizaciones decididas en menos de 24 h | ≥ 80 % |
| **Tasa de respuesta** | Decididas ÷ (enviadas − anuladas) | ≥ 90 % |
| **Activación (time to value)** | Horas entre el primer auto registrado y la primera cotización decidida por un cliente | ≤ 48 h |
| **Retención** | Semanas del piloto con al menos una cotización enviada | ≥ 3 de 4 |
| **Disputas (control)** | Reclamos de "yo no autoricé eso" reportados por el taller | 0 |

La tasa de aprobación (aprobadas ÷ decididas) se observa pero no es meta: el objetivo es que el cliente decida rápido e informado, no que apruebe todo.

```sql
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
```

## 5. Fuera de alcance

Aplica a requirements, design y tasks.

- Foto de la reparación (queda para una versión siguiente; requiere Storage).
- Código de acceso del taller, entrega del auto y vencimiento del enlace.
- Cambio automático del estado del auto al aprobar.
- Notificaciones automáticas; el aviso sigue siendo por el botón de WhatsApp.
- Límite de intentos en la decisión pública: queda como límite conocido; la protección es el token no adivinable y la decisión única.
