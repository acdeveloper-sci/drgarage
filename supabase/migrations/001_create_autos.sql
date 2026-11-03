-- Autos registrados en el taller. Fechas en UTC (timestamptz).
create table public.autos (
  id uuid primary key default gen_random_uuid(),
  token_publico text not null unique,
  nombre_cliente text not null,
  whatsapp text not null,
  placa text not null,
  modelo text not null,
  problema text,
  estado text not null default 'recibido'
    constraint autos_estado_valido check (estado in ('recibido', 'proceso', 'cotizacion', 'listo')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
