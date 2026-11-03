# Decisiones Técnicas — drGarage

## Stack

- **Framework**: Next.js con App Router, TypeScript
- **Estilos**: CSS global con las clases dr-. Sin Tailwind. Sin carpeta `src/`.
- **Design system**: clases `dr-` definidas en `styles/tokens.css` y `styles/components.css`, importadas en `app/layout.tsx`.
- **Fuente**: Archivo de `next/font/google`.
- **Base de datos**: Supabase (PostgreSQL en la nube). Storage para fotos más adelante.
- **Despliegue**: Vercel, plan Hobby, subdominio `.vercel.app`.

## Acceso a datos

- Tablas con RLS activado, sin políticas para el rol anónimo.
- **El navegador nunca lee ni escribe tablas directamente.**
- Todo acceso a datos ocurre en el servidor de Next.js:
  - Server Components
  - Server Actions
  - Route Handlers
- Se usa la clave de servicio (`service_role`) que solo existe en variables de entorno del servidor (**nunca** con prefijo `NEXT_PUBLIC_`).
- Los archivos de `lib/supabase/` se importan solo desde el servidor (paquete `server-only`), para que la clave de servicio nunca llegue al navegador.

## Vista pública del cliente

- Busca el auto por su token en el servidor.
- Devuelve **solo** los campos permitidos: datos del auto, estado, cotizaciones. **No** incluye el WhatsApp.
- Actualización "en tiempo real": sondeo cada 15-20 segundos (no usar Supabase Realtime en esta etapa).

## Supabase en producción

- Las tablas tienen RLS.
- El esquema se gestiona en `supabase/migrations/`.
- Acceso solo con clave de servicio desde el servidor de Next.js.

## Desarrollo local

- Windows 11, PowerShell, Node.js 24.
- Gestor de paquetes: npm.
- Variables secretas solo en `.env.local` (nunca se comprometen al control de versiones).

## Pruebas

- Lógica de negocio pura (estados, normalización de WhatsApp, armado de mensajes) se prueba con **Vitest**.
- Las reglas de negocio viven en `lib/dominio/`.

## Reglas de AGENTS.md

- Fechas en UTC en la base de datos; mostradas en `America/Bogota` (locale `es-CO`).
- Token público aleatorio de al menos 128 bits.
- La vista pública no expone el WhatsApp del cliente.
- Variables secretas solo en `.env.local`.