'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { adminGetTemplate } from '@/app/actions/admin/templates';
import { TemplateUpsertForm, TemplateUpsertFormSkeleton } from './components/upsert-form';
import type { AdminTemplateData } from '@/types/admin/templates';
import type { ApiResponse } from '@/types/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TemplatePromise = Promise<ApiResponse<AdminTemplateData>>;

export default function TemplateUpsertPage() {
	const params = useParams();
	const templateId = params.templateId as string;
	const isNewMode = templateId === 'new';
	const isValidId = isNewMode || UUID_REGEX.test(templateId);

	const [templatePromise, setTemplatePromise] = useState<TemplatePromise | undefined>(undefined);

	useEffect(() => {
		if (isNewMode) return;
		const p = adminGetTemplate(templateId);
		Promise.resolve().then(() => setTemplatePromise(p));
	}, [templateId, isNewMode]);

	if (!isValidId) {
		notFound();
	}

	if (isNewMode) {
		return <TemplateUpsertForm />;
	}

	if (!templatePromise) {
		return <TemplateUpsertFormSkeleton />;
	}

	return (
		<Suspense fallback={<TemplateUpsertFormSkeleton />}>
			<TemplateUpsertForm templatePromise={templatePromise} />
		</Suspense>
	);
}
