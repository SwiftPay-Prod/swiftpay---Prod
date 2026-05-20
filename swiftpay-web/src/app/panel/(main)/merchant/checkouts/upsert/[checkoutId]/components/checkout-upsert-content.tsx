'use client';

import { use, useCallback, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutOnboarding } from './checkout-onboarding';
import { createMerchantCheckout, updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { toast } from '@heroui/react';
import { CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { Routes } from '@/router/routes';
import type { CheckoutData, CheckoutTemplateData } from '@/types/merchant/checkouts';
import type { ApiResponse, Paginated } from '@/types/common';
import type { PaymentEnvironment } from '@/types/enums';

type CheckoutPromise = Promise<ApiResponse<CheckoutData>>;
type TemplatesPromise = Promise<ApiResponse<Paginated<CheckoutTemplateData>>>;

interface CheckoutUpsertContentProps {
	merchantId: string;
	environment: PaymentEnvironment;
	isNew: boolean;
	checkoutPromise: CheckoutPromise | null;
	templatesPromise: TemplatesPromise;
}

export function CheckoutUpsertContent({
	merchantId,
	environment,
	isNew,
	checkoutPromise,
	templatesPromise,
}: CheckoutUpsertContentProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [createdCheckout, setCreatedCheckout] = useState<CheckoutData | null>(null);
	const refreshLockRef = useRef(false);

	const checkoutResponse = checkoutPromise ? use(checkoutPromise) : null;
	const templatesResponse = use(templatesPromise);

	const checkout = checkoutResponse?.data ?? createdCheckout;
	const templates = templatesResponse?.data?.items ?? [];

	const safeRefresh = useCallback(() => {
		if (refreshLockRef.current) {
			return;
		}

		refreshLockRef.current = true;

		const runRefresh = () => {
			try {
				router.refresh();
			} catch (error) {
				const isInvalidStateError =
					error instanceof DOMException && error.name === 'InvalidStateError';

				if (!isInvalidStateError) {
					throw error;
				}

				window.setTimeout(() => {
					try {
						router.refresh();
					} catch {
						// Best effort retry for transient transition state.
					}
				}, 250);
			}
		};

		window.setTimeout(runRefresh, 0);

		window.setTimeout(() => {
			refreshLockRef.current = false;
		}, 1500);
	}, [router]);

	async function handleCreateCheckout(name: string) {
		startTransition(async () => {
			const response = await createMerchantCheckout(merchantId, { name, environment });

			if (response?.error) {
				toast('Erro ao criar checkout', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			if (response?.data) {
				await updateMerchantCheckout(merchantId, response.data.id, {
					onboardingStep: 1,
					onboardingCompleted: false,
				});

				setCreatedCheckout({ ...response.data, onboardingStep: 1 });
				router.replace(Routes.panel.merchant.checkoutsUpsert(response.data.id), { scroll: false });
			}
		});
	}

	async function handleUpdateName(name: string) {
		if (!checkout) return;

		startTransition(async () => {
			const response = await updateMerchantCheckout(merchantId, checkout.id, { name });

			if (response?.error) {
				toast('Erro ao atualizar nome', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			if (response?.data) {
				setCreatedCheckout(response.data);
				toast('Nome atualizado', {
					description: 'O nome do checkout foi atualizado com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	function handleOnboardingComplete() {
		if (!checkout) return;

		startTransition(async () => {
			const response = await updateMerchantCheckout(merchantId, checkout.id, {
				onboardingStep: 0,
				onboardingCompleted: true,
			});

			if (response?.data) {
				setCreatedCheckout(response.data);
			}

			safeRefresh();
		});
	}

	function handleRefresh() {
		safeRefresh();
	}

	if (checkoutResponse?.error) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-12">
				<p className="text-danger">{checkoutResponse.error.message}</p>
			</div>
		);
	}

	if (!isNew && !checkout) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-12">
				<p className="text-muted">Checkout nao encontrado</p>
			</div>
		);
	}

	return (
		<CheckoutOnboarding
			merchantId={merchantId}
			checkout={checkout}
			templates={templates}
			initialStep={checkout?.onboardingCompleted ? 1 : (checkout?.onboardingStep ?? 0)}
			isPending={isPending}
			onCreateCheckout={handleCreateCheckout}
			onUpdateName={handleUpdateName}
			onComplete={handleOnboardingComplete}
			onRefresh={handleRefresh}
		/>
	);
}
