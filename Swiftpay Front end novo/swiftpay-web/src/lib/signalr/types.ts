export type SignalRHandler = (...args: unknown[]) => void;

export type SignalRHandlers = Record<string, SignalRHandler>;

export interface DeviceRevokedData {
	deviceId: string;
	deviceName: string;
	reason: string;
}
