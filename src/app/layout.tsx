import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";
import "@fontsource-variable/inter";
import "@fontsource-variable/caveat"; // handwriting for the notes
import "@fontsource-variable/noto-sans-ethiopic"; // Amharic glyphs (Caveat has none)
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Note Stickers",
  description:
    "A shared wall of sticky notes. Pin a thought, a quote or a bit of encouragement and watch it appear for everyone, live.",
  appleWebApp: { capable: true, title: "Note Stickers" },
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf2" },
    { media: "(prefers-color-scheme: dark)", color: "#221c16" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Open the database connection while the JS bundle is still loading.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) preconnect(supabaseUrl);

  return (
    <html lang="en">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
