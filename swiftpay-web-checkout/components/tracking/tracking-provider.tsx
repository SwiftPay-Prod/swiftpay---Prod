'use client';

import { createContext, useContext, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import type { CheckoutData } from '@/types/checkout';
import type { TrackingSettings, TrackingEventData, CheckoutTrackingEvent } from '@/types/tracking';
import { DEFAULT_TRACKING_EVENTS } from '@/types/tracking';

// Import trackers
import { Clarity } from './clarity';
import { FacebookPixel, FacebookCheckoutEvents } from './facebook-pixel';
import { GoogleTagManager, GTMCheckoutEvents } from './google-tag-manager';
import { TikTokPixel, TikTokCheckoutEvents } from './tiktok-pixel';
import { KwaiPixel, KwaiCheckoutEvents } from './kwai-pixel';
import { PinterestTag, PinterestCheckoutEvents } from './pinterest-tag';
import { TaboolaPixel, createTaboolaCheckoutEvents } from './taboola-pixel';
import { Utmify, UtmifyCheckoutEvents } from './utmify';
import { Otimizey, OtimizeyCheckoutEvents } from './otimizey';

interface TrackingContextValue {
	trackEvent: (event: CheckoutTrackingEvent, data?: TrackingEventData) => void;
	settings: TrackingSettings | null;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

interface TrackingProviderProps {
	children: ReactNode;
	checkout: CheckoutData;
}

/**
 * Helper to check if an event is enabled for a platform.
 * If no events array is defined, all events are enabled by default.
 */
function isEventEnabled(events: CheckoutTrackingEvent[] | undefined | null, event: CheckoutTrackingEvent): boolean {
	if (!events || events.length === 0) {
		return DEFAULT_TRACKING_EVENTS.includes(event);
	}
	return events.includes(event);
}

export function TrackingProvider({ children, checkout }: TrackingProviderProps) {
	const { config, template, products } = checkout;
	const tracking = config?.tracking;

	// Check if template supports each tracking
	const supportsClarity = template?.supportsClarity ?? false;
	const supportsFacebookPixel = template?.supportsFacebookPixel ?? false;
	const supportsGoogleTagManager = template?.supportsGoogleTagManager ?? false;
	const supportsTikTok = template?.supportsTikTok ?? false;
	const supportsKwai = template?.supportsKwai ?? false;
	const supportsPinterest = template?.supportsPinterest ?? false;
	const supportsTaboola = template?.supportsTaboola ?? false;
	const supportsUtmify = template?.supportsUtmify ?? false;
	const supportsOtimizey = template?.supportsOtimizey ?? false;

	// Memoized product data for events (aggregate from products array)
	const productData = useMemo(() => {
		const firstProduct = products?.[0];
		const totalPrice = products?.reduce((sum, p) => sum + p.price * p.quantity, 0) ?? 0;
		return {
			id: firstProduct?.productId ?? '',
			name: firstProduct?.name ?? '',
			price: totalPrice,
			currency: 'BRL' as const,
			numItems: products?.reduce((sum, p) => sum + p.quantity, 0) ?? 1,
		};
	}, [products]);

	// Create taboola events if configured
	const taboolaAccountId = tracking?.taboola?.accountId;
	const taboolaEnabled = supportsTaboola && tracking?.taboola?.enabled && !!taboolaAccountId;
	const taboolaEvents = useMemo(() => {
		if (taboolaEnabled && taboolaAccountId) {
			return createTaboolaCheckoutEvents(taboolaAccountId);
		}
		return null;
	}, [taboolaEnabled, taboolaAccountId]);

	// Track event across all enabled platforms
	const trackEvent = useCallback(
		(event: CheckoutTrackingEvent, data?: TrackingEventData) => {
			const value = data?.value ?? productData.price / 100;
			const currency = data?.currency ?? productData.currency;
			const contentId = data?.contentId ?? productData.id;
			const contentName = data?.contentName ?? productData.name;
			const numItems = data?.numItems ?? productData.numItems;

			// Facebook Pixel
			if (supportsFacebookPixel && tracking?.facebookPixel?.enabled) {
				const fbEvents = tracking.facebookPixel.events;
				if (isEventEnabled(fbEvents, event)) {
					switch (event) {
						case 'pageEntered':
							FacebookCheckoutEvents.pageView();
							break;
						case 'contentLoaded':
							FacebookCheckoutEvents.viewProduct(contentId, contentName, value, currency);
							break;
						case 'initiateCheckout':
							FacebookCheckoutEvents.initiateCheckout(contentId, value, currency);
							break;
						case 'addPaymentInfo':
							FacebookCheckoutEvents.addPaymentInfo(value, currency);
							break;
						case 'clickedPurchase':
							FacebookCheckoutEvents.lead(value, currency);
							break;
						case 'purchaseCompleted':
							FacebookCheckoutEvents.purchase(data?.orderId ?? '', contentId, value, currency, numItems);
							break;
					}
				}
			}

			// Google Tag Manager
			if (supportsGoogleTagManager && tracking?.googleTagManager?.enabled) {
				const gtmEvents = tracking.googleTagManager.events;
				if (isEventEnabled(gtmEvents, event)) {
					switch (event) {
						case 'pageEntered':
							GTMCheckoutEvents.pageView();
							break;
						case 'contentLoaded':
							GTMCheckoutEvents.viewItem(contentId, contentName, value, currency);
							break;
						case 'initiateCheckout':
							GTMCheckoutEvents.beginCheckout(contentId, contentName, value, currency);
							break;
						case 'addPaymentInfo':
							GTMCheckoutEvents.addPaymentInfo(value, currency);
							break;
						case 'clickedPurchase':
							GTMCheckoutEvents.addPaymentInfo(value, currency);
							break;
						case 'purchaseCompleted':
							GTMCheckoutEvents.purchase(data?.orderId ?? '', contentId, contentName, value, currency);
							break;
					}
				}
			}

			// TikTok
			if (supportsTikTok && tracking?.tikTok?.enabled) {
				const ttEvents = tracking.tikTok.events;
				if (isEventEnabled(ttEvents, event)) {
					switch (event) {
						case 'pageEntered':
							TikTokCheckoutEvents.pageView();
							break;
						case 'contentLoaded':
							TikTokCheckoutEvents.viewContent(contentId, contentName, value, currency);
							break;
						case 'initiateCheckout':
							TikTokCheckoutEvents.initiateCheckout(contentId, value, currency);
							break;
						case 'addPaymentInfo':
							TikTokCheckoutEvents.addPaymentInfo(value, currency);
							break;
						case 'clickedPurchase':
							TikTokCheckoutEvents.placeAnOrder(contentId, value, currency);
							break;
						case 'purchaseCompleted':
							TikTokCheckoutEvents.completePayment(contentId, value, currency, numItems);
							break;
					}
				}
			}

			// Kwai
			if (supportsKwai && tracking?.kwai?.enabled) {
				const kwaiEvents = tracking.kwai.events;
				if (isEventEnabled(kwaiEvents, event)) {
					switch (event) {
						case 'pageEntered':
							KwaiCheckoutEvents.pageView();
							break;
						case 'contentLoaded':
							KwaiCheckoutEvents.viewContent(contentId, contentName, value, currency);
							break;
						case 'initiateCheckout':
							KwaiCheckoutEvents.initiateCheckout(contentId, value, currency);
							break;
						case 'addPaymentInfo':
							KwaiCheckoutEvents.addPaymentInfo(value, currency);
							break;
						case 'clickedPurchase':
							KwaiCheckoutEvents.addToCart(contentId, value, currency);
							break;
						case 'purchaseCompleted':
							KwaiCheckoutEvents.purchase(contentId, value, currency);
							break;
					}
				}
			}

			// Pinterest
			if (supportsPinterest && tracking?.pinterest?.enabled) {
				const pinEvents = tracking.pinterest.events;
				if (isEventEnabled(pinEvents, event)) {
					switch (event) {
						case 'pageEntered':
							PinterestCheckoutEvents.pageVisit();
							break;
						case 'contentLoaded':
							PinterestCheckoutEvents.viewContent(contentId, contentName, value, currency);
							break;
						case 'initiateCheckout':
							PinterestCheckoutEvents.addToCart(contentId, contentName, value, currency);
							break;
						case 'addPaymentInfo':
							PinterestCheckoutEvents.addPaymentInfo(value, currency);
							break;
						case 'clickedPurchase':
							PinterestCheckoutEvents.lead(value, currency);
							break;
						case 'purchaseCompleted':
							PinterestCheckoutEvents.checkout(data?.orderId ?? '', contentId, contentName, value, numItems, currency);
							break;
					}
				}
			}

			// Taboola
			if (taboolaEvents && tracking?.taboola?.enabled) {
				const tabEvents = tracking.taboola.events;
				if (isEventEnabled(tabEvents, event)) {
					switch (event) {
						case 'pageEntered':
							taboolaEvents.pageView();
							break;
						case 'contentLoaded':
							taboolaEvents.viewContent();
							break;
						case 'initiateCheckout':
							taboolaEvents.checkoutStart();
							break;
						case 'addPaymentInfo':
							taboolaEvents.lead();
							break;
						case 'clickedPurchase':
							taboolaEvents.checkoutStart();
							break;
						case 'purchaseCompleted':
							taboolaEvents.purchase(data?.orderId ?? '', value, currency, numItems);
							break;
					}
				}
			}

			// Utmify
			if (supportsUtmify && tracking?.utmify?.enabled) {
				const utmEvents = tracking.utmify.events;
				if (isEventEnabled(utmEvents, event)) {
					switch (event) {
						case 'pageEntered':
							UtmifyCheckoutEvents.pageView();
							break;
						case 'contentLoaded':
							UtmifyCheckoutEvents.viewContent(contentId, contentName, value);
							break;
						case 'initiateCheckout':
							UtmifyCheckoutEvents.initiateCheckout(contentId, value);
							break;
						case 'addPaymentInfo':
							UtmifyCheckoutEvents.addPaymentInfo(value);
							break;
						case 'clickedPurchase':
							UtmifyCheckoutEvents.initiateCheckout(contentId, value);
							break;
						case 'purchaseCompleted':
							UtmifyCheckoutEvents.purchase(data?.orderId ?? '', contentId, value);
							break;
					}
				}
			}

			// Otimizey
			if (supportsOtimizey && tracking?.otimizey?.enabled) {
				const otmEvents = tracking.otimizey.events;
				if (isEventEnabled(otmEvents, event)) {
					switch (event) {
						case 'pageEntered':
							OtimizeyCheckoutEvents.pageView();
							break;
						case 'contentLoaded':
							OtimizeyCheckoutEvents.viewContent(contentId, contentName, value);
							break;
						case 'initiateCheckout':
							OtimizeyCheckoutEvents.initiateCheckout(contentId, value);
							break;
						case 'addPaymentInfo':
							OtimizeyCheckoutEvents.addPaymentInfo(value);
							break;
						case 'clickedPurchase':
							OtimizeyCheckoutEvents.initiateCheckout(contentId, value);
							break;
						case 'purchaseCompleted':
							OtimizeyCheckoutEvents.purchase(data?.orderId ?? '', contentId, value);
							break;
					}
				}
			}
		},
		[
			productData,
			tracking,
			taboolaEvents,
			supportsFacebookPixel,
			supportsGoogleTagManager,
			supportsTikTok,
			supportsKwai,
			supportsPinterest,
			supportsUtmify,
			supportsOtimizey,
		]
	);

	// Fire pageEntered event on mount
	useEffect(() => {
		trackEvent('pageEntered');
	}, [trackEvent]);

	const contextValue = useMemo(
		() => ({
			trackEvent,
			settings: tracking ?? null,
		}),
		[tracking, trackEvent]
	);

	return (
		<TrackingContext.Provider value={contextValue}>
			{/* Clarity */}
			{supportsClarity && tracking?.clarity?.enabled && tracking.clarity.projectId && (
				<Clarity projectId={tracking.clarity.projectId} />
			)}

			{/* Facebook Pixel */}
			{supportsFacebookPixel && tracking?.facebookPixel?.enabled && tracking.facebookPixel.pixelId && (
				<FacebookPixel config={tracking.facebookPixel} />
			)}

			{/* Google Tag Manager */}
			{supportsGoogleTagManager && tracking?.googleTagManager?.enabled && tracking.googleTagManager.containerId && (
				<GoogleTagManager containerId={tracking.googleTagManager.containerId} />
			)}

			{/* TikTok */}
			{supportsTikTok && tracking?.tikTok?.enabled && tracking.tikTok.pixelId && (
				<TikTokPixel config={tracking.tikTok} />
			)}

			{/* Kwai */}
			{supportsKwai && tracking?.kwai?.enabled && tracking.kwai.pixelId && (
				<KwaiPixel pixelId={tracking.kwai.pixelId} />
			)}

			{/* Pinterest */}
			{supportsPinterest && tracking?.pinterest?.enabled && tracking.pinterest.tagId && (
				<PinterestTag tagId={tracking.pinterest.tagId} />
			)}

			{/* Taboola */}
			{supportsTaboola && tracking?.taboola?.enabled && tracking.taboola.accountId && (
				<TaboolaPixel accountId={tracking.taboola.accountId} />
			)}

			{/* Utmify */}
			{supportsUtmify && tracking?.utmify?.enabled && tracking.utmify.pixelId && (
				<Utmify pixelId={tracking.utmify.pixelId} />
			)}

			{/* Otimizey */}
			{supportsOtimizey && tracking?.otimizey?.enabled && tracking.otimizey.pixelId && (
				<Otimizey pixelId={tracking.otimizey.pixelId} />
			)}

			{children}
		</TrackingContext.Provider>
	);
}

export function useTracking() {
	const context = useContext(TrackingContext);
	if (!context) {
		throw new Error('useTracking must be used within a TrackingProvider');
	}
	return context;
}

// Export a no-op version for use outside provider
export function useTrackingOptional() {
	const context = useContext(TrackingContext);
	return (
		context ?? {
			trackEvent: () => {},
			settings: null,
		}
	);
}
