export type LiveBalanceBackgroundId =
  | 'gradient'
  | 'fireflies'
  | 'neural-flow'
  | 'cyber-grid'
  | 'celestial-ink'
  | 'cosmic-pulse'
  | 'starfield-burst'
  | 'lamp-glow'
  | 'firestorm'
  | 'etheral-shadow'
  | 'spooky-smoke'
  | 'gold-dynasty'
  | 'rosso-velocity'
  | 'beach-escape';

export interface LiveBalanceBackgroundProps {
  className?: string;
}

export interface LiveBalanceBackgroundOption {
  id: LiveBalanceBackgroundId;
  label: string;
}

export const LIVE_BALANCE_BACKGROUND_OPTIONS: LiveBalanceBackgroundOption[] = [
  { id: 'gradient', label: 'Pulse Gradient' },
  { id: 'fireflies', label: 'Fireflies' },
  { id: 'neural-flow', label: 'Neural Flow' },
  { id: 'cyber-grid', label: 'Cyber Grid' },
  { id: 'celestial-ink', label: 'Celestial Ink' },
  { id: 'cosmic-pulse', label: 'Cosmic Pulse' },
  { id: 'starfield-burst', label: 'Starfield Burst' },
  { id: 'lamp-glow', label: 'Lamp Glow' },
  { id: 'firestorm', label: 'Firestorm' },
  { id: 'etheral-shadow', label: 'Etheral Shadow' },
  { id: 'spooky-smoke', label: 'Spooky Smoke' },
  { id: 'gold-dynasty', label: 'Gold Dynasty' },
  { id: 'rosso-velocity', label: 'Rosso Velocity' },
  { id: 'beach-escape', label: 'Beach Escape' },
];
