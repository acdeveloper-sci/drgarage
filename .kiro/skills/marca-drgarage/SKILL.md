---
name: marca-drgarage
description: Aplica la marca y el design system de drGarage (colores, tipografía, tamaños táctiles, componentes dr-, textos en español de Colombia). Úsala siempre que crees o modifiques una pantalla, componente, estilo o texto visible de la vista del taller o de la vista del cliente.
---

# Marca drGarage

**drGarage** es la app; **Taller Don Ramiro** es el taller que la usa. El cliente ve el nombre del taller ("Taller Don Ramiro"), no el de la app. Dónde aparece cada nombre:

- drGarage aparece SOLO en el título de la pestaña del navegador de la vista del taller: "drGarage".
- Los encabezados de las pantallas siguen diciendo "Taller Don Ramiro", igual que en las capturas.
- El título de la pestaña de la vista del cliente es "Tu auto · Taller Don Ramiro".
- Por ahora no hay ícono propio de la app.

El prefijo `dr-` de las clases viene de Don Ramiro.

App móvil para un taller de 4 mecánicos que la usan con las manos sucias, y página pública que el cliente abre desde WhatsApp. Todo en español de Colombia.

## Cómo aplicar el sistema

1. Usa los tokens de `references/tokens.css` (copiado al proyecto como `styles/tokens.css`) y las clases de `references/components.css` (como `styles/components.css`). Impórtalos una vez en `app/layout.tsx`.
2. Construye la interfaz con las clases `dr-` de los componentes. No uses Tailwind ni colores, radios o tamaños literales: siempre `var(--token)`.
3. La raíz de cada vista lleva `class="dr-app"`. Fuente Archivo (Google Fonts, vía `next/font/google`), con el fallback del token `--font-sans`.
4. Para el detalle de un componente o patrón, lee `references/design-system.md` y `references/patrones-adicionales.md`. Para valores exactos, `references/tokens.json`.

## Reglas que no se rompen

- **Tamaños táctiles:** cualquier control ≥ 44 px (`--touch-min`); botones de acción ≥ 64 px (`--button-height`); botones de estado ≥ 88 px (`--status-button-height`).
- **Colores con significado fijo:**
  - `plate` (amarillo de placa): insignia de placa, botón "Ingresar auto", foco. Nada más.
  - `whatsapp` (verde): solo el botón de WhatsApp.
  - Estados, siempre en este orden: Recibido (`status-recibido`), En proceso (`status-proceso`), Cotización enviada (`status-cotizacion`), Listo (`status-listo`).
  - `reject`: errores y rechazo.
- **Una columna**, máximo 480 px (`--app-max-width`), funciona desde 360 px. Encabezado oscuro `ink`, contenido sobre `ground`.
- **Sin sombras** (salvo `--focus-ring`); los objetos se separan con borde de 2 px `line`.
- **Íconos:** SVG en línea de trazo, `stroke="currentColor"`, 24–26 px. Sin emoji ni logotipo de WhatsApp.

## Voz y textos

- Tutea al cliente: "Hola, Carlos".
- Botones con verbo + objeto: "Registrar ingreso", "Avisar al cliente por WhatsApp". Nunca "OK" o "Enviar" a secas.
- Errores que dicen cómo corregir: "Revisa el WhatsApp: debe tener 10 dígitos, por ejemplo 300 123 4567."
- Tras una acción, un aviso (`dr-notice`) que dice qué pasó y el siguiente paso.
- Dinero `$380.000`, horas `10:42 a. m.`, fechas `2 nov, 10:42 a. m.` (es-CO, zona America/Bogota). Placas en mayúsculas: `KMT482`.
- Copia los textos del prototipo (`design/prototipo/prototipo.html`) en vez de inventarlos.

## Accesibilidad

- Botones y enlaces reales; nunca `div` con clic.
- `<label>` en cada campo; errores con `role="alert"`; avisos con `role="status"`.
- Botones de estado con `aria-pressed`; botones de solo ícono con `aria-label`.
- Contraste ≥ 4,5:1 (los tokens ya lo cumplen; no los mezcles fuera de su uso).

## Antes de dar por terminada una pantalla

- [ ] Compárala con su captura en `design/pantallas/` a 390 px de ancho.
- [ ] Ningún color, radio o tamaño literal en el código.
- [ ] Todos los controles cumplen los tamaños mínimos.
- [ ] Textos en español es-CO, iguales al prototipo.
- [ ] Funciona con teclado y el foco se ve.
