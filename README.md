# Note Stickers

A shared wall of sticky notes. Pin a note and it appears, live, for everyone looking at the wall. Drag notes around, and delete the ones you don't want.

Built with Next.js 15, React 19, Tailwind CSS 4 and Supabase (Postgres + Realtime).

## How it works

- **The wall** is a fixed-size canvas you pan around (drag the background, scroll, or swipe). Note positions are stored in board pixels, so the wall looks the same on every device.
- **New notes** land in the part of the wall you're currently looking at, away from existing notes.
- **Moving notes**: drag with the mouse; on touch, drag by the strip of tape at the top so the rest of the note still pans the wall; with the keyboard, focus a note and use the arrow keys (Shift for bigger steps).
- **Moderation**: English (`bad-words`) and Amharic word lists, checked before posting. Posting is rate-limited to one note every 5 seconds per browser.
- **Theme**: warm corkboard, with automatic light/dark following the system setting.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. It creates the `notes` table, access policies and enables realtime.
3. Copy your project URL and anon key into `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

## Deploying

Push to GitHub, import the repo in Vercel, and add the same two environment variables. No other configuration is needed; security headers live in `next.config.ts`.

## Project layout

```
src/
  app/            page, layout, theme tokens and note/dialog styles (globals.css)
  components/     Board, StickyNote, NotePaper, ComposeDialog, Header, Toasts, ErrorBoundary
  hooks/          useNotes (data + realtime + optimistic actions), useToasts
  lib/            supabase client, notes-api, board geometry, colours, validation, moderation
supabase/         schema.sql
```

## Note on access control

The policies in `schema.sql` let anyone with the anon key edit or delete any note, which matches the "global wall" idea. If you'd rather notes only be deletable by their author, you'll need some form of identity (e.g. Supabase anonymous auth) plus stricter RLS policies.
