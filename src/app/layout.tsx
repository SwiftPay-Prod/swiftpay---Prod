import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://swiftpayment.info");
const ogImageUrl = new URL("/opengraph.png", appUrl).toString();

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "SwiftPay - Gateway de Pagamentos PIX",
    template: "%s | SwiftPay",
  },
  description:
    "Gateway de pagamentos PIX. Integre pagamentos PIX em sua plataforma com nossa API simples e segura.",
  keywords: [
    "gateway de pagamentos",
    "PIX",
    "pagamentos online",
    "API de pagamentos",
    "fintech",
    "pagamentos PIX",
  ],
  authors: [{ name: "SwiftPay" }],
  creator: "SwiftPay",
  publisher: "SwiftPay",
  metadataBase: new URL(appUrl),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SwiftPay",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: appUrl,
    siteName: "SwiftPay",
    title: "SwiftPay - Gateway de Pagamentos PIX",
    description:
      "Gateway de pagamentos PIX. Integre pagamentos PIX em sua plataforma com nossa API simples e segura.",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "SwiftPay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftPay - Gateway de Pagamentos PIX",
    description:
      "Gateway de pagamentos PIX. Integre pagamentos PIX em sua plataforma com nossa API simples e segura.",
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
    });
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning className="bg-background font-sans">
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}