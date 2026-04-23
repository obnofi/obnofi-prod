create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'element_kind'
  ) then
    create type public.element_kind as enum ('sticky', 'shape', 'text', 'image', 'path', 'connector');
  end if;
end
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  avatar_url text,
  color text not null default 'fern',
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  background text not null default 'paper',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.elements (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  type public.element_kind not null,
  created_by uuid not null references public.users(id) on delete cascade,
  x double precision not null default 0,
  y double precision not null default 0,
  width double precision not null default 240,
  height double precision not null default 120,
  rotation double precision not null default 0,
  z_index integer not null default 0,
  style jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  element_id uuid references public.elements(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  x double precision,
  y double precision,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists elements_room_id_idx on public.elements (room_id, z_index);
create index if not exists comments_room_id_idx on public.comments (room_id, created_at);
create index if not exists comments_element_id_idx on public.comments (element_id);

drop trigger if exists users_set_current_timestamp on public.users;
create trigger users_set_current_timestamp
before update on public.users
for each row
execute function public.set_current_timestamp();

drop trigger if exists rooms_set_current_timestamp on public.rooms;
create trigger rooms_set_current_timestamp
before update on public.rooms
for each row
execute function public.set_current_timestamp();

drop trigger if exists elements_set_current_timestamp on public.elements;
create trigger elements_set_current_timestamp
before update on public.elements
for each row
execute function public.set_current_timestamp();

drop trigger if exists comments_set_current_timestamp on public.comments;
create trigger comments_set_current_timestamp
before update on public.comments
for each row
execute function public.set_current_timestamp();

alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.elements enable row level security;
alter table public.comments enable row level security;

drop policy if exists "users are readable" on public.users;
create policy "users are readable"
on public.users
for select
using (true);

drop policy if exists "users are writable" on public.users;
create policy "users are writable"
on public.users
for all
using (true)
with check (true);

drop policy if exists "rooms are readable" on public.rooms;
create policy "rooms are readable"
on public.rooms
for select
using (true);

drop policy if exists "rooms are writable" on public.rooms;
create policy "rooms are writable"
on public.rooms
for all
using (true)
with check (true);

drop policy if exists "elements are readable" on public.elements;
create policy "elements are readable"
on public.elements
for select
using (true);

drop policy if exists "elements are writable" on public.elements;
create policy "elements are writable"
on public.elements
for all
using (true)
with check (true);

drop policy if exists "comments are readable" on public.comments;
create policy "comments are readable"
on public.comments
for select
using (true);

drop policy if exists "comments are writable" on public.comments;
create policy "comments are writable"
on public.comments
for all
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clearing-assets',
  'clearing-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public storage read for clearing assets" on storage.objects;
create policy "public storage read for clearing assets"
on storage.objects
for select
using (bucket_id = 'clearing-assets');

drop policy if exists "public storage write for clearing assets" on storage.objects;
create policy "public storage write for clearing assets"
on storage.objects
for insert
with check (bucket_id = 'clearing-assets');

drop policy if exists "public storage update for clearing assets" on storage.objects;
create policy "public storage update for clearing assets"
on storage.objects
for update
using (bucket_id = 'clearing-assets')
with check (bucket_id = 'clearing-assets');

drop policy if exists "public storage delete for clearing assets" on storage.objects;
create policy "public storage delete for clearing assets"
on storage.objects
for delete
using (bucket_id = 'clearing-assets');

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.elements;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.users;
