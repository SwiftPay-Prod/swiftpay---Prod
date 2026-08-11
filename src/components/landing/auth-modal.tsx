'use client';

import React from 'react';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { SignInForm } from '@/components/auth/forms/signin-form';
import { SignUpForm } from '@/components/auth/forms/signup-form';
import { ForgotPasswordForm } from '@/components/auth/forms/forgot-password-form';
import { ResetPasswordForm } from '@/components/auth/forms/reset-password-form';
import { Icon } from '@/components/ui/icon';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';

export type AuthModalMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password' | null;

interface AuthModalProps {
	isOpen: boolean;
	mode: AuthModalMode;
	onClose: () => void;
	onSwitchMode: (newMode: AuthModalMode) => void;
}

export function AuthModal({ isOpen, mode, onClose, onSwitchMode }: AuthModalProps) {
	if (!isOpen || !mode) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
				onClick={onClose}
			/>

			{/* Modal Dialog */}
			<div className="relative z-10 w-full max-w-md rounded-2xl border border-border/80 bg-[#121721] p-6 sm:p-8 shadow-2xl transition-all animate-in zoom-in-95 duration-200 text-foreground">
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-surface-secondary/80 focus:outline-none"
					aria-label="Fechar"
				>
					<Icon icon={CancelCircleIcon} className="w-5 h-5" />
				</button>

				{/* Header Logo */}
				<div className="flex flex-col items-center justify-center text-center space-y-2 mb-6">
					<SwiftPayBrandLogo iconSize={40} showText textClassName="text-2xl font-extrabold" />
					<p className="text-xs text-muted-foreground max-w-xs">
						{mode === 'signin' && 'Acesse seu painel para gerenciar pagamentos e saques'}
						{mode === 'signup' && 'Crie sua conta em menos de 2 minutos e comece a vender'}
						{mode === 'forgot-password' && 'Digite seu e-mail para recuperar a senha'}
					{mode === 'reset-password' && 'Digite o código e defina uma nova senha'}
					</p>
				</div>

				{/* Form container */}
				<div>
					{mode === 'signin' && (
						<SignInForm
							onSwitchToSignUp={() => onSwitchMode('signup')}
							onSwitchToForgotPassword={() => onSwitchMode('forgot-password')}
						/>
					)}

					{mode === 'signup' && (
						<SignUpForm
							onSwitchToSignIn={() => onSwitchMode('signin')}
						/>
					)}

					{mode === 'forgot-password' && (
						<ForgotPasswordForm
							onSwitchToSignIn={() => onSwitchMode('signin')}
						/>
					)}

					{mode === 'reset-password' && (
						<ResetPasswordForm
							onSwitchToSignIn={() => onSwitchMode('signin')}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
