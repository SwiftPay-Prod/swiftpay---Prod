import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSelectedMerchant } from '@/auth/session';
import { Routes } from '@/router/routes';
import { getMerchantEmailTemplate } from '@/app/actions/merchant/email-templates';
import { MerchantEmailTemplateType } from '@/types/enums';
import { EmailTemplateEditor } from './email-template-editor';
import { Skeleton } from '@heroui/react';

interface PageProps {
	params: Promise<{ templateId: string }>;
}

function EmailTemplateEditorSkeleton() {
	return (
		<div className="flex h-full flex-col gap-4 p-4">
			<Skeleton className="h-20 w-full rounded-xl" />
			<div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[16rem_1fr_22rem]">
				<Skeleton className="h-120 w-full rounded-xl" />
				<Skeleton className="h-120 w-full rounded-xl" />
				<Skeleton className="h-120 w-full rounded-xl" />
			</div>
		</div>
	);
}

export default async function EmailTemplateEditorPage({ params }: PageProps) {
	const merchant = await getSelectedMerchant();
	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const { templateId } = await params;
	const templateType = templateId as MerchantEmailTemplateType;

	if (!Object.values(MerchantEmailTemplateType).includes(templateType)) {
		redirect(Routes.panel.merchant.emailTemplates);
	}

	const templatePromise = getMerchantEmailTemplate(merchant.id, templateType);

	return (
		<Suspense fallback={<EmailTemplateEditorSkeleton />}>
			<EmailTemplateEditor
				key={templateType}
				templatePromise={templatePromise}
				merchantId={merchant.id}
				templateType={templateType}
			/>
		</Suspense>
	);
}
