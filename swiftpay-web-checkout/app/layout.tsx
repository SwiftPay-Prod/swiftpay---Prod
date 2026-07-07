import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: 'cover',
	themeColor: [
		{ media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
		{ media: '(prefers-color-scheme: light)', color: '#f7f9fc' },
	],
};

export const metadata: Metadata = {
	title: 'Checkout - SwiftPay',
	description: 'Checkout seguro e rápido',
	icons: {
		icon: '/swiftpay-icon-logo.png',
		shortcut: '/swiftpay-icon-logo.png',
		apple: '/swiftpay-icon-logo.png',
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
		<html lang="pt-BR" suppressHydrationWarning>
			<body suppressHydrationWarning className={`${inter.className} antialiased`}>
				{children}
			</body>
		</html>
	);
}

