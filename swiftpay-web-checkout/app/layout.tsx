import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: 'cover',
	themeColor: [
		{ media: '(prefers-color-scheme: dark)', color: '#000000' },
		{ media: '(prefers-color-scheme: light)', color: '#ffffff' },
	],
};

export const metadata: Metadata = {
	title: 'Checkout - SwiftPay',
	description: 'Checkout seguro e rápido',
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: 'any' },
			{ url: '/favicon.png', type: 'image/png' },
		],
		shortcut: '/favicon.png',
		apple: '/apple-touch-icon.png',
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'Checkout',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
			<body suppressHydrationWarning className="antialiased">
				{children}
			</body>
		</html>
	);
}

