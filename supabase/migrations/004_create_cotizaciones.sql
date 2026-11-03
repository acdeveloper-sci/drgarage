-- Cotizaciones de reparaciones adicionales. Fechas en UTC (timestamptz).
-- Sin on delete cascade: lo que el cliente aprobó o rechazó no se borra con el auto.
create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  auto_id uuid not null references public.autos (id),
  descripcion text not null,
  costo_cop integer not null check (costo_cop > 0),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada', 'anulada')),
  enviada_en timestamptz not null default now(),
  decidida_en timestamptz,
  nota text check (char_length(nota) <= 140),
  check ((estado in ('aprobada', 'rechazada')) = (decidida_en is not null)),
  check (nota is null or estado = 'rechazada')
);

-- Una sola cotización pendiente por auto, aun con dos envíos simultáneos.
create unique index cotizaciones_una_pendiente_por_auto
  on public.cotizaciones (auto_id) where estado = 'pendiente';
create index cotizaciones_auto_enviada_idx
  on public.cotizaciones (auto_id, enviada_en desc);

-- RLS sin políticas: solo el servidor de Next.js (service_role) accede.
alter table public.cotizaciones enable row level security;
