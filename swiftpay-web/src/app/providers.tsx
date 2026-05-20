'use client';

import { SafefyToaster } from '@/components/ui/safefy-toaster';
import { ForegroundNotificationListener } from '@/components/foreground-notification-listener';
import { RouterProvider } from '@/providers/router-provider';
import { ThemeProvider } from '@/providers/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<RouterProvider>
			<ThemeProvider>
				<ForegroundNotificationListener />
				{children}
				<SafefyToaster />
			</ThemeProvider>
		</RouterProvider>
	);
}

