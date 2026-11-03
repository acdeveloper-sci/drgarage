# Producto — drGarage

> **Nota**: para el feature en curso, usa la spec de `.kiro/specs/001-seguimiento-por-enlace/`. El archivo `docs/especificacion.md` es referencia del MVP completo, no un encargo individual.

## Qué es drGarage

App web móvil para que los clientes de un taller mecánico puedan seguir el avance de sus reparaciones y aprobar o rechazar cotizaciones adicionales sin llamar por teléfono.

El taller se llama **Taller Don Ramiro** ("dr" viene de Don Ramiro). Este nombre aparece en la vista del cliente y en los mensajes de WhatsApp enviados.

## Para quién

- **Taller Don Ramiro**: 4 mecánicos que trabajan desde el celular, casi siempre con las manos sucias.
- **Clientes del taller**: personas que dejan su auto y necesitan saber si está listo, sin llamar constantemente.

## El problema

1. Llamadas constantes de clientes preguntando si el auto está listo.
2. Reparaciones adicionales frenadas por falta de aprobación del cliente y de un registro claro.

## Las dos vistas

| Vista | Ruta | Acceso |
|-------|------|--------|
| **Taller** | `/` (vista principal) | Código numérico de 4 dígitos |
| **Cliente** | `/auto/{token}` | Enlace público único por auto |

- **Vista del taller**: los mecánicos registran ingresos, cambian estados, crean cotizaciones y avisan al cliente por WhatsApp.
- **Vista del cliente**: seguimiento en tiempo real, aprobación o rechazo de cotizaciones, sin registro ni instalación.

## Reglas de producto

- Un código de 4 dígitos compartido protege la vista del taller.
- Cada auto tiene un token público aleatorio (≥128 bits) para la vista del cliente.
- Una cotización pendiente por auto; la anterior se anula pero se guarda en historial.
- La decisión del cliente (aprobar/rechazar) es única e idempotente.
- "Entregar" archiva el auto y anula cotizaciones pendientes; el enlace dura 30 días después.
- Todo en español de Colombia, tuteando al cliente.

## Fuera de alcance

Inventario, facturación, gestión de repuestos, cuentas por mecánico, registro de qué mecánico hizo cada cambio, pagos, API de WhatsApp Business, app nativa, tema oscuro, pantalla para consultar autos entregados.

## Referencias

- Especificación completa del MVP: `docs/especificacion.md`
- Diseño (tokens, componentes, prototipos): `design/`
- Spec de cada feature: `.kiro/specs/`
