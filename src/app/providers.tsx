'use client';

import { SwiftPayToaster } from '@/components/ui/swiftpay-toaster';
import { ForegroundNotificationListener } from '@/components/foreground-notification-listener';
import { RouterProvider } from '@/providers/router-provider';
import { ThemeProvider } from '@/providers/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<RouterProvider>
			<ThemeProvider>
				<ForegroundNotificationListener />
				{children}
				<SwiftPayToaster />
			</ThemeProvider>
		</RouterProvider>
	);
}