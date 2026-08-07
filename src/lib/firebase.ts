import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAsu8suCX_tCN5CB_DgtyPDjz6jIX7q1x0",
  authDomain: "swiftpaya405c.firebaseapp.com",
  projectId: "swiftpaya405c",
  storageBucket: "swiftpaya405c.firebasestorage.app",
  messagingSenderId: "741958846185",
  appId: "1:741958846185:web:8348a6128a085dc29a9278"
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function isIOSPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  return isIOS && (isStandalone || isDisplayModeStandalone);
}

export function isAndroidPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isAndroid = /Android/.test(navigator.userAgent);
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  return isAndroid && isDisplayModeStandalone;
}

export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  if (!('PushManager' in window)) return false;
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone && !isDisplayModeStandalone) {
      return false;
    }
  }
  
  return true;
}

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side');
  }

  if (!app) {
    const apps = getApps();
    const existingApp = apps.length > 0 ? apps[0] : null;
    app = existingApp ?? initializeApp(firebaseConfig);
  }
  
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!isPushNotificationSupported()) {
    console.warn('Push notifications not supported on this device/browser');
    return null;
  }

  if (!messaging) {
    try {
      const firebaseApp = getFirebaseApp();
      messaging = getMessaging(firebaseApp);
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
      return null;
    }
  }

  return messaging;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return await Notification.requestPermission();
}

export interface FCMTokenResult {
  token: string | null;
  error: string | null;
}

export async function getFCMToken(): Promise<FCMTokenResult> {
  try {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      return { token: null, error: `Permissão negada: ${permission}` };
    }

    const fcmMessaging = getFirebaseMessaging();
    if (!fcmMessaging) {
      return { token: null, error: 'Não foi possível inicializar o Firebase Messaging' };
    }

    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch (swError) {
      return { token: null, error: `Falha ao registrar service worker: ${swError}` };
    }

    await navigator.serviceWorker.ready;

    try {
      const token = await getToken(fcmMessaging, {
        vapidKey: 'BL-IzwALoxd1M5gdjtOAjeRnzF4vGeHtJfW3JM1--iXKy-epCd77KHW5rJTBdQ4FnSk1K7onWM5gu9rQ71ePxyI',
        serviceWorkerRegistration: registration,
      });

      if (token) {
        return { token, error: null };
      }

      return { token: null, error: 'Firebase não retornou um token' };
    } catch (tokenError) {
      const errorMsg = tokenError instanceof Error ? tokenError.message : String(tokenError);
      
      if (errorMsg.includes('applicationServerKey') || errorMsg.includes('p-256')) {
        return { 
          token: null, 
          error: 'Chave VAPID inválida. Entre em contato com o suporte.' 
        };
      }
      
      return { token: null, error: `Erro ao obter token: ${errorMsg}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { token: null, error: errorMessage };
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void): (() => void) | null {
  const fcmMessaging = getFirebaseMessaging();
  if (!fcmMessaging) {
    return null;
  }

  return onMessage(fcmMessaging, callback);
}

