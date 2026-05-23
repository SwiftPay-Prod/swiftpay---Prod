import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';

let connection: HubConnection | null = null;

export function getSignalRConnection(): HubConnection {
  if (!connection) {
    const token = localStorage.getItem('swiftpay_token');
    connection = new HubConnectionBuilder()
      .withUrl(`http://localhost:5002/hubs/dashboard`, { accessTokenFactory: () => token || '' })
      .withAutomaticReconnect()
      .build();
  }
  return connection;
}

export async function startSignalR(): Promise<void> {
  const conn = getSignalRConnection();
  if (conn.state === 'Disconnected') {
    try { await conn.start(); } catch (err) { console.log('SignalR connection failed', err); }
  }
}
