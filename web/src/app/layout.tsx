import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Swiftpay",
  description: "Payment Gateway",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn("h-full", fontSans.variable, fontSerif.variable, fontMono.variable)}>
      <body className="font-sans antialiased h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
