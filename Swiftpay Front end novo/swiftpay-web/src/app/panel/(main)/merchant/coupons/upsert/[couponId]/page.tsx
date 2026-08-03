'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useMerchant } from '@/contexts/merchant-context';
import { useEnvironment } from '@/contexts/environment-context';
import { getMerchantCoupon } from '@/app/actions/merchant/coupons';
import { CouponUpsertForm, PageSkeleton } from './components/upsert-form';
import type { CouponData } from '@/types/merchant/coupons';
import type { ApiResponse } from '@/types/common';

type CouponPromise = Promise<ApiResponse<CouponData>>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CouponUpsertPage() {
	const params = useParams();
	const couponId = params.couponId as string;
	const isNewMode = couponId === 'new';
	const isValidId = isNewMode || UUID_REGEX.test(couponId);

	const { selectedMerchant } = useMerchant();
	const { environment } = useEnvironment();
	const merchantId = selectedMerchant?.id;

	const [couponPromise, setCouponPromise] = useState<CouponPromise | undefined>(undefined);

	useEffect(() => {
		if (isNewMode || !merchantId) return;
		getMerchantCoupon(merchantId, couponId).then((res) => {
			setCouponPromise(Promise.resolve(res));
		});
	}, [couponId, isNewMode, merchantId]);

	if (!isValidId) {
		notFound();
	}

	if (!merchantId) {
		return <PageSkeleton />;
	}

	if (isNewMode) {
		return (
			<CouponUpsertForm
				merchantId={merchantId}
				environment={environment}
			/>
		);
	}

	if (!couponPromise) {
		return <PageSkeleton />;
	}

	return (
		<Suspense fallback={<PageSkeleton />}>
			<CouponUpsertForm
				merchantId={merchantId}
				environment={environment}
				couponPromise={couponPromise}
			/>
		</Suspense>
	);
}
