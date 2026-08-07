const BaseCookie = {
    accessToken: "access_token",
    accessTokenExpiresAt: "access_token_expires_at",
    user: "user",
    selectedMerchant: "selected_merchant",
    selectedEnvironment: "selected_environment",
    statusModal: "status_modal",
    deviceId: "device_id",
    deviceRevokedModal: "device_revoked_modal",
    sidebarExpanded: "sidebar_expanded",
}

const BaseLocalStorage = {
    swiftpayDeviceId: "swiftpay_device_id",
    notificationSoundEnabled: "notification_sound_enabled",
    liveBalanceSettings: "swiftpay_live_balance_settings",
    fcmToken: "swiftpay_fcm_token",
    pushEnabled: "swiftpay_push_enabled",
    pushAutoPrompted: "swiftpay_push_auto_prompted",
    sidebarExpandedSections: "swiftpay_sidebar_expanded_sections",
}

export const SIDEBAR_EXPANDED_SECTIONS_KEY = BaseLocalStorage.sidebarExpandedSections;

export { BaseCookie, BaseLocalStorage }
