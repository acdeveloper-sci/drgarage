# Estructura del Proyecto — drGarage

Organización basada en las convenciones de Next.js App Router:

```
app/
├── (taller)/           # Vista del mecánico (protegida con código)
│   └── ...
├── auto/[token]/       # Vista pública del cliente
│   └── ...
└── layout.tsx          # Importa tokens.css y components.css

components/ui/          # Componentes del design system (clases dr-)
                        # Botones, tarjetas, campos, chips, etc.

lib/
├── dominio/            # Reglas de negocio puras y probadas con Vitest
│   ├── estados.ts      # Definición y transiciones de estados
│   ├── normalizacion.ts # Normalización de WhatsApp y placa
│   └── mensajes.ts     # Armado de mensajes para WhatsApp
└── supabase/           # Cliente y consultas a la base de datos
    ├── cliente.ts      # Cliente Supabase con clave de servicio
    └── consultas.ts    # Funciones para leer/escribir autos, cotizaciones

styles/
├── tokens.css          # Variables CSS del design system
└── components.css      # Clases utilitarias dr-

supabase/migrations/    # Esquema de la base de datos (versionado)

docs/                   # Documentación del producto
design/                 # Referencia visual: tokens, componentes, prototipos
                        # (no se modifican; son la fuente de verdad)
.kiro/
├── specs/              # Specs de cada feature
└── steering/           # Este archivo y demás reglas de proyecto
```

## Propósito de cada carpeta

| Carpeta | Propósito |
|---------|-----------|
| `app/(taller)/` | Ruta agrupada para la vista del taller (mecánicos). El grupo (taller) no agrega segmento a la URL: la vista principal queda en /. |
| `app/auto/[token]/` | Ruta dinámica para la vista pública del cliente. |
| `components/ui/` | Componentes reutilizables del design system drGarage (referencia: skill `marca-drgarage`). |
| `lib/dominio/` | Lógica de negocio pura, sin dependencias de framework ni base de datos. Probada con Vitest. |
| `lib/supabase/` | Abstracción sobre el acceso a datos. Solo se usa desde el servidor (Server Components/Actions). |
| `styles/` | Estilos globales del design system. |
| `supabase/migrations/` | Archivos SQL con el esquema de la base de datos. |
| `docs/` | Especificación, requisitos y decisiones del producto. |
| `design/` | Archivos de referencia visual (no tocar): tokens, componentes, prototipos, capturas. |

## Convenciones de nombres

- **Componentes**: PascalCase (`CarCard.tsx`, `StatusButton.tsx`).
- **Utilidades y funciones**: camelCase (`normalizarWhatsApp`, `armarMensaje`).
- **Archivos CSS**: kebab-case (`components.css`, `tokens.css`).
- **Rutas**: kebab-case con segmentos dinámicos (`auto/[token]/page.tsx`).
- **Migraciones**: prefijar con fecha o versión (`001_create_tables.sql`).