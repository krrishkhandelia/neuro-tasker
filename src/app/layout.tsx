import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google"; // 1. Import Lexend
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Configure Lexend (The Dyslexia-Friendly Font)
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroTasker",
  description: "Local-First Executive Function Companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Add lexend.variable to the class list so Tailwind can see it */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}