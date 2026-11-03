# Especificación del MVP — Taller Don Ramiro

Fuente de verdad del producto para planificar y desarrollar el MVP. El diseño está en `design/` y el comportamiento de referencia en `design/prototipo/prototipo.html` (abre en el navegador; datos en memoria; código del taller de prueba: 1234).

## 1. Contexto y problema

Taller mecánico pequeño con 4 mecánicos que trabajan desde el celular, casi siempre con las manos sucias.

Problemas a resolver:

1. **Llamadas constantes** de clientes preguntando si el auto está listo.
2. **Reparaciones adicionales frenadas** por falta de aprobación del cliente y de un registro claro de esa aprobación.

Objetivo del MVP: que el cliente consulte el estado por sí mismo desde un enlace y apruebe o rechace cotizaciones, quedando todo registrado con fecha y hora.

## 2. Usuarios

| Usuario | Dispositivo | Acceso |
| --- | --- | --- |
| Mecánico (4, comparten acceso) | Celular, en el taller | Vista del taller, protegida con el código del taller |
| Cliente | Su celular, desde WhatsApp | Vista pública por enlace único, sin registro ni app |

## 3. Requisitos funcionales y criterios de aceptación

### RF0 — Acceso al taller

- La vista del taller DEBE pedir un código numérico de 4 dígitos, único para el taller (no hay cuentas por mecánico).
- El código se ingresa con un teclado numérico grande en pantalla; al completar 4 dígitos se valida sin tocar otro botón.
- SI el código es incorrecto, se muestra "Código incorrecto. Inténtalo de nuevo." y se limpian los dígitos. Tras 5 intentos fallidos, esperar 1 minuto.
- El celular recuerda la sesión hasta que se toque "Cerrar sesión".
- El código lo puede cambiar el dueño del taller fuera de la app (configuración/variable de entorno) en el MVP.

### RF1 — Registrar ingreso de un auto (< 1 minuto)

Campos: nombre del cliente*, WhatsApp del cliente*, placa*, modelo*, problema reportado (opcional).

- CUANDO el mecánico guarda el formulario con los campos obligatorios, el sistema DEBE crear el auto en estado **Recibido**, generar su enlace público único y abrir la ficha del auto con un aviso para enviar el enlace.
- SI falta un campo obligatorio o el WhatsApp no tiene 10 dígitos (o 12 con 57), el sistema DEBE mostrar un error que diga cómo corregirlo y conservar lo escrito.
- La placa se guarda en mayúsculas y sin espacios ni guiones.
- El WhatsApp se normaliza a formato internacional: 10 dígitos → se antepone `57` (Colombia).
- Medida: un mecánico registra un auto en menos de 60 s (5 campos, teclado adecuado por campo).

### RF2 — Vista de taller para mecánicos

- La lista DEBE mostrar los autos **no entregados**, ordenados por última actualización (más reciente primero), cada uno con placa, estado, modelo, cliente, hora y aviso "Esperando aprobación" si tiene una cotización pendiente (o "Cotización aprobada/rechazada" si se decidió hace < 3 h).
- SI no hay autos, mostrar "No hay autos en el taller. Cuando llegue uno, toca "Ingresar auto"."
- Al tocar un auto se abre su ficha con: datos del cliente y problema, botón verde de WhatsApp, 4 botones de estado (2×2), "Entregar al cliente" (solo en Listo), "Cotización adicional", historial de cotizaciones y actividad.
- CUANDO el mecánico toca un estado distinto al actual, el sistema DEBE guardarlo, registrar el cambio en la actividad con fecha y hora, y mostrar un aviso para avisar al cliente.
- Estados: **Recibido, En proceso, Cotización enviada, Listo**. Transiciones libres entre cualquiera de ellos.
- Tamaños mínimos: botones de estado 88 px de alto, botones de acción 64 px, cualquier control 44 px.
- Camino frecuente en 3 toques: auto → estado → WhatsApp.

### RF2.1 — Entregar el auto

- "Entregar al cliente" DEBE aparecer solo cuando el estado es **Listo**.
- Al tocarlo se pide confirmación en la misma pantalla: "¿{nombre} ya recogió el auto? Saldrá de la lista. Su enlace seguirá activo 30 días." con "Sí, entregar" y "Cancelar".
- Al confirmar: se guarda la fecha de entrega, se registra "Entregado al cliente" en la actividad, cualquier cotización pendiente pasa a **Anulada**, el auto sale de la lista (archivado, no borrado) y la lista muestra "{placa} entregado. Su enlace seguirá activo 30 días."
- Entregar no es un quinto estado: es el cierre del ciclo.

### RF3 — Cotización de reparación adicional

Campos: descripción*, costo en COP* (entero > 0), foto opcional (cámara o galería).

- CUANDO se guarda una cotización, el sistema DEBE crearla como **Pendiente**, con fecha y hora de envío, y pasar el auto a **Cotización enviada**.
- Solo puede haber una cotización pendiente por auto. SI se crea una nueva con otra pendiente, la anterior pasa a **Anulada** y queda en el historial. *(El prototipo la reemplaza; el MVP no debe perder historial.)*
- La foto se comprime en el cliente antes de subirla (lado mayor ≤ 1600 px, JPEG, objetivo ≤ 1 MB).

### RF4 — Aviso por WhatsApp con enlace

- La ficha del auto DEBE tener un botón que abra `https://wa.me/<numero>?text=<mensaje codificado>` con un mensaje prellenado según el contexto:

| Contexto | Mensaje |
| --- | --- |
| Recibido | `Hola {nombre}, recibimos tu {modelo} ({placa}) en Taller Don Ramiro. Sigue el avance aquí: {enlace}` |
| Cotización pendiente | `Hola {nombre}, en Taller Don Ramiro encontramos una reparación adicional para tu {modelo} ({placa}): {descripción} Costo: {costo}. Apruébala o recházala aquí: {enlace}` |
| Listo | `Hola {nombre}, tu {modelo} ({placa}) ya está listo para recoger. Detalles aquí: {enlace}` |
| Otro estado | `Hola {nombre}, tu {modelo} ({placa}) está ahora: {estado}. Sigue el avance aquí: {enlace}` |

`{nombre}` = primer nombre. `{costo}` en formato `$380.000`.

- El envío lo hace el mecánico en WhatsApp; la app no puede confirmar que se envió. Al tocar el botón se registra "Aviso abierto en WhatsApp" en la actividad.
- No se usa la API de WhatsApp Business en el MVP.

### RF5 — Vista pública del cliente

- Accesible en `https://{dominio}/auto/{token}` sin registro ni instalación.
- DEBE mostrar: nombre del taller, saludo con el primer nombre, placa, modelo, estado actual en grande con su descripción, hora de última actualización, avance en 4 pasos, cotización pendiente (si hay) y respuestas anteriores.
- Con el auto en **Listo**, DEBE mostrar "Dónde recogerlo": dirección y horario del taller (datos de configuración).
- Con el auto **entregado**: estado "Entregado", fecha de entrega, agradecimiento, respuestas anteriores en solo lectura y "Este enlace estará activo hasta el {fecha}".
- SI han pasado más de 30 días desde la entrega, o el token no existe: pantalla "Este enlace ya no está activo" con el nombre, dirección y horario del taller. Nunca revelar si un token existió.
- No DEBE mostrar el número de WhatsApp ni datos de otros autos.
- Actualización "en tiempo real": la página refleja cambios sin recargar, en ≤ 30 s. En el primer feature se resuelve con sondeo cada 15 a 20 s desde el servidor, sin Supabase Realtime.

### RF6 — Aprobar o rechazar cotizaciones

- CUANDO el cliente toca **Aprobar**, el sistema DEBE marcar la cotización como Aprobada con fecha y hora, y registrarlo en la actividad.
- CUANDO el cliente toca **Rechazar**, el sistema DEBE pedir una nota opcional (máx. 140 caracteres, con atajos "Muy costoso por ahora", "Prefiero revisarlo después", "Solo lo reportado") y, al enviar, marcarla como Rechazada con fecha, hora y nota.
- La decisión es única y definitiva: una cotización ya decidida o anulada no acepta otra decisión (operación idempotente en el servidor; si se repite, se devuelve la decisión existente).
- La decisión **no** cambia el estado del auto automáticamente; el mecánico la ve en la lista y en la ficha y decide.
- La ficha del taller DEBE mostrar el historial de cotizaciones con estado, monto, descripción, foto, fecha/hora de envío y de decisión y nota.

## 4. Fuera de alcance

Inventario, facturación, gestión de repuestos, cuentas por mecánico, registro de qué mecánico hizo cada cambio, pagos, API de WhatsApp Business, app nativa, tema oscuro, pantalla para consultar autos entregados.

## 5. Modelo de datos (propuesta)

```
Taller (una fila; configuración)
  nombre, direccion, horario, codigo_acceso_hash

Auto
  id, token_publico (único, aleatorio ≥128 bits), nombre_cliente, whatsapp (E.164 sin +),
  placa, modelo, problema, estado (recibido|proceso|cotizacion|listo),
  creado_en, actualizado_en, entregado_en (nullable)

Cotizacion
  id, auto_id, descripcion, costo_cop (entero), foto_url (nullable),
  estado (pendiente|aprobada|rechazada|anulada), enviada_en, decidida_en (nullable), nota (≤140, nullable)

Evento (actividad)
  id, auto_id, tipo (ingreso|estado|cotizacion|decision|aviso_whatsapp|entrega), texto, creado_en
```

Todas las fechas en UTC; se muestran en `America/Bogota`, formato `es-CO` (`2 nov, 10:42 a. m.`).

## 6. Requisitos no funcionales

- **Móvil primero**: una columna, máx. 480 px; funciona desde 360 px de ancho.
- **Conexión inestable**: un cambio que no se guardó DEBE indicarse en pantalla y poder reintentarse; nunca se muestra como guardado si no lo está.
- **Rendimiento**: vista pública usable en 3G (< 200 KB de JS inicial como objetivo).
- **Seguridad**: la vista del taller requiere el código; la vista pública solo lee un auto por su token y solo puede decidir su cotización pendiente. Token no adivinable. Limitar intentos en el código y en los endpoints públicos.
- **Accesibilidad**: contraste ≥ 4,5:1, foco visible, etiquetas en campos, botones reales.
- **Idioma**: toda la interfaz en español de Colombia.

## 7. Decisiones resueltas

| # | Decisión |
| --- | --- |
| D1 | Transiciones de estado libres; "Cotización enviada" se pone sola al guardar una cotización. |
| D2 | Aprobar/rechazar no cambia el estado del auto. |
| D3 | Una cotización pendiente por auto; la anterior se anula, no se borra. |
| D4 | Decisión del cliente única e idempotente. |
| D5 | WhatsApp solo por enlace `wa.me`; prefijo 57 por defecto. |
| D6 | Nota de rechazo opcional, ≤ 140 caracteres. |
| D7 | El enlace público usa un token aleatorio, no la placa ni el id. |
| D8 | Acceso al taller con un código de 4 dígitos compartido; sesión recordada en el dispositivo. |
| D9 | "Entregar" solo desde Listo, con confirmación; archiva el auto y anula cotizaciones pendientes. |
| D10 | Enlace del cliente activo hasta 30 días después de la entrega. |
| D11 | No se registra qué mecánico hizo cada cambio. |

## 8. Pendiente de definir antes de construir

| # | Pregunta | Propuesta |
| --- | --- | --- |
| P1 | Stack | [DEFINIR] p. ej. Next.js + Supabase (Postgres; Storage para fotos más adelante) en Vercel, con acceso a datos solo desde el servidor. |
| P2 | Dominio | `donramiro.co` es de ejemplo. |
| P3 | Dirección y horario del taller | Datos de ejemplo hasta tener los reales. |

## 9. Lo que decide el diseño (no el agente)

Ya resuelto en `design/` y en el prototipo; el agente lo replica, no lo reinventa: forma del teclado del código, patrón de confirmación de "Entregar", textos de avisos y estados vacíos, pantalla de enlace vencido, orden visual de la ficha. Si una pantalla necesaria no existe en el diseño (p. ej. el indicador de "sin conexión"), el agente la construye con los tokens y componentes existentes y la señala para revisión.
