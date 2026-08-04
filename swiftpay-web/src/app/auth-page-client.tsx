'use client';

import { useState } from 'react';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { SignInForm } from '@/components/auth/forms/signin-form';
import { SignUpForm } from '@/components/auth/forms/signup-form';
import { ForgotPasswordForm } from '@/components/auth/forms/forgot-password-form';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export function AuthPageClient() {
	const [mode, setMode] = useState<AuthMode>('signin');

	return (
		<div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-foreground selection:bg-primary selection:text-primary-foreground">
			{/* Botão de Alternar Tema no topo superior direito */}
			<div className="absolute top-4 right-4 z-20">
				<ThemeToggle />
			</div>

			{/* Efeitos visuais de fundo no estilo Revolut / Obsidian */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[140px]" />
				<div className="absolute -right-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />
			</div>
			<div className="relative z-10 w-full max-w-md space-y-8">
				{/* Topo com o Logo SwiftPay */}
				<div className="flex flex-col items-center justify-center text-center space-y-3">
					<SwiftPayBrandLogo iconSize={48} showText={true} textClassName="text-3xl font-extrabold" />
					<p className="text-sm text-muted-foreground">
						{mode === 'signin' && 'Acesse sua conta para gerenciar seus recebimentos'}
						{mode === 'signup' && 'Crie sua conta e comece a vender com a SwiftPay'}
						{mode === 'forgot-password' && 'Recupere o acesso à sua conta'}
					</p>
				</div>

				{/* Card de Autenticação */}
				<div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-xl transition-all">
					{mode === 'signin' && (
						<SignInForm
							onSwitchToSignUp={() => setMode('signup')}
							onSwitchToForgotPassword={() => setMode('forgot-password')}
						/>
					)}

					{mode === 'signup' && (
						<SignUpForm
							onSwitchToSignIn={() => setMode('signin')}
						/>
					)}

					{mode === 'forgot-password' && (
						<ForgotPasswordForm
							onSwitchToSignIn={() => setMode('signin')}
						/>
					)}
				</div>

				{/* Footer de Suporte e Termos */}
				<div className="text-center text-xs text-muted-foreground space-y-1">
					<p>© {new Date().getFullYear()} SwiftPay Fintech. Todos os direitos reservados.</p>
					<p className="text-foreground/50">Ambiente Seguro & Criptografado</p>
				</div>
			</div>
		</div>
	);
}
