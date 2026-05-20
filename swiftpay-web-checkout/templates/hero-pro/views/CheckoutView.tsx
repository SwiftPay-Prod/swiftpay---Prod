'use client';

import type { FormErrors, PaymentMethod, ThemeMode } from '../types';
import type { CalculatedCheckout, CheckoutProduct, ValidatedCoupon, ReservedOrderItemData } from '@/types/checkout';
import type { GroupedProduct } from '@/hooks';
import { IdentificationSection, DeliverySection, PaymentSection } from '../sections';
import { OrderSummary } from '../components/OrderSummary';

interface CheckoutViewProps {
	primaryColor: string;
	secondaryColor: string | null;
	products: CheckoutProduct[];
	groupedProducts: GroupedProduct[];
	onSelectVariant: (productId: string, variantId: string | null) => void;
	requireCustomerDocument: boolean;
	requireCustomerPhone: boolean;
	requireCustomerAddress: boolean;
	isReserving: boolean;
	reservationRemainingSeconds: number;
	name: string;
	email: string;
	cpf: string;
	phone: string;
	cep: string;
	street: string;
	number: string;
	complement: string;
	neighborhood: string;
	city: string;
	state: string;
	onNameChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onCpfChange: (value: string) => void;
	onPhoneChange: (value: string) => void;
	onCepChange: (value: string) => void;
	onStreetChange: (value: string) => void;
	onNumberChange: (value: string) => void;
	onComplementChange: (value: string) => void;
	onNeighborhoodChange: (value: string) => void;
	onCityChange: (value: string) => void;
	onStateChange: (value: string) => void;
	paymentMethod: PaymentMethod | null;
	onPaymentMethodChange: (value: PaymentMethod | null) => void;
	cardNumber: string;
	cardName: string;
	cardExpiry: string;
	cardCvc: string;
	installments: string;
	onCardNumberChange: (value: string) => void;
	onCardNameChange: (value: string) => void;
	onCardExpiryChange: (value: string) => void;
	onCardCvcChange: (value: string) => void;
	onInstallmentsChange: (value: string) => void;
	errors: FormErrors;
	productPrice: number;
	pixEnabled: boolean;
	creditCardEnabled: boolean;
	boletoEnabled: boolean;
	onSubmit: () => void;
	isSubmitting: boolean;
	isFormComplete: boolean;
	couponEnabled: boolean;
	appliedCoupon: ValidatedCoupon | null;
	couponCode: string;
	onCouponCodeChange: (value: string) => void;
	onApplyCoupon: () => void;
	onRemoveCoupon: () => void;
	isApplyingCoupon: boolean;
	couponError: string | null;
	discountedProduct: CheckoutProduct | null;
	submitError: string | null;
	calculation: CalculatedCheckout | null;
	isCalculating: boolean;
	reservationItems?: ReservedOrderItemData[] | null;
	theme: ThemeMode;
	onToggleTheme: () => void;
	reservationError: string | null;
	onResetReservation: () => void;
}

export function CheckoutView({
	primaryColor,
	secondaryColor,
	products,
	groupedProducts,
	onSelectVariant,
	requireCustomerDocument,
	requireCustomerPhone,
	requireCustomerAddress,
	name,
	email,
	cpf,
	phone,
	cep,
	street,
	number,
	complement,
	neighborhood,
	city,
	state,
	onNameChange,
	onEmailChange,
	onCpfChange,
	onPhoneChange,
	onCepChange,
	onStreetChange,
	onNumberChange,
	onComplementChange,
	onNeighborhoodChange,
	onCityChange,
	onStateChange,
	paymentMethod,
	onPaymentMethodChange,
	cardNumber,
	cardName,
	cardExpiry,
	cardCvc,
	installments,
	onCardNumberChange,
	onCardNameChange,
	onCardExpiryChange,
	onCardCvcChange,
	onInstallmentsChange,
	errors,
	productPrice,
	pixEnabled,
	creditCardEnabled,
	boletoEnabled,
	onSubmit,
	isSubmitting,
	isFormComplete,
	couponEnabled,
	appliedCoupon,
	couponCode,
	onCouponCodeChange,
	onApplyCoupon,
	onRemoveCoupon,
	isApplyingCoupon,
	couponError,
	discountedProduct,
	submitError,
	calculation,
	isCalculating,
	reservationItems,
	reservationError,
	onResetReservation,
	isReserving,
	reservationRemainingSeconds,
}: CheckoutViewProps) {
	return (
		<>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
			<div className="lg:col-span-7 space-y-6">
					<IdentificationSection
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						requireCustomerDocument={requireCustomerDocument}
						requireCustomerPhone={requireCustomerPhone}
						name={name}
						email={email}
						cpf={cpf}
						phone={phone}
						onNameChange={onNameChange}
						onEmailChange={onEmailChange}
						onCpfChange={onCpfChange}
						onPhoneChange={onPhoneChange}
						errors={errors}
					/>

					{requireCustomerAddress && (
						<DeliverySection
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							cep={cep}
							street={street}
							number={number}
							complement={complement}
							neighborhood={neighborhood}
							city={city}
							state={state}
							onCepChange={onCepChange}
							onStreetChange={onStreetChange}
							onNumberChange={onNumberChange}
							onComplementChange={onComplementChange}
							onNeighborhoodChange={onNeighborhoodChange}
							onCityChange={onCityChange}
							onStateChange={onStateChange}
							errors={errors}
						/>
					)}

					<PaymentSection
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						paymentMethod={paymentMethod}
						onPaymentMethodChange={onPaymentMethodChange}
						cardNumber={cardNumber}
						cardName={cardName}
						cardExpiry={cardExpiry}
						cardCvc={cardCvc}
						installments={installments}
						onCardNumberChange={onCardNumberChange}
						onCardNameChange={onCardNameChange}
						onCardExpiryChange={onCardExpiryChange}
						onCardCvcChange={onCardCvcChange}
						onInstallmentsChange={onInstallmentsChange}
						errors={errors}
						productPrice={productPrice}
						pixEnabled={pixEnabled}
						creditCardEnabled={creditCardEnabled}
						boletoEnabled={boletoEnabled}
					/>
				</div>

				<div className="lg:col-span-5">
					<OrderSummary
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						products={products}
						groupedProducts={groupedProducts}
						onSelectVariant={onSelectVariant}
						onSubmit={onSubmit}
						isSubmitting={isSubmitting}
						isFormComplete={isFormComplete}
						couponEnabled={couponEnabled}
						appliedCoupon={appliedCoupon}
						couponCode={couponCode}
						onCouponCodeChange={onCouponCodeChange}
						onApplyCoupon={onApplyCoupon}
						onRemoveCoupon={onRemoveCoupon}
						isApplyingCoupon={isApplyingCoupon}
						couponError={couponError}
						discountedProduct={discountedProduct}
						submitError={submitError}
						calculation={calculation}
						isCalculating={isCalculating}
						reservationItems={reservationItems}
						reservationError={reservationError}
						onResetReservation={onResetReservation}
						isReserving={isReserving}
						reservationRemainingSeconds={reservationRemainingSeconds}
					/>
				</div>
			</div>
		</>
	);
}
