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
    safefyDeviceId: "safefy_device_id",
    notificationSoundEnabled: "notification_sound_enabled",
    liveBalanceSettings: "safefy_live_balance_settings",
    fcmToken: "safefy_fcm_token",
    pushEnabled: "safefy_push_enabled",
    pushAutoPrompted: "safefy_push_auto_prompted",
    sidebarExpandedSections: "safefy_sidebar_expanded_sections",
}

export const SIDEBAR_EXPANDED_SECTIONS_KEY = BaseLocalStorage.sidebarExpandedSections;

export { BaseCookie, BaseLocalStorage }
