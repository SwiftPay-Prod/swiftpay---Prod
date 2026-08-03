'use client';

import { InputGroup } from '@heroui/react';
import { Globe02Icon } from '@hugeicons/core-free-icons';
import { type ChangeEvent } from 'react';
import { usePhoneInput, FlagImage } from 'react-international-phone';
import 'react-international-phone/style.css';

import { Icon } from '@/components/ui/icon';

interface InternationalPhoneInputProps {
	value: string | null | undefined;
	onChange: (value: string | null) => void;
	onBlur?: () => void;
	name?: string;
	placeholder?: string;
	autoComplete?: string;
	defaultCountry?: string;
	isInvalid?: boolean;
	disabled?: boolean;
	required?: boolean;
	className?: string;
}

export function InternationalPhoneInput({
	value,
	onChange,
	onBlur,
	name,
	placeholder = 'Digite o telefone com DDI',
	autoComplete = 'off',
	defaultCountry = 'br',
	disabled = false,
	required = false,
	className,
}: InternationalPhoneInputProps) {
	const isEmpty = !value;

	const { inputValue, handlePhoneValueChange, country } = usePhoneInput({
		defaultCountry,
		value: value ?? '',
		onChange: ({ phone, country: phoneCountry }) => {
			if (!value) {
				const digits = phone?.replace(/\D/g, '') ?? '';
				if (!digits || digits === phoneCountry.dialCode) {
					return;
				}
			}
			onChange(phone || null);
		},
	});

	function handleEmptyInput(e: ChangeEvent<HTMLInputElement>) {
		const typed = e.target.value.replace(/\D/g, '');
		if (typed) {
			onChange('+' + typed);
		}
	}

	return (
		<InputGroup className={className}>
			<InputGroup.Prefix>
				{isEmpty ? (
					<Icon icon={Globe02Icon} className="icon-sm text-muted" />
				) : (
					<FlagImage iso2={country.iso2} size="20px" />
				)}
			</InputGroup.Prefix>
			<InputGroup.Input
				name={name}
				type="tel"
				inputMode="tel"
				autoComplete={autoComplete}
				placeholder={placeholder}
				value={isEmpty ? '' : inputValue}
				onChange={isEmpty ? handleEmptyInput : handlePhoneValueChange}
				onBlur={onBlur}
				disabled={disabled}
				required={required}
			/>
		</InputGroup>
	);
}
