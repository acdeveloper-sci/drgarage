# Implementation Plan: Seguimiento por enlace

## Overview

Este plan implementa el feature de seguimiento por enlace para drGarage. Las tareas se organizan en fases: preparación del proyecto, infraestructura de base de datos, lógica de dominio, cliente Supabase, vistas (taller y cliente), pruebas y verificación visual. Las pruebas de la lógica de dominio son obligatorias: el feature no se da por terminado hasta que `npm test` pase.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1", "0.2", "1.1", "2.1", "2.2", "2.3", "2.4", "2.7"] },
    { "id": 1, "tasks": ["1.2", "2.5", "2.6", "3.1", "4.1", "6.1", "6.2", "6.5"] },
    { "id": 2, "tasks": ["1.3", "6.3", "6.4"] },
    { "id": 3, "tasks": ["1.4"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "5.1"] },
    { "id": 6, "tasks": ["4.5", "5.2"] },
    { "id": 7, "tasks": ["7.1", "7.2"] },
    { "id": 8, "tasks": ["7.3"] }
  ]
}
```

## Tasks

### 0. Preparación del Proyecto

- [x] 0.1 Instalar dependencias y configurar Vitest
  - **Criterio(s)**: Soporte de todos los requisitos
  - Instalar con npm: `@supabase/supabase-js` y `server-only` (dependencias); `vitest` y `fast-check` (desarrollo). Crear `vitest.config.ts` con el alias `@/*` y agregar el script `"test": "vitest run"` en `package.json`.

- [x] 0.2 Layout raíz, variables de entorno y limpieza de la plantilla
  - **Criterio(s)**: Soporte de todos los requisitos
  - En `app/layout.tsx`: importar `styles/tokens.css` y `styles/components.css`, cargar la fuente Archivo con `next/font/google` y usar `<html lang="es">`. Retirar `app/globals.css` y `app/page.module.css` de la plantilla si ya no se usan. Crear `.env.example` con `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SITE_URL` (sin valores) y confirmar que `.env.local` está en `.gitignore`.

### 1. Infraestructura de Base de Datos

- [x] 1.1 Crear migración para tabla `autos`
  - **Criterio(s)**: Requisito 1.1
  - Crear archivo `supabase/migrations/001_create_autos.sql` con columnas: id (uuid PK), token_publico (text UNIQUE NOT NULL), nombre_cliente (text NOT NULL), whatsapp (text NOT NULL), placa (text NOT NULL), modelo (text NOT NULL), problema (text nullable), estado (text NOT NULL default 'recibido'), creado_en (timestamptz), actualizado_en (timestamptz). CHECK constraint para estados válidos.

- [x] 1.2 Crear migración para tabla `eventos`
  - **Criterio(s)**: Requisito 2.1
  - Crear archivo `supabase/migrations/002_create_eventos.sql` con columnas: id (uuid PK), auto_id (uuid FK → autos.id), tipo (text NOT NULL), descripcion (text NOT NULL), creado_en (timestamptz). Foreign key con restricción de integridad referencial.

- [x] 1.3 Configurar RLS y seguridad
  - **Criterio(s)**: Requisito 4.2
  - Activar RLS en ambas tablas. Sin políticas para rol anónimo (acceso solo desde servidor). Crear índice en `eventos.auto_id`; `autos.token_publico` queda indexado por su restricción UNIQUE.

- [x] 1.4 Aplicar las migraciones en Supabase (paso manual de la persona)
  - **Criterio(s)**: Requisitos 1.1, 2.1, 4.2
  - La persona ejecuta en orden los archivos de `supabase/migrations/` en el SQL Editor del proyecto Supabase y confirma que las tablas `autos` y `eventos` existen con RLS activado. El agente pide este paso, la marca como bloqueada `[!]` mientras espera la confirmación y no continúa con la sección 3 sin ella.

### 2. Lógica de Dominio

- [x] 2.1 Definir tipos TypeScript para el dominio
  - **Criterio(s)**: Requisitos 1.1, 4.1
  - Crear archivos de tipos en `lib/dominio/`. Tipo `Estado` como union type. Tipo `Auto`, `AutoPublico` (solo primerNombre, placa, modelo, estado y actualizadoEn; sin WhatsApp), `Evento` con tipos: 'cambio_estado' | 'aviso_enviado'.

- [x] 2.2 Implementar normalización de placa
  - **Criterio(s)**: Requisito 1.1, Property 1
  - Crear función `normalizarPlaca` en `lib/dominio/normalizacion.ts` que quite espacios y guiones y convierta la placa a mayúsculas ("KMT 482" y "KMT-482" → "KMT482").

- [x] 2.3 Implementar validación de WhatsApp
  - **Criterio(s)**: Requisito 1.2, Property 2
  - Crear función `validarWhatsApp` en `lib/dominio/normalizacion.ts` que quite espacios y guiones y acepte solo si quedan exactamente 10 dígitos (por ejemplo, "300 123 4567" es válido). Devuelve el número normalizado de 10 dígitos o el error.

- [x] 2.4 Implementar generación de token público
  - **Criterio(s)**: Requisito 1.1, Property 5
  - Crear función `generarTokenPublico` en `lib/dominio/token.ts` usando crypto.randomBytes(32) para 256 bits, codificado en base64url.

- [x] 2.5 Implementar armado de mensaje WhatsApp
  - **Criterio(s)**: Requisito 3.1, Property 4
  - Crear función `armarMensajeWhatsApp` en `lib/dominio/mensajes.ts` que genere el mensaje con primer nombre, modelo, placa, estado y enlace, y devuelva la URL `https://wa.me/57{whatsapp}?text=...`. Texto codificado con encodeURIComponent. El enlace se arma con `NEXT_PUBLIC_SITE_URL` + `/auto/{token}`.

- [x] 2.6 Implementar transformación Auto → AutoPublico
  - **Criterio(s)**: Requisito 4.2, Property 3
  - Crear función `aAutoPublico` en `lib/dominio/transformaciones.ts` que excluya WhatsApp y derive el primer nombre.

- [x] 2.7 Implementar formato de fechas
  - **Criterio(s)**: Requisitos 2.1, 4.1
  - Crear función `formatearFecha` en `lib/dominio/fechas.ts` que reciba una fecha UTC y la muestre en `America/Bogota` con locale `es-CO`, con el formato `2 nov, 10:42 a. m.`.

### 3. Cliente Supabase

- [x] 3.1 Crear cliente Supabase con clave de servicio
  - **Criterio(s)**: Requisito 1.1
  - Crear cliente en `lib/supabase/cliente.ts` usando paquete `server-only`. NO usa variables con prefijo NEXT_PUBLIC_.

- [x] 3.2 Implementar función para insertar auto
  - **Criterio(s)**: Requisito 1.1
  - Crear función `insertarAuto` en `lib/supabase/consultas.ts`. Genera token público, inserta con estado 'recibido', devuelve auto insertado.

- [x] 3.3 Implementar función para obtener auto por token
  - **Criterio(s)**: Requisito 4.1
  - Crear función `obtenerAutoPorToken` en `lib/supabase/consultas.ts`. Devuelve null si no existe.

- [x] 3.4 Implementar función para actualizar estado
  - **Criterio(s)**: Requisito 2.1
  - Crear función `actualizarEstado` en `lib/supabase/consultas.ts`. Actualiza campo estado y actualizado_en automáticamente.

- [x] 3.5 Implementar función para insertar evento
  - **Criterio(s)**: Requisito 2.1
  - Crear función `insertarEvento` en `lib/supabase/consultas.ts`. Registra evento con tipo y descripción.

- [x] 3.6 Implementar función para listar autos
  - **Criterio(s)**: Requisito 1.1
  - Crear función `listarAutos` en `lib/supabase/consultas.ts`. Devuelve los autos ordenados por `actualizado_en`, el más reciente primero.

- [x] 3.7 Implementar función para obtener auto por id
  - **Criterio(s)**: Requisitos 2.1, 3.1
  - Crear función `obtenerAutoPorId` en `lib/supabase/consultas.ts`. Devuelve null si no existe. Se usa solo en la vista del taller.

- [x] 3.8 Implementar función para listar eventos de un auto
  - **Criterio(s)**: Requisito 2.1
  - Crear función `listarEventos` en `lib/supabase/consultas.ts`. Devuelve los eventos del auto, el más reciente primero.

### 4. Vista del Taller

- [ ] 4.1 Crear estructura de rutas y layout del taller
  - **Criterio(s)**: Requisito 1.1
  - Crear directorio `app/(taller)/`. Crear layout.tsx con AppHeader "Taller Don Ramiro". Aplicar estilos dr-. Título de la pestaña del navegador: "drGarage".

- [ ] 4.2 Crear página principal con lista de autos
  - **Criterio(s)**: Requisito 1.1
  - Crear `app/(taller)/page.tsx` como Server Component que usa `listarAutos` y muestra CarCard para cada uno (placa, estado, modelo, cliente y hora con `formatearFecha`). Botón "Ingresar auto" visible. Eliminar la página de plantilla `app/page.tsx`: dos páginas que resuelven a `/` hacen fallar a Next.js.

- [ ] 4.3 Crear formulario de ingreso de auto
  - **Criterio(s)**: Requisitos 1.1, 1.2
  - Crear formulario con campos: nombre, WhatsApp, placa, modelo, problema (opcional). Server Action para procesar. Validación: campos obligatorios, WhatsApp 10 dígitos. Error muestra mensaje y conserva datos. Al guardar, abre la ficha del auto.

- [ ] 4.4 Crear ficha del auto con botones de estado
  - **Criterio(s)**: Requisitos 2.1, 3.1
  - Crear la página de detalle en `app/(taller)/autos/[id]/page.tsx` (con `autos`, no `auto`: `/auto/[token]` ya es la ruta pública, y dos segmentos dinámicos distintos en la misma ruta hacen fallar a Next.js). Muestra los datos del cliente y el problema, StatusButton para los 4 estados, el botón verde de WhatsApp que abre `wa.me` con `armarMensajeWhatsApp`, y la actividad del auto (eventos con fecha y hora). Server Action `cambiarEstado` que actualiza el estado, crea el evento automáticamente y muestra un Notice para avisar al cliente. Las tarjetas de la lista (4.2) enlazan a esta página.

- [ ] 4.5 Manejo de errores de conexión al guardar
  - **Criterio(s)**: Requisitos 6.1, 6.2
  - En el formulario de ingreso y en el cambio de estado: si la Server Action falla por error de red, mostrar un Notice de error (`role="alert"`) con "No se pudo guardar. Revisa tu conexión e intenta de nuevo." y un botón Reintentar. No marcar la operación como completada ni cambiar el estado mostrado hasta que el servidor confirme el guardado. Conservar lo escrito en el formulario.

### 5. Vista del Cliente

- [ ] 5.1 Crear página pública /auto/[token]
  - **Criterio(s)**: Requisitos 4.1, 4.2, 4.3
  - Crear `app/auto/[token]/page.tsx` como Server Component. Muestra "Este enlace ya no está activo" si token no existe. Muestra saludo con el primer nombre, placa (dr-plate), modelo, estado, stepper de progreso y hora de última actualización (`formatearFecha`). Título de la pestaña: "Tu auto · Taller Don Ramiro". NUNCA muestra WhatsApp.

- [ ] 5.2 Implementar sondeo para actualizaciones
  - **Criterio(s)**: Requisito 5.1
  - Crear componente de cliente que actualice la página cada 15-20 segundos usando router.refresh(). Pausa si pestaña oculta (Page Visibility API).

### 6. Pruebas con Vitest

- [ ] 6.1 Tests de normalización de placa
  - **Criterio(s)**: Property 1
  - Escribir tests en `lib/dominio/normalizacion.test.ts` para la función normalizarPlaca, incluyendo placas con espacios y guiones ("KMT 482", "KMT-482").

- [ ] 6.2 Tests de validación de WhatsApp
  - **Criterio(s)**: Property 2
  - Escribir tests en `lib/dominio/normalizacion.test.ts` para la función validarWhatsApp, incluyendo 9 y 11 dígitos, texto no numérico y el caso con espacios ("300 123 4567").

- [ ] 6.3 Tests de armado de mensaje WhatsApp
  - **Criterio(s)**: Property 4
  - Escribir tests en `lib/dominio/mensajes.test.ts` para la función armarMensajeWhatsApp: el texto exacto de cada plantilla (Recibido, Listo y otro estado), incluyendo texto con tildes, ñ y `&`, y por propiedad que el mensaje incluye primer nombre, modelo, placa y enlace.

- [ ] 6.4 Tests de transformación Auto → AutoPublico
  - **Criterio(s)**: Property 3
  - Escribir tests en `lib/dominio/transformaciones.test.ts` para verificar exclusión de WhatsApp.

- [ ] 6.5 Tests de token público y de formato de fecha
  - **Criterio(s)**: Property 5, Requisito 4.1
  - Escribir tests en `lib/dominio/token.test.ts` (longitud mínima equivalente a 128 bits y tokens distintos entre llamadas) y en `lib/dominio/fechas.test.ts` (zona America/Bogota y formato es-CO).

### 7. Verificación Visual y Final

- [ ] 7.1 Verificar contra diseño del taller
  - **Criterio(s)**: Requisitos 1.1, 2.1, 3.1
  - Verificar que la implementación coincide con los mockups en `design/pantallas/03` a `07`. Vista a 390 px de ancho. Colores de estados correctos. Botón WhatsApp con ícono verde.

- [ ] 7.2 Verificar contra diseño del cliente
  - **Criterio(s)**: Requisitos 4.1, 4.2, 4.3
  - Verificar que la implementación coincide con los mockups en `design/pantallas/15` y `17`. Stepper muestra 4 pasos correctamente. Sin exposición de WhatsApp.

- [ ] 7.3 Verificación final de calidad
  - **Criterio(s)**: Todos los requisitos
  - Ejecutar `npm run lint`, `npm test` y `npm run build` sin errores. Confirmar que ninguna variable `NEXT_PUBLIC_` contiene claves secretas y que `.env.local` no está en el repositorio.

## Notes

- Las pruebas de la sección 6 son obligatorias: el agente las ejecuta (`npm test`) antes de marcar cada tarea como hecha.
- Las pruebas de dominio aseguran que las propiedades definidas en el design se cumplen.
- La tarea 1.4 la hace la persona: el agente la pide y espera confirmación.
- La verificación visual se hace contra los mockups del directorio design/; si el agente no puede abrir el navegador, pide a la persona que revise contra las capturas.
- El sondeo de 15-20 segundos cumple con el requisito de mostrar cambios en máximo 30 segundos.
