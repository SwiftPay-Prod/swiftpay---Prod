'use client';

import { useState } from 'react';
import type { FormErrors } from '../types';
import { Input } from '../components';
import { maskCEP } from '../masks';
import { Icon } from '@/components/icon';
import {
	Building02Icon,
	BuildingIcon,
	Flag02Icon,
	Home02Icon,
	Loading03Icon,
	Location,
	MapsIcon,
	ShippingTruck01Icon,
	TextNumberSignIcon,
} from '@hugeicons/core-free-icons';

interface DeliverySectionProps {
	primaryColor: string;
	secondaryColor: string | null;
	cep: string;
	street: string;
	number: string;
	complement: string;
	neighborhood: string;
	city: string;
	state: string;
	onCepChange: (value: string) => void;
	onStreetChange: (value: string) => void;
	onNumberChange: (value: string) => void;
	onComplementChange: (value: string) => void;
	onNeighborhoodChange: (value: string) => void;
	onCityChange: (value: string) => void;
	onStateChange: (value: string) => void;
	errors: FormErrors;
}

export function DeliverySection({
	primaryColor,
	secondaryColor,
	cep,
	street,
	number,
	complement,
	neighborhood,
	city,
	state,
	onCepChange,
	onStreetChange,
	onNumberChange,
	onComplementChange,
	onNeighborhoodChange,
	onCityChange,
	onStateChange,
	errors,
}: DeliverySectionProps) {
	const [loadingCep, setLoadingCep] = useState(false);

	const gradientStyle = secondaryColor
		? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
		: { backgroundColor: primaryColor };

	const handleCepChange = async (value: string) => {
		onCepChange(value);
		const cleanCep = value.replace(/\D/g, '');
		if (cleanCep.length === 8) {
			setLoadingCep(true);
			try {
				const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
				const data = await response.json();
				if (!data.erro) {
					onStreetChange(data.logradouro || '');
					onNeighborhoodChange(data.bairro || '');
					onCityChange(data.localidade || '');
					onStateChange(data.uf || '');
				}
			} catch {
				// Silently fail
			} finally {
				setLoadingCep(false);
			}
		}
	};

	return (
		<div className="hero-card">
			<div className="flex items-center gap-3 mb-6">
				<div
					className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
					style={gradientStyle}
				>
					<Icon icon={ShippingTruck01Icon} className="icon-sm" />
				</div>
				<h2 className="text-md font-extrabold italic hero-text">ENTREGA</h2>
			</div>

			<div className="grid gap-4">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Input
						label="CEP"
						value={cep}
						onChange={handleCepChange}
						placeholder="00000-000"
						error={errors.cep}
						mask={maskCEP}
						brandColor={primaryColor}
						secondaryColor={secondaryColor}
						autoComplete="postal-code"
						disabled={loadingCep}
						icon={
							loadingCep ? (
								<Icon icon={Loading03Icon} className="animate-spin" />
							) : (
								<Icon icon={Location} className="icon-sm" />
							)
						}
					/>

					<div className="sm:col-span-2">
						<Input
							label="Rua"
							value={street}
							onChange={onStreetChange}
							placeholder="Nome da rua"
							error={errors.street}
							brandColor={primaryColor}
							secondaryColor={secondaryColor}
							autoComplete="street-address"
							icon={<Icon icon={Home02Icon} className="icon-sm" />}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Input
						label="Número"
						value={number}
						onChange={onNumberChange}
						placeholder="Nº"
						error={errors.number}
						brandColor={primaryColor}
						secondaryColor={secondaryColor}
						autoComplete="address-line2"
						icon={<Icon icon={TextNumberSignIcon} className="icon-sm" />}
					/>

					<div className="sm:col-span-2">
						<Input
							label="Complemento (opcional)"
							value={complement}
							onChange={onComplementChange}
							placeholder="Apto, bloco, etc."
							brandColor={primaryColor}
							secondaryColor={secondaryColor}
							autoComplete="address-line2"
							icon={<Icon icon={BuildingIcon} className="icon-sm" />}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Input
						label="Bairro"
						value={neighborhood}
						onChange={onNeighborhoodChange}
						placeholder="Bairro"
						error={errors.neighborhood}
						brandColor={primaryColor}
						secondaryColor={secondaryColor}
						autoComplete="address-level3"
						icon={<Icon icon={MapsIcon} className="icon-sm" />}
					/>

					<Input
						label="Cidade"
						value={city}
						onChange={onCityChange}
						placeholder="Cidade"
						error={errors.city}
						brandColor={primaryColor}
						secondaryColor={secondaryColor}
						autoComplete="address-level2"
						icon={<Icon icon={Building02Icon} className="icon-sm" />}
					/>

					<Input
						label="Estado"
						value={state}
						onChange={onStateChange}
						placeholder="UF"
						error={errors.state}
						brandColor={primaryColor}
						secondaryColor={secondaryColor}
						autoComplete="address-level1"
						maxLength={2}
						icon={<Icon icon={Flag02Icon} className="icon-sm" />}
					/>
				</div>
			</div>
		</div>
	);
}
