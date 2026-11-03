# drGarage · Feature 01 — Seguimiento del auto por enlace

> Entrada para la spec de Kiro de este feature.

## 1. Problema

Los clientes del Taller Don Ramiro, el taller que usa drGarage, llaman constantemente para preguntar si su auto está listo. Cada llamada interrumpe a un mecánico que tiene las manos sucias, y el cliente no tiene otra forma de saber en qué va su vehículo.

**Usuario principal:** el mecánico (4 en el taller), que usa el celular en el taller. **Usuario secundario:** el cliente, que recibe el enlace por WhatsApp.

**Resultado esperado:** el cliente consulta el estado por sí mismo desde un enlace, sin llamar, sin registrarse y sin instalar nada.

## 2. Diseño de la solución

Flujo:

1. El mecánico registra el ingreso del auto: nombre y WhatsApp del cliente, placa, modelo y problema reportado. El sistema crea el auto en estado **Recibido** y le asigna un enlace único.
2. En la ficha del auto, el mecánico cambia el estado con 4 botones grandes: **Recibido, En proceso, Cotización enviada, Listo**.
3. Con un botón verde, el mecánico abre WhatsApp (`wa.me`) con un mensaje prellenado que incluye el enlace del auto y su estado actual.
4. El cliente abre el enlace y ve el avance de su auto, que se actualiza solo.

Pantallas de referencia en `design/pantallas/`: 03 a 07 (taller), 15 (cliente, sin el recuadro "Dónde recogerlo") y 17 (enlace no activo). Comportamiento completo en `design/prototipo/prototipo.html` (código 1234). Las capturas incluyen piezas de otros features (cotizaciones, código de acceso, entrega): ignóralas en este feature.

- Taller: lista de autos, formulario de ingreso, ficha del auto con estados y botón de WhatsApp.
- Cliente: página pública `/auto/{token}` con saludo, placa, modelo, estado actual en grande, avance en 4 pasos y hora de última actualización.

Reglas de diseño: las de la skill `marca-drgarage` (tokens, botones ≥ 64 px, estados ≥ 88 px, español es-CO).

Datos mínimos:

```
autos: id, token_publico, nombre_cliente, whatsapp, placa, modelo, problema,
       estado, creado_en, actualizado_en
eventos: id, auto_id, texto, creado_en
```

Stack: Next.js (App Router, TypeScript) + Supabase (Postgres), con acceso a datos solo desde el servidor, en Vercel.

La página del cliente consulta su estado cada 15 a 20 segundos.

## 3. Criterios de aceptación

1. **Registro.** DADO el formulario de ingreso, CUANDO el mecánico guarda nombre, WhatsApp de 10 dígitos, placa y modelo, ENTONCES el auto queda en estado Recibido con un enlace único, la placa se guarda en mayúsculas y se abre su ficha. SI falta un campo obligatorio o el WhatsApp no tiene 10 dígitos, se muestra un error que dice cómo corregirlo y se conserva lo escrito.
2. **Cambio de estado.** DADA la ficha de un auto, CUANDO el mecánico toca un estado distinto al actual, ENTONCES el estado se guarda, queda un evento con fecha y hora en la actividad y aparece un aviso para avisar al cliente.
3. **Aviso por WhatsApp.** DADA la ficha de un auto, CUANDO el mecánico toca el botón verde, ENTONCES se abre `https://wa.me/57XXXXXXXXXX?text=...` con el número del cliente y un mensaje que incluye su primer nombre, modelo, placa, estado actual y el enlace del auto.
4. **Vista del cliente.** DADO un enlace válido, CUANDO el cliente lo abre en el celular, ENTONCES ve placa, modelo, estado actual, avance en 4 pasos y hora de actualización, sin registrarse y sin ver el WhatsApp ni datos de otros autos. Un token inexistente muestra "Este enlace ya no está activo".
5. **Tiempo real.** DADA la página del cliente abierta, CUANDO el mecánico cambia el estado, ENTONCES la página muestra el nuevo estado en 30 segundos o menos sin recargar.

## 4. Fuera de alcance de este feature

- Cotizaciones y su aprobación o rechazo (siguiente spec).
- Código de acceso del taller, entrega y vencimiento del enlace.
- Fotos.

> Nota para el demo: sin código de acceso, la vista del taller queda abierta a quien tenga la URL. Usa solo datos de ejemplo.
