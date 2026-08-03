// Tracking Provider
export { TrackingProvider, useTracking, useTrackingOptional } from './tracking-provider';
export type { CheckoutTrackingEvent } from '@/types/tracking';

// Individual Trackers
export { Clarity } from './clarity';
export { FacebookPixel, FacebookCheckoutEvents, trackFacebookEvent, trackFacebookCustomEvent, type FacebookEventName, type FacebookEventParams } from './facebook-pixel';
export { GoogleTagManager, GTMCheckoutEvents, pushToDataLayer } from './google-tag-manager';
export { TikTokPixel, TikTokCheckoutEvents, trackTikTokEvent, type TikTokEventName, type TikTokEventParams } from './tiktok-pixel';
export { KwaiPixel, KwaiCheckoutEvents, trackKwaiEvent, type KwaiEventName, type KwaiEventParams } from './kwai-pixel';
export { PinterestTag, PinterestCheckoutEvents, trackPinterestEvent, type PinterestEventName, type PinterestEventParams } from './pinterest-tag';
export { TaboolaPixel, createTaboolaCheckoutEvents, trackTaboolaEvent, type TaboolaEventName, type TaboolaEventParams } from './taboola-pixel';
export { Utmify, UtmifyCheckoutEvents, trackUtmifyEvent } from './utmify';
export { Otimizey, OtimizeyCheckoutEvents, trackOtimizeyEvent } from './otimizey';
