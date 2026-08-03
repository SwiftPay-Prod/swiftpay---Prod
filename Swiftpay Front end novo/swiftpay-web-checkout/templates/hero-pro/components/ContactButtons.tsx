'use client';

import { Button, Tooltip } from '@heroui/react';
import type { ThemeMode } from '../types';
import { Icon } from '@/components/icon';
import { TelegramIcon, WhatsappIcon, Mail01Icon } from '@hugeicons/core-free-icons';

interface ContactButtonsProps {
	theme: ThemeMode;
	whatsAppEnabled?: boolean;
	whatsAppNumber?: string | null;
	telegramEnabled?: boolean;
	telegramUsername?: string | null;
	emailEnabled?: boolean;
	email?: string | null;
}

export function ContactButtons({
	theme,
	whatsAppEnabled,
	whatsAppNumber,
	telegramEnabled,
	telegramUsername,
	emailEnabled,
	email,
}: ContactButtonsProps) {
	const hasAnyContact = (whatsAppEnabled && whatsAppNumber) || (telegramEnabled && telegramUsername) || (emailEnabled && email);
	
	if (!hasAnyContact) return null;

	const buttonClass = theme === 'dark'
		? 'bg-gray-800 hover:bg-gray-700'
		: 'bg-white hover:bg-gray-100 shadow-lg inset-shadow-xs';

	function handleWhatsApp() {
		if (!whatsAppNumber) return;
		const cleanNumber = whatsAppNumber.replace(/\D/g, '');
		window.open(`https://wa.me/${cleanNumber}`, '_blank');
	}

	function handleTelegram() {
		if (!telegramUsername) return;
		const username = telegramUsername.replace('@', '');
		window.open(`https://t.me/${username}`, '_blank');
	}

	function handleEmail() {
		if (!email) return;
		window.open(`mailto:${email}`, '_blank');
	}

	return (
		<div className="fixed right-8 bottom-28 z-50 hidden lg:flex flex-col gap-3">
			{whatsAppEnabled && whatsAppNumber && (
				<Tooltip>
					<Button
						isIconOnly
						size="lg"
						onClick={handleWhatsApp}
						className={`p-6 ${buttonClass}`}
						aria-label="Contato via WhatsApp"
					>
						<Icon icon={WhatsappIcon} className="icon-md text-green-500" />
					</Button>
					<Tooltip.Content placement="left">WhatsApp</Tooltip.Content>
				</Tooltip>
			)}
			
			{telegramEnabled && telegramUsername && (
				<Tooltip>
					<Button
						isIconOnly
						size="lg"
						onClick={handleTelegram}
						className={`p-6 ${buttonClass}`}
						aria-label="Contato via Telegram"
					>
						<Icon icon={TelegramIcon} className="icon-md text-blue-400" />
					</Button>
					<Tooltip.Content placement="left">Telegram</Tooltip.Content>
				</Tooltip>
			)}
			
			{emailEnabled && email && (
				<Tooltip>
					<Button
						isIconOnly
						size="lg"
						onClick={handleEmail}
						className={`p-6 ${buttonClass}`}
						aria-label="Contato via E-mail"
					>
						<Icon icon={Mail01Icon} className={theme === 'dark' ? 'icon-md text-gray-300' : 'icon-md text-gray-700'} />
					</Button>
					<Tooltip.Content placement="left">E-mail</Tooltip.Content>
				</Tooltip>
			)}
		</div>
	);
}
