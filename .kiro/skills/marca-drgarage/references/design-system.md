# Taller Don Ramiro

Sistema de diseño de la app de seguimiento de autos del Taller Don Ramiro: una herramienta móvil que usan 4 mecánicos con las manos sucias, y una página pública que el cliente abre desde un enlace de WhatsApp sin registrarse. Todo en español.

Se construyó a partir del prototipo funcional de la app (vista del mecánico y vista del cliente). Los valores de este sistema son los del prototipo; donde se ajustaron, se indica.

## Principios

1. **Manos sucias, pocos toques.** Ningún control mide menos de `touch-min` (44px). Las acciones del mecánico usan `button-height` (64px) y los cambios de estado `status-button-height` (88px). Una tarea común (abrir auto → cambiar estado → avisar por WhatsApp) cabe en 3 toques.
2. **Se lee de lejos y bajo luz de taller.** Texto `ink` sobre `ground`/`surface`, pesos 700–800 en todo lo accionable. Todo par de texto pasa 4,5:1.
3. **El estado se ve sin leer.** Cada estado del auto tiene su color, siempre en el mismo orden: Recibido → En proceso → Cotización enviada → Listo. Los cuatro se distinguen también por luminosidad, no solo por tono.
4. **Una sola acción principal por pantalla.** En la ficha del auto es el botón verde de WhatsApp; en la lista, el botón amarillo "Ingresar auto".
5. **Sin cuentas, sin instalaciones para el cliente.** La vista pública debe entenderse sin explicación: estado actual en grande, avance en pasos y, si hay una cotización, dos botones: Aprobar / Rechazar.

## Voz y contenido

- Tutear al cliente: "Hola, Carlos", "Apruébala o recházala aquí".
- Botones con verbo y objeto: "Registrar ingreso", "Guardar cotización", "Enviar rechazo". Nunca "OK" ni "Enviar" a secas.
- Errores que dicen cómo corregir: "Revisa el WhatsApp: debe tener 10 dígitos, por ejemplo 300 123 4567."
- Avisos tras una acción, en `notice-bg`: "Estado cambiado a "Listo". Avisa al cliente con el botón verde."
- Dinero en pesos colombianos con punto de miles: `$380.000` (formato `es-CO`). Horas en 12 h: `10:42 a. m.`.
- Fechas cortas: `2 nov, 10:42 a. m.`.
- Placas en mayúsculas, sin guion: `KMT482`.
- Sin emoji.

## Fundamentos visuales

**Color.** Una base neutra cálida (`ground`, `surface`, `line`) con `ink` casi negro. Un solo acento de marca: `plate`, el amarillo de las placas colombianas, que aparece en la insignia de placa, en "Ingresar auto", en el rol activo y en el anillo de foco (`focus-ring`). El verde `whatsapp` se reserva para enviar mensajes. Los colores de estado son semánticos, no decorativos:

| Estado | Relleno (botón activo) | Píldora |
| --- | --- | --- |
| Recibido | `status-recibido` | `status-recibido-bg` / `status-recibido-fg` |
| En proceso | `status-proceso` | `status-proceso-bg` / `status-proceso-fg` |
| Cotización enviada | `status-cotizacion` | `status-cotizacion-bg` / `status-cotizacion-fg` |
| Listo | `status-listo` | `status-listo-bg` / `status-listo-fg` |

Las cotizaciones reusan esos colores: Pendiente = cotización, Aprobada = listo, Rechazada = `reject` / `reject-bg`.

**Tipografía.** Una sola familia, Archivo (Google Fonts), con fallback `Helvetica Neue, Arial, system-ui`. Pesos 800 para títulos, botones y placas; 600–700 para datos; 400 para texto corrido. Cifras tabulares en precios y horas.

**Espaciado y forma.** Escala de 4px (`space-1` … `space-6`). Margen lateral mínimo `space-4` (16px) más el área segura del teléfono. Radios: `radius-sm` solo para la placa, `radius-md` para campos, `radius-lg` para botones y tarjetas, `radius-pill` para píldoras. Sin sombras; los objetos se separan con borde de 2px `line`.

**Composición.** Una columna, máximo `app-max-width` (480px), centrada en pantallas grandes. Encabezado oscuro (`ink`) con título o placa; debajo, el contenido sobre `ground`. Las acciones van arriba del historial, nunca escondidas al final.

## Iconografía

Íconos de trazo en SVG en línea, `stroke="currentColor"`, trazo 2,4–3, extremos redondeados, 24–26px en botones. Juego actual: más (+), volver (chevron), mensaje (burbuja), cámara, check, candado, ojo. No usar el logotipo de WhatsApp ni emoji; la palabra "WhatsApp" y el color verde bastan.

## Componentes

Todos son clases CSS en `components/bundle.css` (prefijo `dr-`), aplicables desde HTML, React, Vue o Flutter (traduciendo tokens). El contenedor raíz lleva `class="dr-app"`.

- **Button** — `dr-btn` + variante: `--primary`, `--accent`, `--whatsapp`, `--outline`, `--approve`, `--reject`, `--link`.
- **IconButton** — `dr-iconbtn`, siempre con `aria-label`.
- **StatusButton** — `dr-status-btn--<estado>` dentro de `dr-status-grid`, con `aria-pressed`.
- **Plate** — `dr-plate` (`--xl` en la vista del cliente).
- **Chip** — `dr-chip--<estado|pendiente|aprobada|rechazada>`.
- **CarCard** — `button.dr-card` con placa, píldora, modelo, cliente, hora y aviso opcional.
- **QuoteCard** — `dr-quote` (pendiente, para el cliente) y `dr-card` (historial).
- **Field** — `dr-field` + `dr-input` / `dr-textarea`, `dr-photo` para la foto, `dr-error`.
- **Notice** — `dr-notice`, con `role="status"`.
- **AppHeader** — `dr-header`.
- **Stepper** — `dr-steps` / `dr-step--done|--current`.
- **NoteChip** — `dr-notechip`, motivos rápidos de rechazo.

## Accesibilidad

- Botones reales (`<button>`, `<a href>`), nunca `div` con clic.
- Cada campo con `<label>`; errores con `role="alert"`.
- Foco visible con `focus-ring` (amarillo `plate`).
- Contraste verificado: todo texto ≥ 4,5:1; bordes de campos (`line-strong`) ≥ 3:1. Ajuste respecto al prototipo: `line-strong` pasó de #A9A79F (2,4:1) a #85837B (3,8:1).
- Respetar `prefers-reduced-motion`; la única animación es un destello breve del aviso.

## Lo que este sistema no cubre todavía

Tema oscuro, pantallas de administración, impresión y facturación (fuera de alcance del MVP).
