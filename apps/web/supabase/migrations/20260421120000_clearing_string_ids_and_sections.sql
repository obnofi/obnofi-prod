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
    create type public.element_kind as enum ('sticky', 'shape', 'text', 'image', 'embed', 'path', 'connector', 'section');
  end if;
end
$$;

alter type public.element_kind add value if not exists 'embed';
alter type public.element_kind add value if not exists 'section';

create table if not exists public.users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text unique,
  avatar_url text,
  color text not null default 'fern',
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rooms (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  owner_id text not null references public.users(id) on delete cascade,
  background text not null default 'paper',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.elements (
  id text primary key default gen_random_uuid()::text,
  room_id text not null references public.rooms(id) on delete cascade,
  type public.element_kind not null,
  created_by text not null references public.users(id) on delete cascade,
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
  id text primary key default gen_random_uuid()::text,
  room_id text not null references public.rooms(id) on delete cascade,
  element_id text references public.elements(id) on delete cascade,
  author_id text not null references public.users(id) on delete cascade,
  body text not null,
  content text,
  parent_id text references public.comments(id) on delete cascade,
  x double precision,
  y double precision,
  resolved boolean not null default false,
  resolved_at timestamptz,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.rooms drop constraint if exists rooms_owner_id_fkey;
alter table if exists public.elements drop constraint if exists elements_room_id_fkey;
alter table if exists public.elements drop constraint if exists elements_created_by_fkey;
alter table if exists public.comments drop constraint if exists comments_room_id_fkey;
alter table if exists public.comments drop constraint if exists comments_element_id_fkey;
alter table if exists public.comments drop constraint if exists comments_author_id_fkey;
alter table if exists public.comments drop constraint if exists comments_parent_id_fkey;

alter table if exists public.users
alter column id type text using id::text,
alter column id set default gen_random_uuid()::text;

alter table if exists public.rooms
alter column id type text using id::text,
alter column id set default gen_random_uuid()::text,
alter column owner_id type text using owner_id::text;

alter table if exists public.elements
alter column id type text using id::text,
alter column id set default gen_random_uuid()::text,
alter column room_id type text using room_id::text,
alter column created_by type text using created_by::text;

alter table if exists public.comments
add column if not exists content text,
add column if not exists parent_id text,
add column if not exists resolved boolean not null default false,
add column if not exists reactions jsonb not null default '{}'::jsonb;

alter table if exists public.comments
alter column id type text using id::text,
alter column id set default gen_random_uuid()::text,
alter column room_id type text using room_id::text,
alter column element_id type text using element_id::text,
alter column author_id type text using author_id::text,
alter column parent_id type text using parent_id::text;

alter table if exists public.rooms
add constraint rooms_owner_id_fkey
foreign key (owner_id) references public.users(id) on delete cascade;

alter table if exists public.elements
add constraint elements_room_id_fkey
foreign key (room_id) references public.rooms(id) on delete cascade;

alter table if exists public.elements
add constraint elements_created_by_fkey
foreign key (created_by) references public.users(id) on delete cascade;

alter table if exists public.comments
add constraint comments_room_id_fkey
foreign key (room_id) references public.rooms(id) on delete cascade;

alter table if exists public.comments
add constraint comments_element_id_fkey
foreign key (element_id) references public.elements(id) on delete cascade;

alter table if exists public.comments
add constraint comments_author_id_fkey
foreign key (author_id) references public.users(id) on delete cascade;

alter table if exists public.comments
add constraint comments_parent_id_fkey
foreign key (parent_id) references public.comments(id) on delete cascade;

create index if not exists elements_room_id_idx on public.elements (room_id, z_index);
create index if not exists comments_room_id_idx on public.comments (room_id, created_at);
create index if not exists comments_element_id_idx on public.comments (element_id);
create index if not exists comments_parent_id_idx on public.comments (parent_id);

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

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.users to anon, authenticated;
grant select, insert, update, delete on public.rooms to anon, authenticated;
grant select, insert, update, delete on public.elements to anon, authenticated;
grant select, insert, update, delete on public.comments to anon, authenticated;

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

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object or undefined_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.elements;
exception
  when duplicate_object or undefined_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception
  when duplicate_object or undefined_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.users;
exception
  when duplicate_object or undefined_object then null;
end
$$;
