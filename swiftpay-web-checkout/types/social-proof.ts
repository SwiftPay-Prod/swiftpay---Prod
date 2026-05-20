/**
 * Types for Social Proof Notifications feature.
 * This feature displays simulated purchase notifications to create urgency.
 */

/**
 * Position of the social proof notification on screen.
 */
export type SocialProofPosition = 'BottomLeft' | 'BottomRight' | 'TopLeft' | 'TopRight';

/**
 * A single notification message configuration.
 */
export interface SocialProofNotification {
  /** Customer name (e.g., "Carlos S.") */
  name: string;
  /** Location (e.g., "São Paulo, SP") */
  location: string;
  /** Action text (e.g., "acabou de comprar") */
  action: string;
}

/**
 * Social Proof feature configuration.
 * Stored in CheckoutConfig and used by templates that support this feature.
 */
export interface SocialProofConfig {
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Interval between notifications in seconds (default: 8) */
  intervalSeconds: number;
  /** How long each notification stays visible in seconds (default: 4) */
  durationSeconds: number;
  /** Position on screen (default: BottomLeft) */
  position: SocialProofPosition;
  /** List of notification messages to cycle through */
  notifications: SocialProofNotification[];
}

/**
 * Default configuration for Social Proof feature.
 */
export const DEFAULT_SOCIAL_PROOF_CONFIG: SocialProofConfig = {
  enabled: false,
  intervalSeconds: 8,
  durationSeconds: 4,
  position: 'BottomLeft',
  notifications: [],
};

/**
 * Default notification messages (used as examples).
 */
export const DEFAULT_SOCIAL_PROOF_NOTIFICATIONS: SocialProofNotification[] = [
  { name: 'Carlos S.', location: 'São Paulo, SP', action: 'acabou de comprar' },
  { name: 'Mariana L.', location: 'Curitiba, PR', action: 'adquiriu o produto' },
  { name: 'Roberto M.', location: 'Belo Horizonte, MG', action: 'acabou de comprar' },
  { name: 'Fernanda G.', location: 'Rio de Janeiro, RJ', action: 'finalizou a compra' },
  { name: 'Juliana K.', location: 'Salvador, BA', action: 'acabou de comprar' },
];
