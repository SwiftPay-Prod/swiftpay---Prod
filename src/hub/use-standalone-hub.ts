'use client';

import { useEffect, useRef, useState } from 'react';
import { createSignalRConnection } from '@/lib/signalr/connection';
import type { SignalRHandlers } from '@/lib/signalr/types';

interface UseStandaloneHubOptions {
	apiUrl: string;
	accessToken: string | null;
	handlers: SignalRHandlers;
}

function isStartStopRaceError(error: unknown): boolean {
	if (!error) {
		return false;
	}

	const message = error instanceof Error ? error.message : String(error);
	return message.includes('Failed to start the HttpConnection before stop() was called.');
}

export function useStandaloneHub({ apiUrl, accessToken, handlers }: UseStandaloneHubOptions) {
	const [isConnected, setIsConnected] = useState(false);
	const handlersRef = useRef(handlers);

	useEffect(() => {
		handlersRef.current = handlers;
	}, [handlers]);

	useEffect(() => {
		if (!accessToken || !apiUrl) return;
		let isDisposed = false;

		const connection = createSignalRConnection({
			apiUrl,
			accessTokenFactory: () => accessToken,
		});

		for (const method of Object.keys(handlersRef.current)) {
			connection.on(method, (...args: unknown[]) => {
				handlersRef.current[method]?.(...args);
			});
		}

		connection.onclose(() => {
			if (!isDisposed) {
				setIsConnected(false);
			}
		});
		connection.onreconnecting(() => {
			if (!isDisposed) {
				setIsConnected(false);
			}
		});
		connection.onreconnected(() => {
			if (!isDisposed) {
				setIsConnected(true);
			}
		});

		void connection
			.start()
			.then(async () => {
				if (isDisposed) {
					if (connection.state !== 'Disconnected') {
						await connection.stop().catch(() => {});
					}
					return;
				}

				setIsConnected(true);
			})
			.catch((error) => {
				if (isDisposed || isStartStopRaceError(error)) {
					return;
				}

				console.error('SignalR standalone connection error:', error);
			});

		return () => {
			isDisposed = true;
			setIsConnected(false);

			if (connection.state !== 'Disconnected') {
				void connection.stop().catch((error) => {
					if (isStartStopRaceError(error)) {
						return;
					}

					console.error('SignalR standalone cleanup error:', error);
				});
			}
		};
	}, [apiUrl, accessToken]);

	return { isConnected };
}