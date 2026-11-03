# Feature 02 — Diseño técnico: cotizaciones con aprobación del cliente

Se construye sobre el feature 01 (ya desplegado): no cambia sus rutas, tablas ni comportamiento salvo lo indicado aquí. Mantiene la arquitectura del feature 01: todo acceso a datos ocurre en el servidor de Next.js con la clave de servicio, y RLS queda activado sin acceso anónimo.

## 1. Esquema de la base de datos

### 1.1 Migración `supabase/migrations/004_create_cotizaciones.sql`

```sql
-- Cotizaciones de reparaciones adicionales. Fechas en UTC (timestamptz).
-- Sin on delete cascade: lo que el cliente aprobó o rechazó no se borra con el auto.
create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  auto_id uuid not null references public.autos (id),
  descripcion text not null,
  costo_cop integer not null check (costo_cop > 0),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada', 'anulada')),
  enviada_en timestamptz not null default now(),
  decidida_en timestamptz,
  nota text check (char_length(nota) <= 140),
  check ((estado in ('aprobada', 'rechazada')) = (decidida_en is not null)),
  check (nota is null or estado = 'rechazada')
);

-- Una sola cotización pendiente por auto, aun con dos envíos simultáneos.
create unique index cotizaciones_una_pendiente_por_auto
  on public.cotizaciones (auto_id) where estado = 'pendiente';
create index cotizaciones_auto_enviada_idx
  on public.cotizaciones (auto_id, enviada_en desc);

-- RLS sin políticas: solo el servidor de Next.js (service_role) accede.
alter table public.cotizaciones enable row level security;
```

Decisiones:

- La llave foránea **no** lleva `on delete cascade`: el registro de lo que el cliente aprobó es el valor del producto y no debe borrarse junto con el auto. Igual que con `eventos`, un auto con cotizaciones no se puede borrar; los scripts de demostración borran primero las cotizaciones.
- El índice único parcial garantiza una sola cotización pendiente por auto, aun con dos envíos simultáneos.
- Las restricciones de integridad impiden estados incoherentes: una cotización decidida siempre tiene `decidida_en`, una pendiente o anulada nunca, y solo una rechazada puede tener nota.
- RLS activado y ninguna política: solo el servidor (clave de servicio) accede.

### 1.2 Tipos de evento nuevos

`cotizacion_creada` (al crear una cotización pendiente) y `cotizacion_decidida` (cuando el cliente aprueba o rechaza). La columna `eventos.tipo` es texto: no requiere migración.

## 2. Capa de dominio (funciones puras, sin red)

### 2.1 Nuevo módulo `lib/dominio/cotizaciones.ts`

```typescript
export const ESTADOS_COTIZACION = ['pendiente', 'aprobada', 'rechazada', 'anulada'] as const;
export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];
export type DecisionCotizacion = 'aprobar' | 'rechazar';

export const ATAJOS_NOTA = [
  'Muy costoso por ahora',
  'Prefiero revisarlo después',
  'Solo lo reportado',
] as const;

export function esEstadoCotizacion(valor: unknown): valor is EstadoCotizacion {
  return typeof valor === 'string' && (ESTADOS_COTIZACION as readonly string[]).includes(valor);
}

// Una cotización pendiente puede pasar a cualquier otro estado; una decidida o anulada es final.
export function transicionValida(actual: EstadoCotizacion, nuevo: EstadoCotizacion): boolean {
  return actual === 'pendiente' && nuevo !== 'pendiente';
}

export function esFinal(estado: EstadoCotizacion): boolean {
  return estado !== 'pendiente';
}

// Regla de la decisión única: solo una cotización pendiente acepta decisión; en cualquier otro
// caso no se modifica nada y se devuelve el estado existente (idempotencia).
export function resolverDecision(
  actual: EstadoCotizacion,
  decision: DecisionCotizacion,
): { aplicar: boolean; resultado: EstadoCotizacion } {
  if (actual !== 'pendiente') return { aplicar: false, resultado: actual };
  return { aplicar: true, resultado: decision === 'aprobar' ? 'aprobada' : 'rechazada' };
}

// "$380.000", "380.000" o "380000" -> 380000. Los puntos solo valen como separador de miles.
export function parsearCosto(texto: string): number | null {
  const limpio = texto.replace(/[\s$]/g, '');
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(limpio)) return null;
  const n = Number(limpio.replace(/\./g, ''));
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// 380000 -> "$380.000" (sin depender de Intl, que varía entre versiones de ICU)
export function formatearCostoCop(n: number): string {
  return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
```

Además, en el mismo módulo:

- `validarCotizacion({ descripcion, costo })`: devuelve `{ ok: true, descripcion, costoCop }` o `{ ok: false, errores: { descripcion?, costo? } }`. La descripción se recorta y no puede quedar vacía; el costo pasa por `parsearCosto`. Los mensajes de error dicen cómo corregir y son los del prototipo (`design/prototipo/prototipo.html`): "Escribe la descripción de la reparación." y "Escribe el costo en pesos, solo números." La validación del costo es más estricta que la del prototipo (ver sección 14).
- `validarNota(texto)`: recorta; la nota es opcional y de máximo 140 caracteres.

### 2.2 Cambios en `lib/dominio/tipos.ts`

```typescript
export interface Cotizacion {
  id: string;
  autoId: string;
  descripcion: string;
  costoCop: number;
  estado: EstadoCotizacion;
  enviadaEn: Date;
  decididaEn?: Date;
  nota?: string;
}

// Lo único que la página del cliente recibe de una cotización (sin auto_id).
// Incluye la nota: la escribió el propio cliente y la captura 11 se la muestra ("Tu nota").
export type CotizacionPublica = Pick<
  Cotizacion,
  'id' | 'descripcion' | 'costoCop' | 'estado' | 'enviadaEn' | 'decididaEn' | 'nota'
>;
```

- `Auto` suma `ultimaCotizacion?: Cotizacion` (la más reciente que no esté anulada).
- `AutoPublico` suma `cotizacion?: CotizacionPublica` (la más reciente que no esté anulada). Sigue sin WhatsApp ni ningún dato interno del taller; de la cotización no incluye `auto_id`.
- `TipoEvento` suma `cotizacion_creada` y `cotizacion_decidida` (el mapeo de filas lanza error con tipos desconocidos).

### 2.3 Mensaje de WhatsApp (`lib/dominio/mensajes.ts`)

El texto del botón verde también depende de la cotización: con una pendiente es "Enviar cotización por WhatsApp" (texto del prototipo); sin ella sigue siendo "Avisar al cliente por WhatsApp".

`armarMensajeWhatsApp` recibe opcionalmente la cotización pendiente. Con ella usa esta plantilla (texto de la entrada; manda el prototipo si difiere), con el texto codificado con `encodeURIComponent` y el prefijo 57 como en el feature 01:

```
Hola {primerNombre}, en Taller Don Ramiro encontramos una reparación adicional para tu {modelo} ({placa}): {descripción} Costo: {costo}. Apruébala o recházala aquí: {enlace}
```

`{costo}` usa `formatearCostoCop`. Sin cotización pendiente, el mensaje es el del feature 01.

### 2.4 Descripción del estado para el cliente (`lib/dominio/estados.ts`)

El feature 01 usaba para "Cotización enviada" un texto que pedía responder por WhatsApp, porque aprobar aún no existía. Con este feature la descripción depende de la cotización más reciente del auto (`AutoPublico.cotizacion`, que nunca es una anulada):

- **Pendiente:** "Hay una reparación adicional esperando tu aprobación." (texto del prototipo).
- **Ya decidida** (aprobada o rechazada): "Recibimos tu respuesta sobre la reparación adicional."
- **Sin cotización** (estado puesto a mano): el texto del feature 01, "Te enviamos una cotización por una reparación adicional. Respóndenos por WhatsApp."

Se expone como `descripcionEstado(estado, estadoCotizacion?)`; los demás estados conservan los textos del feature 01.

## 3. Acceso a datos (`lib/supabase/consultas.ts`)

### 3.1 Funciones nuevas

- `crearCotizacion(autoId, descripcion, costoCop)`: primero pasa a `anulada` la pendiente del auto, si existe; luego inserta la nueva `pendiente`. Si el insert choca con el índice único (envío simultáneo), devuelve un error para reintentar.
- `listarCotizaciones(autoId)`: historial, la más reciente primero.
- `decidirCotizacion(cotizacionId, autoId, estadoNuevo, nota?)`: un único `update` condicionado (`where id = … and auto_id = … and estado = 'pendiente'`, devolviendo la fila). Es atómico: si no actualiza ninguna fila, la cotización ya no estaba pendiente y se lee y devuelve la existente. `decidida_en` se escribe en UTC desde la función.
- `obtenerCotizacionPorId(id)`: devuelve `null` si no existe o si el id no es uuid, como las demás.

### 3.2 Funciones existentes que cambian

- `obtenerAutoPorId`: incluye `ultimaCotizacion`.
- `listarAutos`: incluye `ultimaCotizacion` de cada auto con **una sola consulta adicional** para todos los autos de la lista (no una por auto).
- `obtenerAutoPorToken`: incluye `cotizacion` (la más reciente que no esté anulada), solo con los campos de `CotizacionPublica`.
- El mapeo de filas a tipos de dominio sigue en un solo lugar (`aAuto`, `aEvento` y el nuevo `aCotizacion`).

## 4. Server Action del taller (`app/(taller)/acciones.ts`)

`crearCotizacion(autoId, estadoPrevio, formData)` con el mismo patrón del formulario de ingreso del feature 01 (estado del formulario con valores y errores):

1. Valida con `validarCotizacion`. Si falla, devuelve los errores por campo y **conserva lo escrito**.
2. Comprueba que el auto existe.
3. Llama a `crearCotizacion` (anula la pendiente anterior y crea la nueva).
4. Registra el evento `cotizacion_creada` (descripción con el texto del prototipo y el costo formateado).
5. Pasa el auto a "Cotización enviada" y actualiza `actualizado_en` con la función `actualizarEstado` existente.
6. Revalida `/`, `/autos/{id}` y `/auto/{token}`.

## 5. Server Action del cliente (`app/auto/[token]/acciones.ts`, archivo nuevo)

`decidirCotizacion(token, cotizacionId, decision, nota?)`:

1. El `decision` solo puede ser `'aprobar'` o `'rechazar'`; cualquier otro valor se rechaza.
2. El token debe corresponder a un auto existente; si no, la acción responde que el enlace no existe y la página muestra la de enlace inactivo del feature 01 (`not-found`).
3. La cotización debe pertenecer a ese auto; si no, no se modifica nada y se devuelve la cotización actual del auto del token (`AutoPublico.cotizacion`). Un enlace nunca devuelve la cotización de otro auto.
4. Si rechaza, valida la nota con `validarNota`; si aprueba, la nota se ignora.
5. Ejecuta el `update` condicionado de `decidirCotizacion` (sección 3). Si no se aplicó, devuelve la cotización existente (decisión única, sin error).
6. Si se aplicó, registra el evento `cotizacion_decidida` con el texto del prototipo ("Cliente aprobó la cotización", o "Cliente rechazó la cotización" seguido de `: “{nota}”` si hay nota) y revalida `/`, `/autos/{id}` y `/auto/{token}`.

Lo que devuelve al navegador es siempre `CotizacionPublica` (nunca `auto_id`).

La acción es pública (solo el token no adivinable la protege), por lo que no confía en nada que venga del navegador salvo el token, el id y la decisión validada. La limitación de intentos queda como límite conocido (fuera de alcance).

## 6. Interfaz del taller

### 6.1 Ficha del auto (`app/(taller)/autos/[id]/`)

- Orden de la ficha (captura 12): cliente y problema, aviso, botón verde, "Cambiar estado", botón "Cotización adicional", "Historial de cotizaciones" y "Actividad". Sin "Ver lo que ve el cliente" ni "Entregar al cliente" (ver sección 14).
- Botón "Cotización adicional" (con ícono +) que abre el formulario en su propia pantalla, `/autos/{id}/cotizacion` (captura 08): encabezado "Cotización adicional" con botón de volver y "{placa} · {modelo}"; campos "Descripción de la reparación" (ejemplo "Ej. Cambio de discos delanteros") y "Costo (COP)" (ejemplo "350000", teclado numérico); botón "Guardar cotización" y nota al pie "Al guardar, el estado pasa a “Cotización enviada” y podrás enviarla por WhatsApp." Sin "Agregar foto" (fuera de alcance). Los errores de los campos se muestran en el bloque de error encima del botón, y se conserva lo escrito. Al guardar vuelve a la ficha con el aviso "Cotización guardada. Envíala al cliente con el botón verde."
- Historial de cotizaciones (captura 12), la más reciente primero: cada una con monto y Chip de estado ("Pendiente", "Aprobada", "Rechazada" o "Anulada"), descripción, "Enviada: {fecha}", "{Estado} el {fecha}" si fue decidida y "Nota del cliente: “{nota}”" (`dr-quote-note`). Sin cotizaciones: "Sin cotizaciones adicionales."
- Actividad: los eventos nuevos usan los textos del prototipo: "Cotización enviada: $380.000", "Cliente aprobó la cotización" y "Cliente rechazó la cotización: “{nota}”".
- El botón verde de WhatsApp usa el mensaje de cotización y el texto "Enviar cotización por WhatsApp" cuando hay una pendiente (sección 2.3).

### 6.2 Lista de autos (`app/(taller)/page.tsx`, `components/ui/CarCard.tsx`)

Debajo de cada tarjeta se muestra un Chip con el texto del prototipo, según `ultimaCotizacion`: "Esperando aprobación" (pendiente), "Cotización aprobada" o "Cotización rechazada". Se usan las clases del sistema de diseño (`dr-chip--pendiente`, `dr-chip--aprobada`, `dr-chip--rechazada`), sin colores escritos a mano. El chip se muestra siempre que haya `ultimaCotizacion`, sin el límite de 3 horas del prototipo (ver sección 14).

### 6.3 Chip "Anulada" (`styles/components.css`)

El historial muestra también las cotizaciones anuladas, y `styles/components.css` no tiene clase para ellas. Se agrega `dr-chip--anulada` según `patrones-adicionales.md` del sistema de diseño: fondo `var(--line)` y texto `var(--ink)`.

## 7. Interfaz del cliente (`app/auto/[token]/`)

### 7.1 Página

Debajo del panel de estado (y del panel de recogida, si el auto está listo) muestra la cotización de `AutoPublico.cotizacion`, si existe. La descripción del estado usa `descripcionEstado` (sección 2.4) con `cotizacion?.estado`. Solo se muestra esa cotización: si ya está decidida, va bajo el encabezado "Tu respuesta" (en singular, en vez de la lista "Tus respuestas" del prototipo; ver sección 14).

### 7.2 Componente `DecisionCotizacion.tsx` (componente de cliente)

- **Pendiente (captura 09):** QuoteCard con "Reparación adicional · requiere tu aprobación", descripción, costo (`formatearCostoCop`) y los botones "Aprobar" y "Rechazar".
- **Al tocar Rechazar (captura 10):** los botones se reemplazan por el campo "¿Por qué la rechazas? (opcional)" (ejemplo "Escribe una breve nota", máximo 140 caracteres, recibe el foco), los atajos (NoteChip; tocar uno pone su texto en el campo), "Enviar rechazo" y "Cancelar".
- **Decidida (captura 11):** bajo "Tu respuesta", monto y Chip de estado, descripción, "Aprobada el {fecha}" o "Rechazada el {fecha}" (con `formatearFecha`) y, si hay nota, "Tu nota: “{nota}”".
- Si la acción devuelve una cotización que ya no está pendiente (por ejemplo, el taller la reemplazó mientras el cliente decidía), muestra su estado actual con el aviso "La cotización cambió mientras respondías. Revisa la información actualizada." y la página se refresca. Si el enlace ya no existe, la página se refresca y muestra la de enlace inactivo.

### 7.3 Sondeo

El sondeo del feature 01 (cada 15 a 20 s) trae la cotización sin cambios. `router.refresh()` conserva el estado del componente de cliente, así que la nota que el cliente esté escribiendo no se pierde.

## 8. Errores de conexión

Mismo patrón del feature 01 para crear la cotización y para decidir: si falla la red, un Notice de error con botón Reintentar; nada se muestra como guardado o decidido hasta que el servidor lo confirma, y lo escrito se conserva. Crear una cotización implica varias operaciones (cotización, evento, estado del auto) que no forman una transacción: si falla una intermedia, el reintento es seguro porque la anulación y el índice único evitan duplicados. Se acepta que un fallo intermedio pueda dejar la cotización sin su evento.

## 9. Time to value y diseño intuitivo

El valor llega cuando el cliente decide:

1. El mecánico crea y envía una cotización en menos de 60 s: dos campos y el botón verde.
2. El cliente decide sin cuenta ni instalación: abre el enlace y toca Aprobar o Rechazar.
3. El mensaje le dice qué se hará y cuánto cuesta.
4. La nota solo aparece si rechaza.

## 10. Componentes del sistema de diseño (`marca-drgarage`)

- **QuoteCard:** cotización pendiente (cliente, `dr-quote`), historial (taller) y "Tu respuesta" (cliente).
- **NoteChip:** atajos de la nota de rechazo. La nota ya escrita se muestra con `dr-quote-note`, como en el prototipo.
- **Chip:** estado de cotización en la lista y en el historial.
- **Field:** formulario de cotización y campo de nota.
- **Notice:** errores del formulario y de conexión.

## 11. Datos de demostración

`scripts/seed-demo.mjs` suma tres cotizaciones a los autos de demostración, con los eventos correspondientes y fechas coherentes: una pendiente en `demo-cotizacion` (estado "Cotización enviada"), una aprobada en `demo-en-proceso` y una rechazada con nota en `demo-listo`, como en la captura de la lista (03). `scripts/clear-demo.mjs` borra primero las cotizaciones de los autos de demostración, luego sus eventos y por último los autos. Ambos siguen usando su propio cliente de Supabase.

## 12. Archivos

**Nuevos:** `lib/dominio/cotizaciones.ts`, `app/auto/[token]/acciones.ts`, `app/auto/[token]/DecisionCotizacion.tsx`, `app/(taller)/autos/[id]/cotizacion/page.tsx`, `app/(taller)/autos/[id]/cotizacion/FormularioCotizacion.tsx`, `components/ui/RespuestaCotizacion.tsx` ("Tu respuesta", sin `"use client"` para renderizar las fechas en el servidor), `supabase/migrations/004_create_cotizaciones.sql`, `docs/metricas.sql`.

**Nuevos (pruebas):** `lib/dominio/estados.test.ts`.

**Modificados:** `lib/dominio/tipos.ts`, `lib/dominio/estados.ts`, `lib/dominio/mensajes.ts`, `lib/supabase/consultas.ts`, `app/(taller)/acciones.ts`, `app/(taller)/page.tsx`, `app/(taller)/autos/[id]/page.tsx`, `app/(taller)/autos/[id]/AccionesAuto.tsx`, `app/auto/[token]/page.tsx`, `components/ui/CarCard.tsx`, `scripts/seed-demo.mjs`, `scripts/clear-demo.mjs`, `styles/components.css`.

## 13. Pruebas (Vitest y fast-check, sin red)

- `lib/dominio/cotizaciones.test.ts`:
  - `esEstadoCotizacion`, `transicionValida` (solo desde pendiente) y `esFinal`.
  - `resolverDecision`: aplicada una sola vez; repetirla o decidir una anulada no cambia nada (propiedad de idempotencia).
  - `parsearCosto` y `formatearCostoCop`: "$380.000", "380000" y "1.250.000" válidos; "0", "12.5", "380,5", vacío y texto no válidos; por propiedad, `parsearCosto(formatearCostoCop(n)) === n`.
  - `validarCotizacion` (errores por campo) y `validarNota` (límite de 140).
  - `ATAJOS_NOTA`: tres opciones, con tildes.
- `lib/dominio/mensajes.test.ts`: texto exacto de la plantilla de cotización, con tildes, ñ y `&`, costo `$380.000`, codificación y prefijo 57.
- `lib/dominio/transformaciones.test.ts`: `AutoPublico` con cotización nunca trae WhatsApp ni `auto_id`; la nota solo aparece si la cotización la tiene.
- `lib/dominio/estados.test.ts`: `descripcionEstado` da, para "Cotización enviada", el texto del prototipo con cotización pendiente, "Recibimos tu respuesta…" con una decidida y el texto del feature 01 sin cotización; los demás estados conservan los textos del feature 01.
- La verificación final incluye las pruebas del feature 01 y la comprobación a 390 px contra las capturas 08 a 12.

## 14. Desviaciones deliberadas del prototipo

- **Chip de cotización en la lista:** el prototipo muestra "Cotización aprobada" o "Cotización rechazada" solo durante las 3 horas siguientes a la decisión. Aquí se muestra siempre, según `ultimaCotizacion`: con el límite, la demostración se quedaría sin indicadores pocas horas después de cargar los datos.
- **"Tus respuestas" en la página del cliente:** el prototipo lista todas las cotizaciones decididas. Aquí el cliente ve solo la más reciente que no esté anulada (`AutoPublico.cotizacion`).
- **Costo:** el prototipo quita todo lo que no sea dígito (acepta "380,5" como 3805). Aquí `parsearCosto` lo rechaza; el mensaje de error es el del prototipo.
- **"Tu respuesta" en singular:** como el cliente ve una sola cotización, el encabezado es "Tu respuesta" en vez de "Tus respuestas".
- **Errores del formulario:** el prototipo muestra un error a la vez; aquí se validan los dos campos y sus mensajes salen juntos en el mismo bloque de error del prototipo.
- **Foto de la reparación:** las capturas 08 y 09 incluyen "Agregar foto (opcional)"; no se construye (fuera de alcance).
- **Ficha:** no se construyen "Ver lo que ve el cliente" (captura 12) ni "Entregar al cliente" (fuera de alcance).
- **Cotización que cambió mientras el cliente respondía y enlace inexistente:** el prototipo no tiene estos casos; el aviso se redactó aquí (sección 7.2), y el enlace inexistente reutiliza la pantalla de enlace inactivo del feature 01.
- **Formato de fechas:** las capturas dicen "2 de nov, 6:29 p. m."; se mantiene `formatearFecha` del feature 01 ("2 nov, 6:29 p. m."), que es el formato de la skill de marca.
- **Barra de demostración:** el selector Mecánico/Cliente y "Enlace abierto de" de las capturas son del prototipo, no de la app.
