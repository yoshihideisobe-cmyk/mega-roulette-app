import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  title: "Dancing President Mega Roulette",
  description: "The most luxurious roulette app for the president.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={clsx(inter.variable, cinzel.variable, "antialiased bg-navy selection:bg-gold selection:text-navy")}>
        {children}
      </body>
    </html>
  );
}
