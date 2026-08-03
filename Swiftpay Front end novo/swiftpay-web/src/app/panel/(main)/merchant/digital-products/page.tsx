import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';

export default async function DigitalProductsPage() {
	redirect(Routes.panel.merchant.productsByType('digital'));
}
