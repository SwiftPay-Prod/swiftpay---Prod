export const SignalRMethods = {
	EmailVerified: 'EmailVerified',
	UserStatusChanged: 'UserStatusChanged',
	NotificationReceived: 'NotificationReceived',
	UserNotificationReceived: 'UserNotificationReceived',
	DeviceRevoked: 'DeviceRevoked',
	MerchantDashboardUpdated: 'MerchantDashboardUpdated',
	AdminDashboardUpdated: 'AdminDashboardUpdated',
	AcquirerDashboardUpdated: 'AcquirerDashboardUpdated',
} as const;

export type SignalRMethod = (typeof SignalRMethods)[keyof typeof SignalRMethods];
