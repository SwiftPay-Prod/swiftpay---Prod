// Re-export from shared types
export type {
	ProductType,
	CheckoutColorMode,
	SocialProofPosition,
	PaymentMethod,
	PaymentStatus,
	ThemeMode,
	CardBrand,
	PixKeyType,
} from '@/types/enums';

export type CheckoutView = 'checkout' | 'pix_result' | 'success';

export interface SocialNotification {
	name: string;
	location: string;
	action: string;
}

export interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
	cpf?: string;
	cep?: string;
	street?: string;
	number?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	paymentMethod?: string;
	cardNumber?: string;
	cardName?: string;
	cardExpiry?: string;
	cardCvc?: string;
	installments?: string;
}
