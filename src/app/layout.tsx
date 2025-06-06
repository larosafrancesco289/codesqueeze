import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Replace the old metadata with this
export const metadata: Metadata = {
  title: {
    default: "CodeSqueeze | Transform Your Codebase for AI",
    template: `%s | CodeSqueeze`,
  },
  description:
    "CodeSqueeze transforms your codebase into a single, AI-ready text file. All processing is done locally in your browser to ensure your code remains private and secure.",
  keywords: [
    "AI",
    "LLM",
    "codebase",
    "context",
    "concatenate",
    "developer tools",
    "local processing",
    "privacy",
    "Next.js",
    "React",
    "TypeScript",
  ],
  authors: [{ name: "Francesco La Rosa", url: "https://codesqueeze.vercel.app" }],
  metadataBase: new URL("https://codesqueeze.vercel.app"),

  openGraph: {
    title: "CodeSqueeze | Transform Your Codebase for AI",
    description: "Concatenate your source files into a single, AI-ready text file. Processed locally for privacy.",
    url: "https://codesqueeze.vercel.app",
    siteName: "CodeSqueeze",
    images: [
      {
        url: "/og-image.png", // Recommended: Create this image
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeSqueeze | Transform Your Codebase for AI",
    description: "Turn your entire codebase into a single file for LLMs. Fast, private, and all in your browser.",
    images: ["/og-image.png"], // Recommended: Create this image
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}