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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Nunito:wght@500;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
