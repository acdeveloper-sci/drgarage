# AGENTS.md — Taller Don Ramiro

> Para el feature en curso (01) manda la spec de `.kiro/specs/001-seguimiento-por-enlace/`; `docs/especificacion.md` es referencia del MVP completo, no un encargo. Las reglas de otros features (código del taller, entrega, cotizaciones, fotos) no se implementan en este feature. Donde esta nota contradiga la sección 'Fuentes de verdad', gana esta nota.

Contexto permanente para cualquier agente de código que trabaje en este repositorio.

## Producto

App web móvil de seguimiento de autos para un taller de 4 mecánicos. Dos vistas:

- **Taller** (mecánicos, protegida): registrar ingreso, cambiar estado, crear cotizaciones, avisar por WhatsApp.
- **Cliente** (pública por enlace `/auto/{token}`): ver avance en tiempo real, aprobar o rechazar cotizaciones.

Especificación completa: `docs/especificacion.md`. Léela antes de planificar.

## Fuentes de verdad (en este orden)

1. `docs/especificacion.md` — requisitos, criterios de aceptación, decisiones.
2. `design/design-system/` — tokens (`tokens.json` es la fuente; `tokens.css` es derivado), reglas (`README.md`), componentes (`components/*.md`, `components.css`).
3. `design/prototipo/prototipo.html` — comportamiento y textos de referencia. Es una demo en memoria: copia su UX y su copy, no su arquitectura.
4. `design/pantallas/*.png` — capturas a 390 px de cada pantalla.

Si algo se contradice, gana la especificación. Si algo no está decidido, pregunta; no inventes.

## Reglas de diseño (no negociables)

- Usar los tokens del design system; ningún color, radio o tamaño literal en componentes.
- Controles ≥ 44 px; botones de acción ≥ 64 px; botones de estado ≥ 88 px.
- Colores de estado con significado fijo: Recibido / En proceso / Cotización enviada / Listo (ver README del design system).
- Verde `whatsapp` solo para el botón de WhatsApp. Amarillo `plate` para placa, acción principal de la lista, rol activo y foco.
- Una columna, máximo 480 px, funciona desde 360 px.
- Todo el texto en español de Colombia, tuteando al cliente; botones con verbo + objeto; sin emoji.
- Dinero `es-CO` con punto de miles (`$380.000`); horas en `America/Bogota` (`10:42 a. m.`).
- Accesibilidad: botones reales, `<label>` en cada campo, `aria-pressed` en estados, foco visible, contraste ≥ 4,5:1.

## Reglas técnicas

- Fechas en UTC en la base de datos.
- Token público aleatorio ≥ 128 bits; nunca la placa ni un id secuencial.
- La vista pública no expone el WhatsApp del cliente ni datos de otros autos.
- La decisión sobre una cotización es idempotente y definitiva (validar en el servidor).
- Vista del taller protegida con un código de 4 dígitos compartido (guardado como hash, con límite de intentos).
- "Entregar" archiva el auto (no lo borra) y anula cotizaciones pendientes; el enlace del cliente vence 30 días después.
- Con conexión inestable, nunca mostrar como guardado algo que no se guardó.
- Fuera de alcance: inventario, facturación, repuestos, cuentas por mecánico, registro de qué mecánico hizo cada cambio, API de WhatsApp Business.
