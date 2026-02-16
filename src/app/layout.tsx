import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const displayFont = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
});

const sansFont = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Series Learner Tracker",
  description:
    "Track watch time by language and balance learning-language minutes against non-learning series and movies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} bg-[var(--color-background)] text-[var(--color-text-primary)] antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
