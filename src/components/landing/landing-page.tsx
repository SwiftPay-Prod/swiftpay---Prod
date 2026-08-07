'use client';

import React, { useState } from 'react';
import { LandingHeader } from './landing-header';
import { LandingHero } from './landing-hero';
import { LandingPillars } from './landing-pillars';
import { LandingDeveloper } from './landing-developer';
import { LandingSecurity } from './landing-security';
import { LandingFaq } from './landing-faq';
import { LandingCta } from './landing-cta';
import { LandingFooter } from './landing-footer';
import { AuthModal, type AuthModalMode } from './auth-modal';

interface LandingPageProps {
	initialAuthMode?: AuthModalMode;
}

export function LandingPage({ initialAuthMode = null }: LandingPageProps) {
	const [authModalMode, setAuthModalMode] = useState<AuthModalMode>(initialAuthMode);

	const handleOpenAuth = (mode: 'signin' | 'signup' | 'forgot-password') => {
		setAuthModalMode(mode);
	};

	const handleCloseAuth = () => {
		setAuthModalMode(null);
	};

	return (
		<div className="min-h-screen w-full bg-[#0B0E14] text-foreground font-sans selection:bg-[#A3E635] selection:text-[#0B0E14] overflow-x-hidden">
			{/* Public Header */}
			<LandingHeader onOpenAuth={handleOpenAuth} />

			{/* Hero Section */}
			<LandingHero onOpenAuth={handleOpenAuth} />

			{/* Core Value Pillars */}
			<LandingPillars />

			{/* Developer Experience & Code Snippets */}
			<LandingDeveloper />

			{/* Security & Financial Stability */}
			<LandingSecurity />

			{/* Interactive FAQ Accordion */}
			<LandingFaq />

			{/* Final High-Conversion CTA */}
			<LandingCta onOpenAuth={handleOpenAuth} />

			{/* Full Fintech Footer */}
			<LandingFooter onOpenAuth={handleOpenAuth} />

			{/* Seamless Auth Modal (SignIn / SignUp / ForgotPassword) */}
			<AuthModal
				isOpen={authModalMode !== null}
				mode={authModalMode}
				onClose={handleCloseAuth}
				onSwitchMode={setAuthModalMode}
			/>
		</div>
	);
}
