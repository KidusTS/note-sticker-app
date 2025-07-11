import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Note Stickers - Share Your Thoughts",
  description:
    "Share your thoughts, quotes, and inspiration with the world! Write a note and watch it appear as a beautiful sticky note on our global wall.",
  keywords:
    "notes, sticky notes, thoughts, quotes, inspiration, share, global wall",
  authors: [{ name: "Note Stickers Team" }],
  creator: "Note Stickers",
  publisher: "Note Stickers",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Note Stickers" />
        <meta name="application-name" content="Note Stickers" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
