# Setup Instructions for Note Stickers

## 1. Supabase Setup (Recommended - Free Tier)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready

### Create Notes Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL CHECK (length(text) <= 200),
  author TEXT NOT NULL CHECK (length(author) <= 50),
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  rotation FLOAT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can read notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notes" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete notes" ON notes FOR DELETE USING (true);

-- Create index for better performance
CREATE INDEX notes_created_at_idx ON notes (created_at DESC);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
```

### Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Vercel Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables in Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Alternative Storage Options

### Option A: Vercel KV (Redis)

- Good for: Simple key-value storage
- Limit: 30,000 commands/month (free)
- Setup: Enable in Vercel dashboard

### Option B: PlanetScale

- Good for: MySQL database
- Limit: 1GB storage (free)
- Setup: Create database, get connection string

### Option C: MongoDB Atlas

- Good for: Document database
- Limit: 512MB storage (free)
- Setup: Create cluster, get connection string

## 4. Features Included

✅ **Responsive Design**: Works on mobile, tablet, and desktop
✅ **Dark Theme**: Modern dark UI throughout
✅ **Real-time Updates**: See new notes instantly
✅ **Global Sharing**: Notes visible to all visitors
✅ **Profanity Filter**: Content moderation
✅ **Touch-friendly**: Optimized for mobile devices
✅ **Accessibility**: Screen reader friendly
✅ **Error Handling**: Graceful error boundaries
✅ **Loading States**: Smooth user experience
✅ **PWA Ready**: Can be installed as an app

## 5. Mobile Optimizations

- Touch-friendly button sizes (44px minimum)
- Responsive text sizing
- Optimized note positioning for small screens
- Reduced animations on mobile
- Safe area insets for devices with notches
- Prevents zoom on input focus
- Dynamic viewport height support
