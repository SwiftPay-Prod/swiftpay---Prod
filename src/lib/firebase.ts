import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  getIdToken,
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
export type { FirebaseUser };

import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
 import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const messagingFirebaseConfig = {
  apiKey: "AIzaSyAsu8suCX_tCN5CB_DgtyPDjz6jIX7q1x0",
  authDomain: "swiftpaya405c.firebaseapp.com",
  projectId: "swiftpaya405c",
  storageBucket: "swiftpaya405c.firebasestorage.app",
  messagingSenderId: "741958846185",
  appId: "1:741958846185:web:8348a6128a085dc29a9278"
};

const authFirebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_AUTH_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID,
};

let app: FirebaseApp | null = null;
let authApp: FirebaseApp | null = null;
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
    app = existingApp ?? initializeApp(messagingFirebaseConfig);
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

const AUTH_APP_NAME = 'swiftpay-auth';

function getFirebaseAuthApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be initialized on the client side');
  }

  if (!authFirebaseConfig.apiKey || !authFirebaseConfig.authDomain || !authFirebaseConfig.projectId) {
    throw new Error('Firebase Auth não está configurado para este ambiente.');
  }

  if (!authApp) {
    const existingApp = getApps().find((candidate) => candidate.name === AUTH_APP_NAME);
    authApp = existingApp ?? initializeApp(authFirebaseConfig, AUTH_APP_NAME);
  }

  return authApp;
}

let auth: ReturnType<typeof getAuth> | null = null;

export function getFirebaseAuth() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be used on the client side');
  }

  if (!auth) {
    auth = getAuth(getFirebaseAuthApp());
  }

  return auth;
}

export async function signInWithFirebaseEmail(email: string, password: string) {
  const authInstance = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(authInstance, email, password);
  return credential.user;
}

export async function signInWithFirebaseGoogle() {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(authInstance, provider);
  return credential.user;
}

interface PlatformAuthResponse {
  error?: {
    code?: string;
    message?: string;
  } | null;
}

interface PlatformAuthRequestResult {
  response: Response;
  data: PlatformAuthResponse;
}

export interface GooglePlatformAuthOptions {
  deviceId?: string;
  refCode?: string;
}

export interface GooglePlatformAuthResult {
  isNewAccount: boolean;
}

async function requestPlatformAuth(path: '/api/auth/firebase-signin' | '/api/auth/firebase-signup', body: Record<string, string | undefined>): Promise<PlatformAuthRequestResult> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json() as PlatformAuthResponse;
  return { response, data };
}

export async function signInOrCreatePlatformUserWithGoogle({
  deviceId,
  refCode,
}: GooglePlatformAuthOptions = {}): Promise<GooglePlatformAuthResult> {
  const firebaseUser = await signInWithFirebaseGoogle();
  const idToken = await getFirebaseIdToken(firebaseUser, false);
  const signInResult = await requestPlatformAuth('/api/auth/firebase-signin', {
    idToken,
    deviceId,
  });

  if (signInResult.response.ok) {
    return { isNewAccount: false };
  }

  if (signInResult.data.error?.code !== 'USER_NOT_FOUND') {
    throw new Error(signInResult.data.error?.message || 'Erro ao autenticar com o Google');
  }

  const name = firebaseUser.displayName?.trim() || firebaseUser.email?.split('@')[0]?.trim();
  if (!name) {
    throw new Error('Sua conta Google não informou um nome válido.');
  }

  const signUpResult = await requestPlatformAuth('/api/auth/firebase-signup', {
    idToken,
    name,
    deviceId,
    refCode,
  });

  if (signUpResult.response.ok) {
    return { isNewAccount: true };
  }

  if (signUpResult.data.error?.code === 'USER_ALREADY_EXISTS') {
    const retrySignInResult = await requestPlatformAuth('/api/auth/firebase-signin', {
      idToken,
      deviceId,
    });
    if (retrySignInResult.response.ok) {
      return { isNewAccount: false };
    }
    throw new Error(retrySignInResult.data.error?.message || 'Erro ao autenticar com o Google');
  }

  throw new Error(signUpResult.data.error?.message || 'Erro ao criar conta com o Google');
}

export async function createFirebaseUser(email: string, password: string) {
  const authInstance = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(authInstance, email, password);
  return credential.user;
}

export async function sendFirebaseEmailVerification(user: FirebaseUser) {
  await sendEmailVerification(user);
}

export async function getFirebaseIdToken(user: FirebaseUser, forceRefresh = false) {
  return await getIdToken(user, forceRefresh);
}

export function onFirebaseAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  const authInstance = getFirebaseAuth();
  return onAuthStateChanged(authInstance, callback);
}

export async function signOutFirebase() {
  const authInstance = getFirebaseAuth();
  await signOut(authInstance);
}

export async function sendFirebasePasswordReset(email: string) {
  const authInstance = getFirebaseAuth();
  await sendPasswordResetEmail(authInstance, email);
}
