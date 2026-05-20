'use client';

import type { FormErrors } from '../types';
import { Input } from '../components';
import { maskCPF, maskPhone } from '../masks';
import { Icon } from '@/components/icon';
import { CallIcon, MailIcon, UserAccountIcon, UserIcon } from '@hugeicons/core-free-icons';

interface IdentificationSectionProps {
	primaryColor: string;
	secondaryColor: string | null;
	requireCustomerDocument: boolean;
	requireCustomerPhone: boolean;
	name: string;
	email: string;
	cpf: string;
	phone: string;
	onNameChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onCpfChange: (value: string) => void;
	onPhoneChange: (value: string) => void;
	errors: FormErrors;
}

export function IdentificationSection({
	primaryColor,
	secondaryColor,
	requireCustomerDocument,
	requireCustomerPhone,
	name,
	email,
	cpf,
	phone,
	onNameChange,
	onEmailChange,
	onCpfChange,
	onPhoneChange,
	errors,
}: IdentificationSectionProps) {
	const gradientStyle = secondaryColor
		? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
		: { backgroundColor: primaryColor };

	return (
		<div className="hero-card">
			<div className="flex items-center gap-3 mb-6">
				<div
					className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
					style={gradientStyle}
				>
					<Icon icon={UserIcon} className="icon-sm" />
				</div>
				<h2 className="text-md font-extrabold italic hero-text">IDENTIFICAÇÃO</h2>
			</div>

			<div className="grid gap-4">
				<Input
					label="Nome completo"
					value={name}
					onChange={onNameChange}
					placeholder="Digite seu nome completo"
					error={errors.name}
					brandColor={primaryColor}
					secondaryColor={secondaryColor}
					autoComplete="name"
					icon={<Icon icon={UserIcon} className="icon-sm" />}
				/>

				<Input
					label="E-mail"
					type="email"
					value={email}
					onChange={onEmailChange}
					placeholder="seu@email.com"
					error={errors.email}
					brandColor={primaryColor}
					secondaryColor={secondaryColor}
					suggestions
					autoComplete="email"
					icon={<Icon icon={MailIcon} className="icon-sm" />}
				/>

				{(requireCustomerDocument || requireCustomerPhone) && (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{requireCustomerDocument && (
							<Input
								label="CPF"
								value={cpf}
								onChange={onCpfChange}
								placeholder="000.000.000-00"
								error={errors.cpf}
								mask={maskCPF}
								brandColor={primaryColor}
								secondaryColor={secondaryColor}
								autoComplete="off"
								icon={<Icon icon={UserAccountIcon} className="icon-sm" />}
							/>
						)}

						{requireCustomerPhone && (
							<Input
								label="Telefone"
								value={phone}
								onChange={onPhoneChange}
								placeholder="(00) 00000-0000"
								error={errors.phone}
								mask={maskPhone}
								brandColor={primaryColor}
								secondaryColor={secondaryColor}
								autoComplete="tel"
								icon={<Icon icon={CallIcon} className="icon-sm" />}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
