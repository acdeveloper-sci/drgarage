# StatusButton

Los cuatro estados del auto como botones de `status-button-height` (88px) en una cuadrícula 2×2 (`dr-status-grid`), siempre en este orden: Recibido, En proceso, Cotización enviada, Listo.

El activo lleva `aria-pressed="true"` y se rellena con su color de estado; los demás quedan blancos con borde `line`. Un toque cambia el estado y muestra un `Notice` que invita a avisar al cliente. Tocar el estado activo no hace nada.
