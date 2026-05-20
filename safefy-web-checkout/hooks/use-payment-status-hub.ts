'use client';

import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import type { PaymentStatus } from '@/types/checkout';

interface PaymentStatusChangedPayload {
	paymentId: string;
	status: PaymentStatus;
}

interface UsePaymentStatusHubOptions {
	apiUrl: string | null;
	paymentId: string | null;
	onStatusChanged?: (payload: PaymentStatusChangedPayload) => void;
}

interface UsePaymentStatusHubReturn {
	isConnected: boolean;
	connectionError: string | null;
}

export function usePaymentStatusHub({
	apiUrl,
	paymentId,
	onStatusChanged,
}: UsePaymentStatusHubOptions): UsePaymentStatusHubReturn {
	const [isConnected, setIsConnected] = useState(false);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const connectionRef = useRef<signalR.HubConnection | null>(null);
	const onStatusChangedRef = useRef(onStatusChanged);
	const currentPaymentIdRef = useRef<string | null>(null);

	useEffect(() => {
		onStatusChangedRef.current = onStatusChanged;
	}, [onStatusChanged]);

	useEffect(() => {
		if (!apiUrl || !paymentId) return;

		if (connectionRef.current && currentPaymentIdRef.current === paymentId) {
			return;
		}

		if (connectionRef.current && currentPaymentIdRef.current !== paymentId) {
			connectionRef.current.stop();
			connectionRef.current = null;
			currentPaymentIdRef.current = null;
		}

		const hubUrl = `${apiUrl}/hubs/payment-status?paymentId=${encodeURIComponent(paymentId)}`;

		const connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl)
			.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
			.configureLogging(signalR.LogLevel.Warning)
			.build();

		connection.on('PaymentStatusChanged', (payload: PaymentStatusChangedPayload) => {
			onStatusChangedRef.current?.(payload);
		});

		connection.onclose(() => {
			setIsConnected(false);
		});

		connection.onreconnecting(() => {
			setIsConnected(false);
		});

		connection.onreconnected(() => {
			setIsConnected(true);
			setConnectionError(null);
		});

		connection
			.start()
			.then(() => {
				connectionRef.current = connection;
				currentPaymentIdRef.current = paymentId;
				setIsConnected(true);
				setConnectionError(null);
			})
			.catch(() => {
				setConnectionError('Falha ao conectar com o servidor');
			});

		return () => {
			if (connectionRef.current) {
				connectionRef.current.stop();
				connectionRef.current = null;
				currentPaymentIdRef.current = null;
				setIsConnected(false);
			}
		};
	}, [apiUrl, paymentId]);

	return { isConnected, connectionError };
}
