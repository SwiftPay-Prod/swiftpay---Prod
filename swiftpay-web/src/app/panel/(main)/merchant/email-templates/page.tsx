import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { Routes } from '@/router/routes';
import { EmailTemplatesContent } from './email-templates-content';
import { listMerchantEmailTemplates } from '@/app/actions/merchant/email-templates';

export default async function EmailTemplatesPage() {
	const merchant = await getSelectedMerchant();
	const environment = await getSelectedEnvironment();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const templatesPromise = listMerchantEmailTemplates(merchant.id, { environment, page: 1, pageSize: 50 });

	return <EmailTemplatesContent templatesPromise={templatesPromise} />;
}

