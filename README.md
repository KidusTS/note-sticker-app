# Setup Instructions for Note Stickers

## 1. Supabase Setup (Recommended - Free Tier)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready

### Create Notes Table

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
