-- Note Stickers: table, access rules and realtime.
-- Run once in the Supabase SQL editor.

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  text        text        not null check (char_length(text) between 1 and 200),
  author      text        not null check (char_length(author) between 1 and 50),
  x           double precision not null default 0,
  y           double precision not null default 0,
  rotation    double precision not null default 0,
  color       text        not null default 'yellow',
  created_at  timestamptz not null default now()
);

alter table public.notes enable row level security;

-- The wall is public: anyone with the anon key can read, pin, move and remove notes.
create policy "notes are readable"  on public.notes for select using (true);
create policy "notes can be pinned" on public.notes for insert with check (true);
create policy "notes can be moved"  on public.notes for update using (true) with check (true);
create policy "notes can be removed" on public.notes for delete using (true);

-- Live updates
alter publication supabase_realtime add table public.notes;
