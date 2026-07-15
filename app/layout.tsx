import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vour Carousels",
  description: "On-brand @vourdev carousel builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Geist (geometric sans) + Geist Mono per vercel-DESIGN.md §3. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
