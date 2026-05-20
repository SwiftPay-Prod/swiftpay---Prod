'use client';

import type { ReactNode } from 'react';
import type { ThemeMode, SocialNotification, SocialProofPosition } from '../types';
import { Footer } from './Footer';
import { Header } from './Header';
import { SocialProof } from './SocialProof';
import { ThemeToggle } from './ThemeToggle';
import { TimerBar } from './TimerBar';
import { ContactButtons } from './ContactButtons';

interface ContactConfig {
	whatsAppEnabled?: boolean;
	whatsAppNumber?: string | null;
	telegramEnabled?: boolean;
	telegramUsername?: string | null;
	emailEnabled?: boolean;
	email?: string | null;
}

interface TemplateLayoutProps {
	theme: ThemeMode;
	onToggleTheme: () => void;
	showTimer: boolean;
	timerMinutes: number;
	timerText: string | null;
	timerExpiredText: string | null;
	primaryColor: string;
	secondaryColor: string | null;
	logoUrl: string | null;
	bannerUrl: string | null;
	headerMessage: string | null;
	subHeaderMessage: string | null;
	footerMessage: string | null;
	socialProofEnabled: boolean;
	socialProofNotifications: SocialNotification[];
	socialProofIntervalSeconds: number;
	socialProofDurationSeconds: number;
	socialProofPosition: SocialProofPosition;
	isSandbox: boolean;
	children: ReactNode;
	afterMain?: ReactNode;
	contactConfig?: ContactConfig;
}

export function TemplateLayout({
	theme,
	onToggleTheme,
	showTimer,
	timerMinutes,
	timerText,
	timerExpiredText,
	primaryColor,
	secondaryColor,
	logoUrl,
	bannerUrl,
	headerMessage,
	subHeaderMessage,
	footerMessage,
	socialProofEnabled,
	socialProofNotifications,
	socialProofIntervalSeconds,
	socialProofDurationSeconds,
	socialProofPosition,
	children,
	afterMain,
	contactConfig,
}: TemplateLayoutProps) {
	return (
		<div data-theme={theme.toLowerCase()} className="hero-template flex flex-col min-h-screen relative z-1 hero-bg" style={{ backgroundImage: 'none' }}>
			<ContactButtons
				theme={theme}
				whatsAppEnabled={contactConfig?.whatsAppEnabled}
				whatsAppNumber={contactConfig?.whatsAppNumber}
				telegramEnabled={contactConfig?.telegramEnabled}
				telegramUsername={contactConfig?.telegramUsername}
				emailEnabled={contactConfig?.emailEnabled}
				email={contactConfig?.email}
			/>
			<ThemeToggle theme={theme} onToggle={onToggleTheme} />

			{showTimer && (
				<TimerBar
					initialMinutes={timerMinutes}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
					timerText={timerText}
					timerExpiredText={timerExpiredText}
				/>
			)}

			<Header
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				logoUrl={logoUrl}
				bannerUrl={bannerUrl}
				headerMessage={headerMessage}
				subHeaderMessage={subHeaderMessage}
			/>

			<main className="max-w-6xl mx-auto px-4 py-8 mb-auto">
				{children}
			</main>

			{afterMain}

			<Footer footerMessage={footerMessage} />

			{socialProofEnabled && (
				<SocialProof
					notifications={socialProofNotifications}
					enabled={socialProofEnabled}
					intervalSeconds={socialProofIntervalSeconds}
					durationSeconds={socialProofDurationSeconds}
					position={socialProofPosition}
				/>
			)}
		</div>
	);
}
