import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';

export default function MenuPage() {
	redirect(Routes.panel.merchant.dashboard);
}
