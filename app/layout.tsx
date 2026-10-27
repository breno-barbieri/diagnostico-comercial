import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";

const fraunces = localFont({ src: "./fonts/fraunces.woff2", variable: "--font-fraunces", weight: "100 900", display: "swap" });
const inter = localFont({ src: "./fonts/inter.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: "Diagnóstico comercial | G4 Traction",
  description: "Autodiagnóstico comercial para empresários",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
