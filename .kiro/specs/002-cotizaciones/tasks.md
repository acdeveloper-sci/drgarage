# Implementation Plan: Cotizaciones con aprobación del cliente

## Overview

Este plan implementa el feature 02 de drGarage sobre el feature 01 ya desplegado. Las tareas se organizan en fases: base de datos, lógica de dominio, acceso a datos, acciones del servidor, interfaz del taller, interfaz del cliente, datos de demostración y métricas, pruebas y verificación. Las pruebas son obligatorias: el feature no se da por terminado hasta que `npm test` pase, incluidas las pruebas del feature 01.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.6", "5.6"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "8.1", "8.5"] },
    { "id": 2, "tasks": ["2.4", "2.5", "3.1", "7.1", "7.2", "7.3", "8.2"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "8.3", "8.4"] },
    { "id": 4, "tasks": ["4.1", "4.2", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.1", "6.1", "9.2"] },
    { "id": 6, "tasks": ["5.5", "6.2", "6.3"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["9.3"] }
  ]
}
```

## Tasks

### 1. Base de datos

- [x] 1.1 Crear la migración de `cotizaciones`
  - **Criterio(s)**: Requisitos 1.1, 1.2, 5.1
  - Crear `supabase/migrations/004_create_cotizaciones.sql` con el SQL de la sección 1.1 del diseño: tabla con `decidida_en`, llave foránea a `autos(id)` sin `on delete cascade`, restricciones de integridad (una cotización decidida siempre tiene `decidida_en`; la nota solo existe si fue rechazada y tiene máximo 140 caracteres), índice único parcial por auto con cotización pendiente, índice `(auto_id, enviada_en desc)` y RLS activado sin políticas.

- [x] 1.2 Aplicar la migración en Supabase (paso manual de la persona)
  - **Criterio(s)**: Requisitos 1 a 5
  - La persona ejecuta `004_create_cotizaciones.sql` en el SQL Editor de Supabase y confirma que la tabla `cotizaciones` existe con RLS activado. El agente pide este paso, la marca como bloqueada `[!]` mientras espera la confirmación y no continúa con la sección 3 sin ella.

### 2. Lógica de dominio

- [x] 2.1 Estados y reglas de la cotización
  - **Criterio(s)**: Requisito 5.1
  - Crear `lib/dominio/cotizaciones.ts` con `ESTADOS_COTIZACION`, `EstadoCotizacion`, `DecisionCotizacion`, `ATAJOS_NOTA` (con tildes), `esEstadoCotizacion`, `transicionValida` (solo se sale de pendiente), `esFinal` y `resolverDecision`.

- [x] 2.2 Costo, validación y nota
  - **Criterio(s)**: Requisitos 1.1, 1.3, 2.1, 4.1
  - En el mismo módulo: `parsearCosto`, `formatearCostoCop`, `validarCotizacion` y `validarNota`, como en la sección 2.1 del diseño. Los mensajes de error son los del prototipo ("Escribe la descripción de la reparación." y "Escribe el costo en pesos, solo números."); el costo sigue la regla del diseño y rechaza "380,5".

- [x] 2.3 Tipos del dominio
  - **Criterio(s)**: Requisitos 1.1, 3.1, 4.2, 5.2
  - En `lib/dominio/tipos.ts`: `Cotizacion`, `CotizacionPublica`, `Auto.ultimaCotizacion`, `AutoPublico.cotizacion` y los tipos de evento `cotizacion_creada` y `cotizacion_decidida`.

- [x] 2.4 Mensaje de WhatsApp con cotización
  - **Criterio(s)**: Requisito 2.1
  - En `lib/dominio/mensajes.ts`, `armarMensajeWhatsApp` acepta opcionalmente la cotización pendiente y usa la plantilla de la sección 2.3 del diseño, con `formatearCostoCop` y codificada con `encodeURIComponent`. Sin cotización pendiente conserva el mensaje del feature 01.

- [x] 2.5 Transformación `aAutoPublico` con cotización
  - **Criterio(s)**: Requisitos 3.1, 4.2
  - En `lib/dominio/transformaciones.ts`, `aAutoPublico` incluye `cotizacion` (solo los campos de `CotizacionPublica`) y sigue sin exponer WhatsApp, `auto_id` ni la nota.

- [x] 2.6 Descripción del estado según la cotización
  - **Criterio(s)**: Requisitos 3.1, 4.1
  - En `lib/dominio/estados.ts`, `descripcionEstado(estado, estadoCotizacion?)` como en la sección 2.4 del diseño: para "Cotización enviada", con pendiente "Hay una reparación adicional esperando tu aprobación.", con una decidida "Recibimos tu respuesta sobre la reparación adicional." y sin cotización el texto del feature 01; los demás estados conservan los textos del feature 01.

### 3. Acceso a datos

- [ ] 3.1 Crear cotización y mapeo de filas
  - **Criterio(s)**: Requisitos 1.1, 1.2
  - En `lib/supabase/consultas.ts`: `aCotizacion` (mapeo único de filas a tipos de dominio, fechas como `Date`) y `crearCotizacion(autoId, descripcion, costoCop)`, que anula la pendiente del auto y luego inserta la nueva. Si el insert choca con el índice único, devuelve un error para reintentar.

- [ ] 3.2 Consultas de lectura de cotizaciones
  - **Criterio(s)**: Requisitos 4.2, 5.2
  - `listarCotizaciones(autoId)` (la más reciente primero) y `obtenerCotizacionPorId(id)` (devuelve `null` si no existe o si el id no es uuid).

- [ ] 3.3 Decidir cotización con update condicionado
  - **Criterio(s)**: Requisitos 3.1, 4.1, 5.1
  - `decidirCotizacion(cotizacionId, autoId, estadoNuevo, nota?)` con un único `update` con `where id = … and auto_id = … and estado = 'pendiente'` que devuelve la fila; si no actualiza ninguna, lee y devuelve la existente. `decidida_en` se escribe en UTC desde la función. Incluye una consulta interna que resuelve el id del auto a partir del token y devuelve solo el id.

- [ ] 3.4 Consultas existentes con cotización
  - **Criterio(s)**: Requisitos 3.1, 3.2, 4.2
  - `obtenerAutoPorId` incluye `ultimaCotizacion`; `listarAutos` incluye `ultimaCotizacion` de cada auto con una sola consulta adicional para toda la lista; `obtenerAutoPorToken` incluye `cotizacion` solo con los campos de `CotizacionPublica`; `listarEventos` y `aEvento` aceptan los tipos de evento nuevos.

### 4. Acciones del servidor

- [ ] 4.1 Acción del taller: crear cotización
  - **Criterio(s)**: Requisitos 1.1, 1.2, 1.3
  - En `app/(taller)/acciones.ts`, con el mismo patrón del formulario de ingreso: valida con `validarCotizacion` (errores por campo y valores conservados), comprueba que el auto existe, llama a `crearCotizacion`, registra el evento `cotizacion_creada`, pasa el auto a "Cotización enviada" con `actualizarEstado` y revalida `/`, `/autos/{id}` y `/auto/{token}`.

- [ ] 4.2 Acción del cliente: decidir cotización
  - **Criterio(s)**: Requisitos 3.1, 4.1, 5.1
  - Crear `app/auto/[token]/acciones.ts`. Valida que la decisión sea `aprobar` o `rechazar`, que el token corresponda a un auto y que la cotización pertenezca a ese auto (si no, no modifica nada y devuelve el estado existente); valida la nota si rechaza; ejecuta `decidirCotizacion`; si se aplicó, registra `cotizacion_decidida` y revalida las tres rutas; si no se aplicó, devuelve la cotización existente sin error.

### 5. Interfaz del taller

- [ ] 5.1 Formulario de cotización en la ficha
  - **Criterio(s)**: Requisitos 1.1, 1.3
  - En `app/(taller)/autos/[id]/`: botón "Cotización adicional" y formulario (pantalla 08) con Field para descripción y costo, errores con Notice y valores conservados. Textos del prototipo.

- [ ] 5.2 Historial de cotizaciones en la ficha
  - **Criterio(s)**: Requisitos 4.2, 5.2
  - Lista de todas las cotizaciones (pantalla 12) con estado (Chip), monto, descripción, fecha de envío, fecha de decisión (`formatearFecha`) y nota del cliente (NoteChip).

- [ ] 5.3 Botón de WhatsApp con mensaje de cotización
  - **Criterio(s)**: Requisito 2.1
  - En la ficha, con una cotización pendiente el botón verde abre `wa.me` con el mensaje de cotización y dice "Enviar cotización por WhatsApp"; sin pendiente sigue diciendo "Avisar al cliente por WhatsApp". El enlace usa `NEXT_PUBLIC_SITE_URL`. Se sigue registrando el evento de aviso del feature 01.

- [ ] 5.4 Indicador de cotización en la lista
  - **Criterio(s)**: Requisito 3.2
  - `CarCard` muestra un Chip según `ultimaCotizacion`: "Esperando aprobación", "Cotización aprobada" o "Cotización rechazada", con las clases del sistema de diseño (sin colores escritos a mano). Se muestra siempre que haya `ultimaCotizacion`, sin el límite de 3 horas del prototipo (desviación deliberada, sección 14 del diseño).

- [ ] 5.5 Errores de conexión en el taller
  - **Criterio(s)**: Sección 8 del diseño
  - Si falla la red al crear la cotización: Notice de error con botón Reintentar; nada se muestra como guardado hasta que el servidor confirme y se conserva lo escrito.

- [ ] 5.6 Chip "Anulada" en el sistema de diseño
  - **Criterio(s)**: Requisito 5.2
  - En `styles/components.css`, agregar `dr-chip--anulada` según `patrones-adicionales.md` (fondo `var(--line)`, texto `var(--ink)`), para las cotizaciones anuladas del historial (5.2). Sin colores literales.

### 6. Interfaz del cliente

- [ ] 6.1 Componente de decisión del cliente
  - **Criterio(s)**: Requisitos 3.1, 4.1
  - Crear `app/auto/[token]/DecisionCotizacion.tsx` (componente de cliente): QuoteCard pendiente con Aprobar y Rechazar; al tocar Rechazar, campo de nota (máximo 140) con atajos (NoteChip), enviar y cancelar. Tras aprobar muestra "Aprobada el {fecha}"; tras rechazar, la confirmación de la captura 11. Si la acción devuelve una cotización que ya no está pendiente, muestra su estado actual con un aviso.

- [ ] 6.2 Página pública con la cotización
  - **Criterio(s)**: Requisitos 3.1, 4.1
  - En `app/auto/[token]/page.tsx`, renderizar `DecisionCotizacion` debajo del Stepper cuando `AutoPublico.cotizacion` existe, y mostrar la descripción del estado con `descripcionEstado`. Solo se muestra esa cotización, sin la lista "Tus respuestas" del prototipo (desviación deliberada, sección 14 del diseño). La página sigue dinámica y sin exponer el WhatsApp.

- [ ] 6.3 Errores de conexión del cliente
  - **Criterio(s)**: Sección 8 del diseño
  - Si falla la red al decidir: Notice de error con botón Reintentar; no se muestra como decidida y no se pierde la nota escrita.

### 7. Datos de demostración y métricas

- [ ] 7.1 Cotizaciones en el seed
  - **Criterio(s)**: Sección 11 del diseño
  - En `scripts/seed-demo.mjs`: una cotización pendiente en `demo-cotizacion`, una aprobada en `demo-en-proceso` y una rechazada con nota en `demo-listo`, con sus eventos y fechas coherentes (`actualizado_en` igual al del último evento, como en el seed actual).

- [ ] 7.2 Cotizaciones en el clear
  - **Criterio(s)**: Sección 11 del diseño
  - En `scripts/clear-demo.mjs`: borrar primero las cotizaciones de los autos de demostración, luego sus eventos y por último los autos. Solo filas con el token `demo-…`.

- [ ] 7.3 Consulta SQL de métricas
  - **Criterio(s)**: Métricas de éxito
  - Crear `docs/metricas.sql` con la consulta de la sección 4 de `docs/specs-entrada/002-cotizaciones.md` (tiempo de decisión, respuesta en el día, tasa de respuesta, activación y retención), que excluye los autos de demostración.

### 8. Pruebas con Vitest

- [ ] 8.1 Pruebas de estados y decisión única
  - **Criterio(s)**: Requisito 5.1
  - `lib/dominio/cotizaciones.test.ts`: `esEstadoCotizacion`, `transicionValida` (solo desde pendiente), `esFinal` y `resolverDecision`, con una propiedad de idempotencia (decidir dos veces equivale a decidir una; una anulada no cambia).

- [ ] 8.2 Pruebas de costo, validación y nota
  - **Criterio(s)**: Requisitos 1.3, 2.1, 4.1
  - En el mismo archivo de pruebas: `parsearCosto` y `formatearCostoCop` ("$380.000", "380000" y "1.250.000" válidos; "0", "12.5", "380,5", vacío y texto no válidos; por propiedad, `parsearCosto(formatearCostoCop(n)) === n`), `validarCotizacion`, `validarNota` (límite de 140) y `ATAJOS_NOTA`.

- [ ] 8.3 Pruebas del mensaje con cotización
  - **Criterio(s)**: Requisito 2.1
  - `lib/dominio/mensajes.test.ts`: texto exacto de la plantilla de cotización (tildes, ñ, `&`, costo `$380.000`), codificación y prefijo 57; el mensaje sin cotización no cambia.

- [ ] 8.4 Pruebas de `aAutoPublico` con cotización
  - **Criterio(s)**: Requisitos 3.1, 4.2
  - `lib/dominio/transformaciones.test.ts`: con cotización, el resultado nunca incluye WhatsApp, `auto_id` ni nota.

- [ ] 8.5 Pruebas de la descripción del estado
  - **Criterio(s)**: Requisitos 3.1, 4.1
  - `lib/dominio/estados.test.ts`: `descripcionEstado` da, para "Cotización enviada", el texto del prototipo con cotización pendiente, "Recibimos tu respuesta…" con una decidida y el texto del feature 01 sin cotización; los demás estados conservan los textos del feature 01.

### 9. Verificación

- [ ] 9.1 Verificar la interfaz contra las capturas
  - **Criterio(s)**: Requisitos 1 a 5
  - A 390 px, comparar con `design/pantallas/` 08 a 12: formulario, historial, lista con indicadores, página del cliente (pendiente, aprobada y rechazada) y el mensaje de WhatsApp.

- [ ] 9.2 Verificar el flujo contra Supabase
  - **Criterio(s)**: Requisitos 1 a 5
  - Con datos de ejemplo y limpiando lo que se cree: crear una cotización, crear otra (la primera queda anulada), aprobar, rechazar con nota, repetir una decisión (devuelve el estado existente) y decidir con un token que no corresponde al auto (no modifica nada).

- [ ] 9.3 Verificación final de calidad
  - **Criterio(s)**: Todos los requisitos
  - `npm run lint`, `npm test` (incluye las pruebas del feature 01) y `npm run build` sin errores; las rutas de datos siguen dinámicas; ninguna variable `NEXT_PUBLIC_` contiene claves; `.env.local` no está en el repositorio.

## Notes

- La spec de este feature es la guía principal; `docs/` y `design/` son material de referencia. El feature 01 no se modifica salvo lo indicado aquí.
- Las pruebas de la sección 8 son obligatorias: el agente las ejecuta (`npm test`) antes de marcar cada tarea como hecha.
- La tarea 1.2 la hace la persona: el agente la pide, la marca bloqueada y espera confirmación.
- Los waves salen de las dependencias lógicas entre tareas. Varias tareas editan los mismos archivos (por ejemplo `lib/supabase/consultas.ts`); se recomienda ejecutarlas en orden, una a la vez.
- La verificación visual se hace contra los mockups de `design/`; si el agente no puede abrir el navegador, pide a la persona que revise contra las capturas.
