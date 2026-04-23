alter table public.comments
add column if not exists content text,
add column if not exists parent_id uuid references public.comments(id) on delete cascade,
add column if not exists resolved boolean not null default false,
add column if not exists reactions jsonb not null default '{}'::jsonb;

update public.comments
set content = body
where content is null;

create index if not exists comments_parent_id_idx on public.comments (parent_id);
