import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeSensei — Learn from real codebases",
  description:
    "Turn any public GitHub repository into a structured, interactive curriculum. Learn from real source code.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} ${jetbrains.variable} h-full dark`}>
      <body className="min-h-full antialiased bg-[var(--bg)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
