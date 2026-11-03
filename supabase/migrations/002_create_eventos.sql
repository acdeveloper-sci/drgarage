-- Actividad de cada auto (cambio_estado, aviso_enviado). Fechas en UTC (timestamptz).
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  auto_id uuid not null references public.autos (id),
  tipo text not null,
  descripcion text not null,
  creado_en timestamptz not null default now()
);
