# Design Document

## Feature: seguimiento-por-enlace

## Overview

Este feature permite a los clientes seguir el estado de su auto desde un enlace público sin necesidad de llamar al taller. El sistema provee:

- **Vista del taller**: Panel donde los mecánicos registran ingresos, cambian estados y notifican al cliente por WhatsApp.
- **Vista del cliente**: Página pública `/auto/{token}` donde el cliente consulta el avance sin registro.

El flujo principal:
1. El mecánico registra un auto (nombre, WhatsApp, placa, modelo) → se genera un token público
2. El cliente recibe un enlace para seguir su auto
3. El mecánico cambia el estado → el cliente ve la actualización en tiempo real

---

## Architecture

### Stack Tecnológico

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: CSS global con clases `dr-` (design system drGarage)
- **Base de datos**: Supabase (PostgreSQL)
- **Despliegue**: Vercel, plan Hobby

### Patrón de Acceso a Datos

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Navegador  │────▶│  Next.js Server │────▶│   Supabase   │
│  (cliente)  │◀────│  (API + Actions)│◀────│  (PostgreSQL)│
└─────────────┘     └─────────────────┘     └──────────────┘
```

- **El navegador nunca lee ni escribe tablas directamente.**
- Todo acceso ocurre desde el servidor de Next.js:
  - Server Components para renderizado inicial
  - Server Actions para mutaciones
  - Route Handlers para API si es necesario
- Se usa la clave de servicio (`service_role`) que solo existe en variables de entorno del servidor (**nunca** con prefijo `NEXT_PUBLIC_`)
- Los archivos de `lib/supabase/` se importan solo desde el servidor (paquete `server-only`)

### Actualización en Tiempo Real

- **No se usa Supabase Realtime** en esta etapa
- Sondeo (polling) cada 15-20 segundos desde la vista del cliente
- Un componente de cliente llama a `router.refresh()` cada 15 a 20 segundos para que el Server Component vuelva a consultar por token; el sondeo se pausa si la pestaña está oculta

---

## Supabase Schema

### Tabla: autos

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Identificador interno |
| `token_publico` | text | UNIQUE, not null | Token público ≥128 bits (generado en el servidor) |
| `nombre_cliente` | text | not null | Nombre tal como se ingresa; el primer nombre se deriva en `lib/dominio/mensajes.ts` |
| `whatsapp` | text | not null | Número de 10 dígitos (sin prefijo país) |
| `placa` | text | not null | Placa en mayúsculas |
| `modelo` | text | not null | Modelo/marca del vehículo |
| `problema` | text | nullable | Descripción del problema reportado |
| `estado` | text | not null, default 'recibido', CHECK en (recibido, proceso, cotizacion, listo) | Estado actual |
| `creado_en` | timestamptz | not null, default now() | Fecha de registro |
| `actualizado_en` | timestamptz | not null, default now() | Fecha de última actualización |

### Tabla: eventos

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Identificador |
| `auto_id` | uuid | FK → autos.id, not null | Auto relacionado |
| `tipo` | text | not null | Tipo: cambio_estado, aviso_enviado |
| `descripcion` | text | not null | Descripción legible del evento |
| `creado_en` | timestamptz | not null, default now() | Fecha del evento |

### Seguridad (RLS)

- **RLS activado** en ambas tablas
- **Sin políticas para el rol anónimo** — el acceso siempre es a través del servidor
- Solo la clave de servicio (service_role) puede leer y escribir

### Índices

- `autos.token_publico` — para búsquedas por token público; queda indexado por su restricción UNIQUE (sin índice adicional)
- `eventos.auto_id` — para obtener historial de un auto

---

## App Routes

### Ruta: `/` — Vista del Taller

**Propósito**: Panel principal donde los mecánicos gestionan los autos.

| Recurso | Método | Descripción |
|---------|--------|-------------|
| `/` | GET | Lista de autos |
| `/` | POST (Server Action) | Registra nuevo auto |
| Server Action `cambiarEstado` | (sin ruta API) | Cambia el estado del auto |

**Componentes utilizados**:
- `AppHeader` — encabezado "Taller Don Ramiro"
- `CarCard` — tarjeta con datos del auto y botón de estado
- `StatusButton` — botón grande de 4 estados
- `Button` — botón "Ingresar auto"
- `Field` — campos del formulario
- `IconButton` — botón de WhatsApp
- `Notice` — aviso de resultado de acción

### Ruta: `/auto/[token]` — Vista del Cliente

**Propósito**: Página pública donde el cliente sigue el avance.

| Recurso | Método | Descripción |
|---------|--------|-------------|
| `/auto/[token]` | GET | Datos del auto (solo campos permitidos) |

**Datos devueltos** (nunca incluye WhatsApp):
- `primerNombre` (para el saludo), `placa`, `modelo`, `estado`, `actualizado_en`

**Componentes utilizados**:
- `AppHeader` — encabezado con nombre del taller
- `Plate` — insignia de placa
- `StatusButton` — estado actual (solo lectura)
- `Stepper` — progreso en 4 pasos
- `Notice` — avisos al cliente

---

## Components and Interfaces

### Componentes del Taller

#### Formulario de Ingreso

```
Campo: Nombre del cliente
  - Label: "¿A nombre de quién queda el auto?"
  - Placeholder: "Tu nombre"
  - Validación: obligatorio

Campo: WhatsApp
  - Label: "WhatsApp"
  - Placeholder: "300 123 4567"
  - Validación: 10 dígitos, muestra formato con espacio

Campo: Placa
  - Label: "Placa"
  - Placeholder: "ABC123"
  - Validación: mayúsculas, obligatoria

Campo: Modelo
  - Label: "Modelo del auto"
  - Placeholder: "Toyota Corolla"
  - Validación: obligatoria

Campo: Problema (opcional)
  - Label: "¿Qué le pasa?"
  - Placeholder: "Frenos, ruido, etc."
```

#### Botones de Estado

4 botones grandes en el orden requerido:
1. **Recibido** — color status-recibido
2. **En proceso** — color status-proceso
3. **Cotización enviada** — color status-cotizacion
4. **Listo** — color status-listo

Cada botón toca el estado correspondiente. El estado actual se muestra marcado.

#### Botón de WhatsApp

- Ícono de WhatsApp (verde whatsapp)
- Abre `https://wa.me/57{whatsapp}?text=` con mensaje armado
- El mensaje incluye: nombre del cliente, modelo, placa, estado actual, enlace

### Componentes del Cliente

#### Stepper de Progreso

4 pasos con estados:
1. Recibido
2. En proceso
3. Cotización
4. Listo

El paso actual se muestra activo; los anteriores, completados. Sin emoji: los íconos son SVG de trazo, como indica la skill `marca-drgarage`.

#### Información Mostrada

- **Placa**: insignia grande (clase `dr-plate`)
- **Modelo**: texto secundario
- **Estado**: nombre del estado actual
- **Última actualización**: "Actualizado hace X minutos" o fecha/hora

---

## Data Models

### Tipo: Auto (dominio)

```typescript
interface Auto {
  id: string;
  tokenPublico: string;
  nombreCliente: string;
  whatsapp: string;        // Solo para uso interno del taller
  placa: string;
  modelo: string;
  problema?: string;
  estado: Estado;
  creadoEn: Date;
  actualizadoEn: Date;
}
```

### Tipo: Estado

```typescript
type Estado = 'recibido' | 'proceso' | 'cotizacion' | 'listo';
```

### Tipo: Evento

```typescript
interface Evento {
  id: string;
  autoId: string;
  tipo: 'cambio_estado' | 'aviso_enviado';
  descripcion: string;
  creadoEn: Date;
}
```

### Tipo: AutoPúblico (vista del cliente)

```typescript
interface AutoPublico {
  primerNombre: string;
  placa: string;
  modelo: string;
  estado: Estado;
  actualizadoEn: Date;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Esta sección analiza los criterios de aceptación para determinar cuáles son testeables con property-based testing.

### Prework: Análisis de Testabilidad

**Requirement 1.1**: WHEN el mecánico completa el formulario con nombre, WhatsApp de 10 dígitos, placa y modelo, THE Sistema SHALL crear el auto en estado "Recibido" con un enlace público único, guardar la placa en mayúsculas y abrir la ficha del auto.
- Thoughts: La creación de auto es una operación de base de datos. La lógica de normalización (placa mayúsculas, validación de WhatsApp) es testeable como propiedad.
- Classification: EXAMPLE (UI + DB) + PROPERTY (normalización)

**Requirement 1.2**: WHEN el mecánico intenta guardar con un campo obligatorio vacío o con un WhatsApp que no tenga 10 dígitos, THE Sistema SHALL mostrar un error que indique cómo corregirlo y conservar los datos ingresados.
- Thoughts: La validación de entrada es testeable. Generación de errores específicos para entradas inválidas.
- Classification: PROPERTY (validación)

**Requirement 2.1**: WHEN el mecánico toca un estado diferente al actual en la ficha del auto, THE Sistema SHALL guardar el nuevo estado, crear un evento con la fecha y hora, y mostrar un aviso para notificar al cliente.
- Thoughts: Las transiciones de estado son una máquina de estados con reglas definidas. Es testeable como propiedad.
- Classification: PROPERTY (transiciones de estado)

**Requirement 3.1**: WHEN el mecánico toca el botón de WhatsApp en la ficha del auto, THE Sistema SHALL abrir https://wa.me/57{whatsapp}?text= con un mensaje que incluya el primer nombre del cliente, modelo, placa, estado actual y el enlace del auto.
- Thoughts: El armado del mensaje es una función pura. Es testeable con round-trip.
- Classification: PROPERTY (armado de mensaje)

**Requirement 4.1**: WHEN el cliente abre un enlace válido /auto/{token}, THE Sistema SHALL mostrar la placa, el modelo, el estado actual, el avance en 4 pasos y la hora de última actualización, sin necesidad de registro.
- Thoughts: La consulta por token es una operación de base de datos. La transformación a AutoPublico (excluyendo WhatsApp) es testeable.
- Classification: PROPERTY (transformación de datos)

**Requirement 4.2**: WHEN el cliente visualiza la página, THE Sistema SHALL NOT mostrar el número de WhatsApp ni datos de otros autos.
- Thoughts: La propiedad de exclusión de datos sensibles debe mantenerse para cualquier auto.
- Classification: PROPERTY (invariante de seguridad)

**Requirement 4.3**: WHEN el cliente abre un enlace con un token que no existe, THE Sistema SHALL mostrar el mensaje "Este enlace ya no está activo".
- Thoughts: Este es un caso específico, no una propiedad universal.
- Classification: EXAMPLE

**Requirement 5.1**: WHEN la página del cliente está abierta y el mecánico cambia el estado del auto, THE Sistema SHALL mostrar el nuevo estado en un máximo de 30 segundos sin recargar.
- Thoughts: El intervalo de sondeo es una constante. El comportamiento de actualización es de la UI.
- Classification: SMOKE (configuración)

**Requirement 6.1** y **6.2**: Manejo de errores de conexión.
- Thoughts: Estos son casos de error específicos.
- Classification: EXAMPLE

### Resumen de propiedades identificables

Después de analizar, las propiedades testeables son:

1. **Normalización de placa**: Toda placa se guarda en mayúsculas
2. **Validación de WhatsApp**: Solo se aceptan exactamente 10 dígitos
3. **Transformación a vista pública**: Auto → AutoPublico excluye WhatsApp siempre
4. **Armado de mensaje WhatsApp**: El mensaje contiene todos los campos requeridos
5. **Transiciones de estado**: Solo permite estados válidos del diagrama

Estas propiedades son complementarias y no redundantes. Cada una prueba un aspecto diferente del sistema.

---

### Property 1: Normalización de placa

*Para cualquier* cadena de placa ingresada, el sistema SHALL convertirla a mayúsculas antes de guardarla.

**Validates: Requirements 1.1**

---

### Property 2: Validación de WhatsApp

*Para cualquier* cadena ingresada como WhatsApp, el sistema SHALL aceptarla solo si, tras quitar espacios y guiones, contiene exactamente 10 dígitos.

**Validates: Requirements 1.2**

---

### Property 3: Exclusión de WhatsApp en vista pública

*Para cualquier* auto en la base de datos, la consulta pública por token SHALL nunca incluir el campo WhatsApp en el resultado.

**Validates: Requirements 4.2**

---

### Property 4: Armado del mensaje de WhatsApp

*Para cualquier* auto con datos válidos, el mensaje generado SHALL incluir: primer nombre del cliente, modelo, placa, estado actual y enlace público del auto.

**Validates: Requirements 3.1**

---

### Property 5: Invariante de token único

*Para cualquier* auto creado, el token público SHALL ser único en la base de datos.

**Validates: Requirements 1.1**

---

## Error Handling

### Errores del Servidor

| Escenario | Respuesta | Acción del Cliente |
|-----------|-----------|-------------------|
| Token no existe | 404 + mensaje "Este enlace ya no está activo" | Mostrar mensaje |
| Error de conexión a Supabase | 500 + mensaje genérico | Reintentar |
| Validación fallida | 400 + detalles del error | Mostrar cómo corregir |

### Errores del Cliente (navegador)

| Escenario | Respuesta |
|-----------|-----------|
| Error de red al guardar | Mostrar un `Notice` de error (`role="alert"`) con botón Reintentar; nunca marcar como guardado |
| Timeout de sondeo | Silencioso, reintentar en siguiente intervalo |

### Mensajes de Error (voz del producto)

- WhatsApp inválido: "Revisa el WhatsApp: debe tener 10 dígitos, por ejemplo 300 123 4567."
- Campo obligatorio: "Completa este campo"
- Token no existe: "Este enlace ya no está activo"
- Error de conexión: "No se pudo guardar. Revisa tu conexión e intenta de nuevo."

---

## Testing Strategy

### Unit Tests (Vitest)

**ubicación**: `lib/dominio/*.test.ts`

#### Testeables con Example/Unit:

1. **Validación de formulario**
   - Input: `whatsapp = "3001234567"` → válido
   - Input: `whatsapp = "300 123 4567"` → válido (se quitan espacios y guiones antes de contar)
   - Input: `whatsapp = "300123456"` → inválido (9 dígitos)
   - Input: `whatsapp = "30012345678"` → inválido (11 dígitos)
   - Input: `whatsapp = "abc"` → inválido (no numérico)

2. **Mensaje de error de token no existe**
   - Verificar que el mensaje sea exactamente "Este enlace ya no está activo"

3. **Armado de la URL de WhatsApp**
   - El texto va codificado con `encodeURIComponent` (tildes, ñ, `&` y espacios) y el número lleva el prefijo 57

#### Testeables con Property (Vitest + fast-check):

1. **Normalización de placa**
   - Generar strings aleatorios, verificar que `.toUpperCase()` es el resultado

2. **Validación de WhatsApp**
   - Generar strings, verificar que solo los de 10 dígitos pasan

3. **Transformación Auto → AutoPublico**
   - Generar Auto aleatorio, verificar que el resultado no tiene WhatsApp

### Integración

- Tests de Server Actions contra Supabase local o mockeado
- Tests E2E de los flujos principales con Playwright/Cypress (si hay tiempo)

### Fuera de Alcance para Tests

- UI rendering (usa snapshot tests si es necesario)
- Sondeo de actualizaciones (smoke test del intervalo)
- Configuración de Supabase (manual)

---

## Consideraciones Adicionales

### Generación de Token Público

- Usar `crypto.randomBytes(32)` de Node (256 bits) codificado en base64url; nunca `crypto.randomUUID()`, que solo aporta 122 bits
- El token se genera en el servidor antes de insertar el auto

### URL pública del enlace

- El enlace del mensaje de WhatsApp usa la variable `NEXT_PUBLIC_SITE_URL` (valor no secreto): `http://localhost:3000` en local y el dominio `.vercel.app` en Vercel.

### Fechas y Zonas Horarias

- Todas las fechas se almacenan en UTC en Supabase
- Al mostrar, convertir a `America/Bogota` con locale `es-CO`
- Formato: `2 nov, 10:42 a. m.`

### Seguridad

- El token público NO es guessable (128 bits de entropía)
- La vista pública NUNCA devuelve el WhatsApp
- RLS activo pero sin políticas para anónimo (acceso solo desde servidor)

### Flujo de Trabajo

1. Mecánico ingresa auto → Server Action crea en Supabase
2. Servidor devuelve token público
3. Mecánico toca WhatsApp → se abre wa.me con mensaje
4. Cliente abre enlace → Server Component consulta por token
5. Cliente ve actualización → polling cada 20 segundos

---

*Documento generado para el feature seguimiento-por-enlace de drGarage.*