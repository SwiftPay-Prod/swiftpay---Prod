'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ThemeMode, PaymentMethod, CheckoutView as CheckoutViewType, FormErrors } from './types';
import { NOTIFICATIONS } from './constants';
import { TemplateLayout } from './components';
import { CheckoutView, PixResultView, SuccessView } from './views';
import { useCheckoutCalculation, usePaymentStatusHub, useGroupedProducts } from '@/hooks';
import type {
	CheckoutData,
	ValidatedCoupon,
	CheckoutProduct,
	OrderData,
	GetOrderData,
	PaymentStatus,
	CalculatedCheckout,
} from '@/types/checkout';
import { validateCouponClient, createOrderClient, getOrderClient } from '@/clients/checkout-api';
import { useTrackingOptional } from '@/components/tracking';
import './theme.css';

interface HeroProTemplateProps {
	checkout: CheckoutData;
	isSandbox?: boolean;
	initialCalculation?: CalculatedCheckout | null;
}

function mapGetOrderData(data: GetOrderData): OrderData | null {
	// Only map to OrderData if payment exists
	if (!data.paymentId || !data.method || !data.currency || !data.status || !data.environment || !data.createdAt) {
		return null;
	}

	return {
		orderId: data.orderId,
		orderNumber: data.orderNumber,
		paymentId: data.paymentId,
		externalId: data.externalId ?? null,
		method: data.method,
		amount: data.amount,
		fee: 0,
		netAmount: data.amount,
		currency: data.currency,
		status: data.status,
		description: data.description ?? null,
		environment: data.environment,
		expiresAt: data.expiresAt ?? null,
		createdAt: data.createdAt,
		completedAt: data.completedAt ?? null,
		customerId: data.customerId ?? null,
		pix: data.pix ?? null,
	};
}

function getFirstActivePaymentMethod(options: {
	pixEnabled: boolean;
	creditCardEnabled: boolean;
	boletoEnabled: boolean;
}): PaymentMethod | null {
	if (options.pixEnabled) {
		return 'Pix';
	}

	if (options.creditCardEnabled) {
		return 'CreditCard';
	}

	if (options.boletoEnabled) {
		return 'Boleto';
	}

	return null;
}

export function HeroProTemplate({ checkout, isSandbox = false, initialCalculation }: HeroProTemplateProps) {
	const { config, products } = checkout;
	const tracking = useTrackingOptional();
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	// Group products by productId and manage variant selection
	const { groupedProducts, selectedProducts, selectVariant } = useGroupedProducts(products);

	// Check for existing orderId in URL (only on initial load)
	const [initialUrlOrderId] = useState(() => searchParams.get('orderId'));
	const [isRecoveringOrder, setIsRecoveringOrder] = useState(!!initialUrlOrderId);

	const primaryColor = config.primaryColor || '#171717';
	const secondaryColor = config.secondaryColor || null;
	const colorMode = config.colorMode ?? (secondaryColor ? 'Gradient' : 'Single');
	const effectiveSecondaryColor = colorMode === 'Gradient' ? secondaryColor : null;

	const productPrice = selectedProducts.reduce((acc, p) => acc + p.price * p.quantity, 0);
	const productNames = selectedProducts.map((p) => p.name).join(', ');

	const showTimer = config.showTimer ?? false;
	const timerMinutes = config.timerMinutes ?? 10;
	const timerText = config.timerText ?? null;
	const timerExpiredText = config.timerExpiredText ?? null;

	const pixEnabled = config.pixEnabled ?? true;
	const creditCardEnabled = config.creditCardEnabled ?? true;
	const boletoEnabled = config.boletoEnabled ?? true;
	const firstActivePaymentMethod = useMemo(
		() => getFirstActivePaymentMethod({ pixEnabled, creditCardEnabled, boletoEnabled }),
		[pixEnabled, creditCardEnabled, boletoEnabled]
	);

	const socialProofEnabled = checkout.template.supportsSocialProof && (config.socialProof?.enabled ?? false);
	const socialProofNotifications = config.socialProof?.notifications?.length
		? config.socialProof.notifications
		: NOTIFICATIONS;
	const socialProofIntervalSeconds = config.socialProof?.intervalSeconds ?? 8;
	const socialProofDurationSeconds = config.socialProof?.durationSeconds ?? 4;
	const socialProofPosition = config.socialProof?.position ?? 'BottomLeft';

	const [view, setView] = useState<CheckoutViewType>(initialUrlOrderId ? 'pix_result' : 'checkout');
	const [theme, setTheme] = useState<ThemeMode>('dark');
	const [orderData, setOrderData] = useState<OrderData | null>(null);
	const orderDataRef = useRef<OrderData | null>(null);
	const paymentApiUrl = process.env.NEXT_PUBLIC_SWIFTPAY_API_PAYMENT_URL ?? null;

	useEffect(() => {
		orderDataRef.current = orderData;
	}, [orderData]);

	const handleCancel = useCallback(() => {
		if (config.cancelUrl) {
			window.location.assign(config.cancelUrl);
			return;
		}

		setView('checkout');
	}, [config.cancelUrl]);

	const handleNewPurchase = useCallback(() => {
		setOrderData(null);
		setName('');
		setEmail('');
		setCpf('');
		setPhone('');
		setCep('');
		setStreet('');
		setNumber('');
		setComplement('');
		setNeighborhood('');
		setCity('');
		setState('');
		setPaymentMethod(firstActivePaymentMethod);
		setCardNumber('');
		setCardName('');
		setCardExpiry('');
		setCardCvc('');
		setInstallments('1');
		setErrors({});
		setIsSubmitting(false);
		setCouponCode('');
		setAppliedCoupon(null);
		setCouponError(null);
		setIsApplyingCoupon(false);
		setSubmitError(null);
		setView('checkout');
		router.replace(pathname, { scroll: false });
	}, [router, pathname, firstActivePaymentMethod]);

	// Track initial page view (ViewContent + initiateCheckout)
	useEffect(() => {
		if (tracking) {
			const trackingData: Parameters<typeof tracking.trackEvent>[1] = {
				value: productPrice / 100,
				currency: 'BRL',
				content_name: productNames,
				content_ids: selectedProducts.map((p) => p.productId),
				contents: selectedProducts.map((p) => ({
					id: p.productId,
					quantity: p.quantity,
					item_price: p.price / 100,
				})),
			};
			tracking.trackEvent('contentLoaded', trackingData);
			tracking.trackEvent('initiateCheckout', trackingData);
		}
	}, [tracking, productPrice, productNames, selectedProducts]);

	// Set theme-color meta tag for mobile status bar
	useEffect(() => {
		let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
		const previousContent = themeColorMeta?.getAttribute('content');
		let createdByTemplate = false;

		if (!themeColorMeta) {
			themeColorMeta = document.createElement('meta');
			themeColorMeta.name = 'theme-color';
			themeColorMeta.setAttribute('data-owner', 'hero-pro-template');
			document.head.appendChild(themeColorMeta);
			createdByTemplate = true;
		}

		themeColorMeta.setAttribute('content', primaryColor);

		return () => {
			if (!themeColorMeta) {
				return;
			}

			if (createdByTemplate) {
				if (themeColorMeta.isConnected && themeColorMeta.parentNode) {
					themeColorMeta.parentNode.removeChild(themeColorMeta);
				}
				return;
			}

			if (previousContent == null) {
				themeColorMeta.removeAttribute('content');
				return;
			}

			themeColorMeta.setAttribute('content', previousContent);
		};
	}, [primaryColor]);

	// Auto-detect system theme preference
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		setTheme(mediaQuery.matches ? 'dark' : 'light');

		const handleChange = (e: MediaQueryListEvent) => {
			setTheme(e.matches ? 'dark' : 'light');
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	const handlePaymentStatusChanged = useCallback(
		async ({ paymentId }: { paymentId: string; status: PaymentStatus }) => {
			if (!orderData || paymentId !== orderData.paymentId) return;

			const response = await getOrderClient(checkout.shortId, orderData.orderId);
			if (response.data) {
				const updatedOrder = mapGetOrderData(response.data);
				if (!updatedOrder) return;

				setOrderData(updatedOrder);

				if (updatedOrder.status === 'Completed') {
					setView('success');
				}
			}
		},
		[checkout.shortId, orderData]
	);

	usePaymentStatusHub({
		apiUrl: paymentApiUrl,
		paymentId: orderData?.paymentId ?? null,
		onStatusChanged: handlePaymentStatusChanged,
	});

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [cpf, setCpf] = useState('');
	const [phone, setPhone] = useState('');

	const [cep, setCep] = useState('');
	const [street, setStreet] = useState('');
	const [number, setNumber] = useState('');
	const [complement, setComplement] = useState('');
	const [neighborhood, setNeighborhood] = useState('');
	const [city, setCity] = useState('');
	const [state, setState] = useState('');

	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(firstActivePaymentMethod);
	const [cardNumber, setCardNumber] = useState('');
	const [cardName, setCardName] = useState('');
	const [cardExpiry, setCardExpiry] = useState('');
	const [cardCvc, setCardCvc] = useState('');
	const [installments, setInstallments] = useState('1');

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	// Coupon state
	const couponEnabled = config.couponEnabled ?? false;
	const [couponCode, setCouponCode] = useState('');
	const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);
	const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
	const [couponError, setCouponError] = useState<string | null>(null);

	useEffect(() => {
		if (paymentMethod === 'Pix' && pixEnabled) {
			return;
		}

		if (paymentMethod === 'CreditCard' && creditCardEnabled) {
			return;
		}

		if (paymentMethod === 'Boleto' && boletoEnabled) {
			return;
		}

		setPaymentMethod(firstActivePaymentMethod);
	}, [paymentMethod, pixEnabled, creditCardEnabled, boletoEnabled, firstActivePaymentMethod]);

	// Helper to populate form fields from order customer data
	const populateFormFromOrder = useCallback((orderResponse: GetOrderData) => {
		if (orderResponse.customer) {
			setName(orderResponse.customer.name ?? '');
			setEmail(orderResponse.customer.email ?? '');
			setPhone(orderResponse.customer.phone ?? '');
			setCpf(orderResponse.customer.document ?? '');
		}
		if (orderResponse.shippingAddress) {
			setCep(orderResponse.shippingAddress.zipCode ?? '');
			setStreet(orderResponse.shippingAddress.street ?? '');
			setNumber(orderResponse.shippingAddress.number ?? '');
			setComplement(orderResponse.shippingAddress.complement ?? '');
			setNeighborhood(orderResponse.shippingAddress.neighborhood ?? '');
			setCity(orderResponse.shippingAddress.city ?? '');
			setState(orderResponse.shippingAddress.state ?? '');
		}
		if (orderResponse.couponCode) {
			setCouponCode(orderResponse.couponCode);
		}
		// Use selectedPaymentMethod (from Order) with fallback to method (from Payment)
		const savedMethod = orderResponse.selectedPaymentMethod ?? orderResponse.method;
		if (savedMethod) {
			setPaymentMethod(savedMethod);
		}
	}, []);

	// Recover order state from URL if orderId is present (only on initial load)
	useEffect(() => {
		if (!initialUrlOrderId) return;

		const recoverOrder = async () => {
			try {
				const response = await getOrderClient(checkout.shortId, initialUrlOrderId);
				if (response.data) {
					// Populate form fields from order customer data
					populateFormFromOrder(response.data);

					const recoveredOrder = mapGetOrderData(response.data);
					if (!recoveredOrder) {
						// Order exists but payment cannot be rendered
						setView('checkout');
						router.replace(pathname, { scroll: false });
						return;
					}

					setOrderData(recoveredOrder);

					// Set appropriate view based on payment status and method
					if (recoveredOrder.status === 'Completed') {
						setView('success');
					} else if (recoveredOrder.method === 'Pix' && recoveredOrder.pix) {
						setView('pix_result');
					} else {
						setView('checkout');
						// Clear orderId from URL if payment cannot be shown
						router.replace(pathname, { scroll: false });
					}
				} else {
					// Order not found, clear URL
					router.replace(pathname, { scroll: false });
					setView('checkout');
				}
			} catch {
				router.replace(pathname, { scroll: false });
				setView('checkout');
			} finally {
				setIsRecoveringOrder(false);
			}
		};

		recoverOrder();
	}, [initialUrlOrderId, checkout.shortId, router, pathname, populateFormFromOrder]);

	// Use backend calculation for checkout values
	const {
		calculation,
		isCalculating,
	} = useCheckoutCalculation({
		checkoutShortId: checkout.shortId,
		products: selectedProducts,
		couponCode: appliedCoupon?.code ?? null,
		initialCalculation: initialCalculation ?? null,
	});

	const discountAmount = calculation?.discount ?? 0;


	// Calculate which product gets the discount (for Product scope coupons)
	const discountedProduct = useMemo(() => {
		if (!appliedCoupon || appliedCoupon.scope !== 'Product' || selectedProducts.length === 0) {
			return null;
		}

		// Find the eligible product with highest value
		const eligibleProducts = selectedProducts.filter((p) => {
			// If no applicableProductIds, all products are eligible
			if (!appliedCoupon.applicableProductIds || appliedCoupon.applicableProductIds.length === 0) {
				return true;
			}
			return appliedCoupon.applicableProductIds.includes(p.productId);
		});

		if (eligibleProducts.length === 0) return null;

		// Get the most expensive eligible product
		return eligibleProducts.reduce(
			(best, product) => {
				const productTotal = product.price * product.quantity;
				const bestTotal = best ? best.price * best.quantity : 0;
				return productTotal > bestTotal ? product : best;
			},
			null as CheckoutProduct | null
		);
	}, [appliedCoupon, selectedProducts]);

	const handleApplyCoupon = useCallback(async () => {
		if (!couponCode.trim()) return;

		setIsApplyingCoupon(true);
		setCouponError(null);

		try {
			const response = await validateCouponClient(checkout.shortId, couponCode.trim());
			if (response.error) {
				setCouponError(response.error.message);
			} else if (response.data) {
				// Validate minimum order amount
				if (response.data.minOrderAmount && productPrice < response.data.minOrderAmount) {
					const minAmountFormatted = (response.data.minOrderAmount / 100).toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					});
					setCouponError(`O valor mínimo do pedido para usar este cupom é ${minAmountFormatted}`);
					return;
				}
				setAppliedCoupon(response.data);
				setCouponCode('');
			}
		} catch {
			setCouponError('Erro ao validar cupom. Tente novamente.');
		} finally {
			setIsApplyingCoupon(false);
		}
	}, [couponCode, checkout.shortId, productPrice]);

	const handleRemoveCoupon = useCallback(() => {
		setAppliedCoupon(null);
		setCouponError(null);
	}, []);

	const isFormComplete = useMemo(() => {
		if (!name.trim() || !email.trim()) return false;
		if (config.requireCustomerDocument) {
			if (!cpf.trim() || cpf.replace(/\D/g, '').length !== 11) return false;
		}
		if (config.requireCustomerPhone) {
			if (!phone.trim()) return false;
		}
		if (config.requireCustomerAddress) {
			if (!cep.trim()) return false;
			if (!street.trim()) return false;
			if (!number.trim()) return false;
			if (!neighborhood.trim()) return false;
			if (!city.trim()) return false;
			if (!state.trim()) return false;
		}
		if (!paymentMethod) return false;
		if (paymentMethod === 'CreditCard') {
			if (!cardNumber.trim() || cardNumber.replace(/\D/g, '').length < 13) return false;
			if (!cardName.trim()) return false;
			if (!cardExpiry.trim()) return false;
			if (!cardCvc.trim()) return false;
			if (!installments.trim()) return false;
		}
		return true;
	}, [
		name,
		email,
		cpf,
		phone,
		config.requireCustomerAddress,
		cep,
		street,
		number,
		neighborhood,
		city,
		state,
		paymentMethod,
		cardNumber,
		cardName,
		cardExpiry,
		cardCvc,
		installments,
		config.requireCustomerDocument,
		config.requireCustomerPhone,
	]);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
	}, []);

	const validateForm = useCallback((): boolean => {
		const newErrors: FormErrors = {};

		if (!name.trim()) newErrors.name = 'Nome é obrigatório';
		if (!email.trim()) newErrors.email = 'E-mail é obrigatório';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'E-mail inválido';

		if (config.requireCustomerDocument) {
			if (!cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
			else if (cpf.replace(/\D/g, '').length !== 11) newErrors.cpf = 'CPF inválido';
		}

		if (config.requireCustomerPhone) {
			if (!phone.trim()) newErrors.phone = 'Telefone é obrigatório';
		}

		if (config.requireCustomerAddress) {
			if (!cep.trim()) newErrors.cep = 'CEP é obrigatório';
			if (!street.trim()) newErrors.street = 'Rua é obrigatória';
			if (!number.trim()) newErrors.number = 'Número é obrigatório';
			if (!neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
			if (!city.trim()) newErrors.city = 'Cidade é obrigatória';
			if (!state.trim()) newErrors.state = 'Estado é obrigatório';
		}

		if (!paymentMethod) {
			newErrors.paymentMethod = 'Selecione o método de pagamento';
		} else if (paymentMethod === 'CreditCard') {
			if (!cardNumber.trim()) newErrors.cardNumber = 'Número do cartão é obrigatório';
			else if (cardNumber.replace(/\D/g, '').length < 13) newErrors.cardNumber = 'Número do cartão inválido';
			if (!cardName.trim()) newErrors.cardName = 'Nome no cartão é obrigatório';
			if (!cardExpiry.trim()) newErrors.cardExpiry = 'Validade é obrigatória';
			if (!cardCvc.trim()) newErrors.cardCvc = 'CVC é obrigatório';
			if (!installments.trim()) newErrors.installments = 'Selecione as parcelas';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [
		name,
		email,
		cpf,
		phone,
		config.requireCustomerAddress,
		cep,
		street,
		number,
		neighborhood,
		city,
		state,
		paymentMethod,
		cardNumber,
		cardName,
		cardExpiry,
		cardCvc,
		installments,
		config.requireCustomerDocument,
		config.requireCustomerPhone,
	]);

	const handleSubmit = useCallback(async () => {
		if (!validateForm()) return;

		setIsSubmitting(true);
		setSubmitError(null);

		// Track addPaymentInfo event
		if (tracking && paymentMethod) {
			tracking.trackEvent('addPaymentInfo', {
				value: (productPrice - discountAmount) / 100,
				currency: 'BRL',
				content_name: productNames,
				content_ids: selectedProducts.map((p) => p.productId),
				contents: selectedProducts.map((p) => ({
					id: p.productId,
					quantity: p.quantity,
					item_price: p.price / 100,
				})),
			});
		}

		try {
			const response = await createOrderClient(checkout.shortId, {
				method: paymentMethod as 'Pix' | 'CreditCard' | 'Boleto',
				customer: {
					name: name.trim(),
					email: email.trim(),
					document: config.requireCustomerDocument ? cpf.replace(/\D/g, '') : null,
					phone: config.requireCustomerPhone ? phone.replace(/\D/g, '') : null,
				},
				address: config.requireCustomerAddress
					? {
							zipCode: cep.replace(/\D/g, ''),
							street: street.trim(),
							number: number.trim(),
							complement: complement.trim() || null,
							neighborhood: neighborhood.trim(),
							city: city.trim(),
							state: state.trim(),
						}
					: null,
				couponCode: appliedCoupon?.code ?? null,
				pixExpirationMinutes: null,
				orderId: null,
				items: selectedProducts.map((p) => ({
					productId: p.productId,
					quantity: p.quantity,
					variantId: p.variantId,
				})),
			});

			if (response.error) {
				setSubmitError(response.error.message);
				return;
			}

			if (!response.data) {
				setSubmitError('Erro ao criar pedido. Tente novamente.');
				return;
			}

			setOrderData(response.data);

			const newUrl = `${pathname}?orderId=${response.data.orderId}`;
			router.replace(newUrl, { scroll: false });

			// Track Purchase event on successful checkout
			if (tracking) {
				tracking.trackEvent('purchaseCompleted', {
					value: (productPrice - discountAmount) / 100,
					currency: 'BRL',
					content_name: productNames,
					content_ids: selectedProducts.map((p) => p.productId),
					contents: selectedProducts.map((p) => ({
						id: p.productId,
						quantity: p.quantity,
						item_price: p.price / 100,
					})),
				});
			}

			if (paymentMethod === 'Pix') {
				setView('pix_result');
			} else {
				setView('success');
			}
		} catch {
			setSubmitError('Erro ao processar pagamento. Tente novamente.');
		} finally {
			setIsSubmitting(false);
		}
	}, [
		validateForm,
		paymentMethod,
		tracking,
		productPrice,
		discountAmount,
		productNames,
		selectedProducts,
		checkout.shortId,
		name,
		email,
		cpf,
		phone,
		config.requireCustomerDocument,
		config.requireCustomerPhone,
		config.requireCustomerAddress,
		cep,
		street,
		number,
		complement,
		neighborhood,
		city,
		state,
		appliedCoupon,
		router,
		pathname,
	]);

	// Show loading state while recovering order from URL
	if (isRecoveringOrder) {
		return (
			<div data-theme={theme.toLowerCase()}>
				<div className="min-h-screen hero-bg hero-text flex items-center justify-center">
					<div className="flex flex-col items-center gap-4">
						<div
							className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
							style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
						/>
						<p className="hero-text-muted">Recuperando pedido...</p>
					</div>
				</div>
			</div>
		);
	}

	if (view === 'pix_result' && orderData?.pix) {
		return (
			<TemplateLayout
				theme={theme}
				onToggleTheme={toggleTheme}
				showTimer={showTimer}
				timerMinutes={timerMinutes}
				timerText={timerText}
				timerExpiredText={timerExpiredText}
				primaryColor={primaryColor}
				secondaryColor={effectiveSecondaryColor}
				logoUrl={config.logoUrl ?? null}
				bannerUrl={config.backgroundImageUrl ?? null}
				headerMessage={config.headerMessage ?? null}
				subHeaderMessage={config.subHeaderMessage ?? null}
				footerMessage={config.footerMessage ?? null}
				socialProofEnabled={false}
				socialProofNotifications={socialProofNotifications}
				socialProofIntervalSeconds={socialProofIntervalSeconds}
				socialProofDurationSeconds={socialProofDurationSeconds}
				socialProofPosition={socialProofPosition}
				isSandbox={isSandbox}
				contactConfig={{
					whatsAppEnabled: config.contactWhatsAppEnabled,
					whatsAppNumber: config.contactWhatsAppNumber,
					telegramEnabled: config.contactTelegramEnabled,
					telegramUsername: config.contactTelegramUsername,
					emailEnabled: config.contactEmailEnabled,
					email: config.contactEmail,
				}}
			>
				<PixResultView
					primaryColor={primaryColor}
					secondaryColor={effectiveSecondaryColor}
					pixCode={orderData.pix.copyAndPaste}
					expiresAt={orderData.pix.expiresAt}
					orderNumber={orderData.orderNumber}
					amount={orderData.amount}
					onBack={handleCancel}
				/>
			</TemplateLayout>
		);
	}

	if (view === 'success' && orderData) {
		return (
			<TemplateLayout
				theme={theme}
				onToggleTheme={toggleTheme}
				showTimer={showTimer}
				timerMinutes={timerMinutes}
				timerText={timerText}
				timerExpiredText={timerExpiredText}
				primaryColor={primaryColor}
				secondaryColor={effectiveSecondaryColor}
				logoUrl={config.logoUrl ?? null}
				bannerUrl={config.backgroundImageUrl ?? null}
				headerMessage={config.headerMessage ?? null}
				subHeaderMessage={config.subHeaderMessage ?? null}
				footerMessage={config.footerMessage ?? null}
				socialProofEnabled={false}
				socialProofNotifications={socialProofNotifications}
				socialProofIntervalSeconds={socialProofIntervalSeconds}
				socialProofDurationSeconds={socialProofDurationSeconds}
				socialProofPosition={socialProofPosition}
				isSandbox={isSandbox}
				contactConfig={{
					whatsAppEnabled: config.contactWhatsAppEnabled,
					whatsAppNumber: config.contactWhatsAppNumber,
					telegramEnabled: config.contactTelegramEnabled,
					telegramUsername: config.contactTelegramUsername,
					emailEnabled: config.contactEmailEnabled,
					email: config.contactEmail,
				}}
			>
				<SuccessView
					primaryColor={primaryColor}
					secondaryColor={effectiveSecondaryColor}
					productName={productNames}
					customerName={name}
					customerEmail={email}
					orderNumber={orderData.orderNumber}
					amount={orderData.amount}
					successMessage={config.successMessage ?? null}
					successUrl={config.successUrl ?? null}
					onNewPurchase={handleNewPurchase}
				/>
			</TemplateLayout>
		);
	}

	return (
		<TemplateLayout
			theme={theme}
			onToggleTheme={toggleTheme}
			showTimer={showTimer}
			timerMinutes={timerMinutes}
			timerText={timerText}
			timerExpiredText={timerExpiredText}
			primaryColor={primaryColor}
			secondaryColor={effectiveSecondaryColor}
			logoUrl={config.logoUrl ?? null}
			bannerUrl={config.backgroundImageUrl ?? null}
			headerMessage={config.headerMessage ?? null}
			subHeaderMessage={config.subHeaderMessage ?? null}
			footerMessage={config.footerMessage ?? null}
			socialProofEnabled={socialProofEnabled}
			socialProofNotifications={socialProofNotifications}
			socialProofIntervalSeconds={socialProofIntervalSeconds}
			socialProofDurationSeconds={socialProofDurationSeconds}
			socialProofPosition={socialProofPosition}
			isSandbox={isSandbox}
			contactConfig={{
				whatsAppEnabled: config.contactWhatsAppEnabled,
				whatsAppNumber: config.contactWhatsAppNumber,
				telegramEnabled: config.contactTelegramEnabled,
				telegramUsername: config.contactTelegramUsername,
				emailEnabled: config.contactEmailEnabled,
				email: config.contactEmail,
			}}
		>
			<CheckoutView
				primaryColor={primaryColor}
				secondaryColor={effectiveSecondaryColor}
				products={selectedProducts}
				groupedProducts={groupedProducts}
				onSelectVariant={selectVariant}
				requireCustomerDocument={config.requireCustomerDocument}
				requireCustomerPhone={config.requireCustomerPhone}
				requireCustomerAddress={config.requireCustomerAddress}
				name={name}
				email={email}
				cpf={cpf}
				phone={phone}
				cep={cep}
				street={street}
				number={number}
				complement={complement}
				neighborhood={neighborhood}
				city={city}
				state={state}
				onNameChange={setName}
				onEmailChange={setEmail}
				onCpfChange={setCpf}
				onPhoneChange={setPhone}
				onCepChange={setCep}
				onStreetChange={setStreet}
				onNumberChange={setNumber}
				onComplementChange={setComplement}
				onNeighborhoodChange={setNeighborhood}
				onCityChange={setCity}
				onStateChange={setState}
				paymentMethod={paymentMethod}
				onPaymentMethodChange={setPaymentMethod}
				cardNumber={cardNumber}
				cardName={cardName}
				cardExpiry={cardExpiry}
				cardCvc={cardCvc}
				installments={installments}
				onCardNumberChange={setCardNumber}
				onCardNameChange={setCardName}
				onCardExpiryChange={setCardExpiry}
				onCardCvcChange={setCardCvc}
				onInstallmentsChange={setInstallments}
				errors={errors}
				productPrice={productPrice}
				pixEnabled={pixEnabled}
				creditCardEnabled={creditCardEnabled}
				boletoEnabled={boletoEnabled}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				isFormComplete={isFormComplete}
				couponEnabled={couponEnabled}
				appliedCoupon={appliedCoupon}
				couponCode={couponCode}
				onCouponCodeChange={setCouponCode}
				onApplyCoupon={handleApplyCoupon}
				onRemoveCoupon={handleRemoveCoupon}
				isApplyingCoupon={isApplyingCoupon}
				couponError={couponError}
				discountedProduct={discountedProduct}
				submitError={submitError}
				calculation={calculation}
				isCalculating={isCalculating}
				reservationItems={null}
				theme={theme}
				onToggleTheme={toggleTheme}
				reservationError={null}
				onResetReservation={() => undefined}
				isReserving={false}
				reservationRemainingSeconds={0}
			/>
		</TemplateLayout>
	);
}
