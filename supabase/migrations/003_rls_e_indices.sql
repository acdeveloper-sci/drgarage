-- RLS sin políticas: anon y authenticated no leen ni escriben nada.
-- El acceso es solo desde el servidor de Next.js con la clave service_role, que ignora RLS.
alter table public.autos enable row level security;
alter table public.eventos enable row level security;

-- autos.token_publico ya tiene índice: lo crea su restricción UNIQUE (autos_token_publico_key).
create index eventos_auto_id_idx on public.eventos (auto_id);
