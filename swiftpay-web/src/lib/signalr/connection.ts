import * as signalR from '@microsoft/signalr';

export interface CreateConnectionOptions {
	apiUrl: string;
	accessTokenFactory: () => string;
	deviceId?: string | null;
}

export function createSignalRConnection({ apiUrl, accessTokenFactory, deviceId }: CreateConnectionOptions): signalR.HubConnection {
	const hubUrl = deviceId
		? `${apiUrl}/hubs/notifications?deviceId=${encodeURIComponent(deviceId)}`
		: `${apiUrl}/hubs/notifications`;

	return new signalR.HubConnectionBuilder()
		.withUrl(hubUrl, {
			accessTokenFactory,
			transport: signalR.HttpTransportType.WebSockets,
			skipNegotiation: true,
		})
		.withAutomaticReconnect([2000, 5000, 10000, 30000])
		.configureLogging(signalR.LogLevel.Warning)
		.build();
}
