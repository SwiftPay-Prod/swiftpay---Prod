'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { createSignalRConnection } from '@/lib/signalr/connection';
import type { SignalRHandler } from '@/lib/signalr/types';

interface SignalRContextValue {
	isConnected: boolean;
	subscribe: <TArgs extends unknown[]>(method: string, handler: (...args: TArgs) => void) => () => void;
	invoke: (method: string, ...args: unknown[]) => Promise<void>;
}

const SignalRContext = createContext<SignalRContextValue | null>(null);

interface SignalRProviderProps {
	apiUrl: string;
	accessToken: string | null;
	deviceId: string | null;
	children: ReactNode;
}

export function SignalRProvider({ apiUrl, accessToken, deviceId, children }: SignalRProviderProps) {
	const [isConnected, setIsConnected] = useState(false);
	const connectionRef = useRef<signalR.HubConnection | null>(null);
	const handlersRef = useRef(new Map<string, Set<SignalRHandler>>());
	const accessTokenRef = useRef(accessToken);

	useEffect(() => {
		accessTokenRef.current = accessToken;
	}, [accessToken]);

	const subscribe = useCallback(<TArgs extends unknown[]>(method: string, handler: (...args: TArgs) => void): (() => void) => {
		const internalHandler = handler as SignalRHandler;
		if (!handlersRef.current.has(method)) {
			handlersRef.current.set(method, new Set());
		}
		handlersRef.current.get(method)!.add(internalHandler);

		connectionRef.current?.on(method, internalHandler);

		return () => {
			handlersRef.current.get(method)?.delete(internalHandler);
			if (handlersRef.current.get(method)?.size === 0) {
				handlersRef.current.delete(method);
			}
			connectionRef.current?.off(method, internalHandler);
		};
	}, []);

	const invoke = useCallback(async (method: string, ...args: unknown[]): Promise<void> => {
		const conn = connectionRef.current;
		if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
		await conn.invoke(method, ...args);
	}, []);

	useEffect(() => {
		if (!accessToken || !apiUrl) return;
		let isDisposed = false;

		const connection = createSignalRConnection({
			apiUrl,
			accessTokenFactory: () => accessTokenRef.current ?? '',
			deviceId,
		});

		handlersRef.current.forEach((handlers, method) => {
			handlers.forEach((handler) => connection.on(method, handler));
		});

		connectionRef.current = connection;

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

		connection
			.start()
			.then(async () => {
				if (isDisposed) {
					await connection.stop().catch(() => {});
					return;
				}

				setIsConnected(true);
			})
			.catch((err) => {
				if (!isDisposed) {
					console.error('SignalR connection error:', err);
				}
			});

		return () => {
			isDisposed = true;
			connectionRef.current = null;
			setIsConnected(false);

			if (connection.state !== signalR.HubConnectionState.Disconnected) {
				connection.stop().catch(() => {});
			}
		};
	}, [apiUrl, accessToken, deviceId]);

	const value = useMemo(() => ({ isConnected, subscribe, invoke }), [isConnected, subscribe, invoke]);

	return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
}

export function useSignalR(): SignalRContextValue {
	const context = useContext(SignalRContext);
	if (!context) {
		throw new Error('useSignalR must be used within a SignalRProvider');
	}
	return context;
}