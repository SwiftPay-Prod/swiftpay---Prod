import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';

export default async function PhysicalProductsPage() {
	redirect(Routes.panel.merchant.productsByType('physical'));
}

