# Button

Botón grande de acción, de ancho completo y mínimo `button-height` (64px), para usar con las manos sucias.

Variantes (`dr-btn` + modificador):

| Variante | Uso |
| --- | --- |
| `--primary` | Acción que guarda: "Registrar ingreso", "Guardar cotización". |
| `--accent` | Entrada principal de la lista: "Ingresar auto". Solo una por pantalla. |
| `--whatsapp` | Enviar mensaje al cliente. Es un `<a href="https://wa.me/...">`, no un `<button>`. |
| `--outline` | Acción secundaria: "Cotización adicional". |
| `--approve` / `--reject` | Decisión del cliente sobre una cotización; siempre en pareja, Aprobar a la izquierda. |
| `--link` | Cancelar o acciones terciarias. |

El texto siempre es verbo + objeto. Los íconos van a la izquierda, 24–26px, `aria-hidden`.
