'use client';

import { Button } from '@heroui/react';
import type { ThemeMode } from '../types';
import { Icon } from '@/components/icon';
import { Moon02Icon, Sun02Icon } from '@hugeicons/core-free-icons';

interface ThemeToggleProps {
	theme: ThemeMode;
	onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
	return (
		<Button
			isIconOnly
			size="lg"
			onClick={onToggle}
			className={`fixed right-8 bottom-8 z-50 p-6 hidden lg:flex ${
				theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100 shadow-lg inset-shadow-xs'
			}`}
			aria-label="Alternar tema"
		>
			{theme === 'dark' ? (
				<Icon icon={Sun02Icon} className="icon-md text-yellow-400" />
			) : (
				<Icon icon={Moon02Icon} className="icon-md text-black" />
			)}
		</Button>
	);
}
