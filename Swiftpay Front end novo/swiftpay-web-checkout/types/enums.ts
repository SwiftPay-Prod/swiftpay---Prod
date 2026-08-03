// Enums matching swiftpay-api-core models

export type ProductType = 'Physical' | 'Digital' | 'Service';

export type CheckoutColorMode = 'Single' | 'Gradient';

export type SocialProofPosition = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';

// Payment enums (shared between templates)
export type PaymentMethod = 'Pix' | 'CreditCard' | 'Boleto';

export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Confirming'
  | 'Completed'
  | 'Cancelled'
  | 'Expired'
  | 'Failed'
  | 'Refunded'
  | 'PartiallyRefunded';

// Theme mode
export type ThemeMode = 'light' | 'dark' | 'auto';

// Card brands
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'discover' | 'hipercard' | 'default' | 'unknown';

// PIX Key types
export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';