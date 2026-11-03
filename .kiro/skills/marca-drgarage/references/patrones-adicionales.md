# Patrones adicionales del prototipo

Pantallas y piezas que están en `design/prototipo/prototipo.html` pero aún no tienen ficha en `components/`. Usan los mismos tokens.

## Keypad — código del taller

- 4 puntos de 20 px (borde 3px `ink`; lleno = dígito escrito), gap 16px.
- Teclado 3×4 (1–9, vacío, 0, borrar), ancho máx. 340px, gap 10px.
- Teclas: alto mínimo 72px, `radius-lg`, fondo `surface`, borde 2px `line`, número 30px peso 800. Borrar: sin borde ni fondo, ícono chevron con `aria-label="Borrar"`.
- Al completar 4 dígitos valida sola. Error en `reject` con `role="alert"`; se limpian los puntos.
- Texto de ayuda en `muted`: "Este celular recordará el código hasta que cierres sesión."

## ConfirmPanel — confirmar "Entregar"

- Reemplaza en el mismo lugar al botón "Entregar al cliente" (`dr-btn--primary` con ícono check).
- Panel `surface` con borde 2px `ink`, `radius-lg`: pregunta en 18px/800 ("¿Jorge ya recogió el auto?"), consecuencia en `muted`, y dos botones en `dr-status-grid`: "Sí, entregar" (`--primary`) y "Cancelar" (`--outline`).
- Nunca usar diálogos del navegador.

## EmptyState — lista vacía

- Panel `surface` centrado: título 19px/800 "No hay autos en el taller" y guía en `muted` "Cuando llegue uno, toca "Ingresar auto"."

## Chip "Anulada"

- `dr-chip` con fondo `line` y texto `ink`. Para cotizaciones anuladas por una nueva cotización o por la entrega.

## Vista del cliente — estados finales

- **Listo:** panel "Dónde recogerlo" (eyebrow `muted`, dirección en 700, horario en `muted`) debajo del avance.
- **Entregado:** mismo panel de estado con `type-status` "Entregado", fecha de entrega y agradecimiento; sin pasos; nota al pie "Este enlace estará activo hasta el {fecha}".
- **Enlace vencido o inexistente:** título 28px/800 "Este enlace ya no está activo", explicación de los 30 días y panel "Dónde recogerlo" con los datos del taller.

## Cerrar sesión

- `dr-btn--link` al final de la lista del taller.

## Portada `/conoce` — acentos en amarillo de placa

Única pantalla, además de la placa, "Ingresar auto" y el foco, donde se usa `plate`. Siempre con texto `plate-ink` (contraste 11,5:1, ≥ 4,5:1).

- Botón principal "Ver el taller de ejemplo" en el encabezado, bajo el subtítulo: `dr-btn--accent`. Debajo, enlace secundario "Ver lo que ve tu cliente" (`dr-btn--link` en `on-ink`). El botón del final de la página sigue en `--primary`.
- Franja de 6 px en `plate` bajo el encabezado (`dr-header--franja`).
- Círculo de los íconos de beneficios y números de los pasos de "Así funciona": fondo `plate`, texto o ícono `plate-ink`, 44 px.
- El resto de los colores de la portada solo aparecen en piezas reales de la app con su significado (placa, chips de estado y de cotización).
