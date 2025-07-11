# Note Sticker App

A modern, real-time note-sharing application where users can create and share sticky notes that appear on a shared digital wall. Built with Next.js 15, React 19, and Supabase.

## Features

- **Real-time collaboration**: Notes appear instantly for all users
- **Improved drag and drop**: Notes now move immediately on grab/hold - no double-click needed
- **Responsive design**: Works on both desktop and mobile
- **Profanity filtering**: Automatic content moderation
- **Beautiful animations**: Smooth transitions and effects
- **Persistent storage**: Notes are saved to a database
- **Security hardened**: Rate limiting, input validation, and security headers
- **Vercel-ready**: Optimized for deployment with proper configuration

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Security Features

- **Rate limiting**: 5-second cooldown between note submissions
- **Input validation**: Enhanced content validation and sanitization
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Content moderation**: Profanity filtering for appropriate content
- **Error handling**: Graceful error handling and user feedback

## Deployment

The app is fully configured for Vercel deployment with:
- Optimized build configuration
- Security headers
- Performance optimizations
- Production-ready error handling

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
