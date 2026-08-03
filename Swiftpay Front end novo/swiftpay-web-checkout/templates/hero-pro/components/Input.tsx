'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { EMAIL_DOMAINS } from '../constants';

interface InputProps {
	label: string;
	type?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	icon?: React.ReactNode;
	mask?: (value: string) => string;
	suggestions?: boolean;
	brandColor: string;
	secondaryColor?: string | null;
	disabled?: boolean;
	maxLength?: number;
	autoComplete?: string;
}

export function Input({
	label,
	type = 'text',
	value,
	onChange,
	placeholder,
	error,
	icon,
	mask,
	suggestions = false,
	brandColor,
	secondaryColor = null,
	disabled = false,
	maxLength,
	autoComplete,
}: InputProps) {
	const [focused, setFocused] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const gradientId = useId();

	const hasGradient = !!secondaryColor;
	const focusedInputStyle = focused && !error ? { borderColor: brandColor } : undefined;
	const focusedIconStyle = { color: focused && !hasGradient ? brandColor : undefined };
	const gradientStroke = hasGradient && focused ? `url(#${gradientId})` : undefined;
	const gradientDefs = hasGradient ? (
		<defs>
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stopColor={brandColor} />
				<stop offset="100%" stopColor={secondaryColor ?? brandColor} />
			</linearGradient>
		</defs>
	) : null;

	const isSvgIcon = React.isValidElement(icon) && icon.type === 'svg';
	const svgIcon = isSvgIcon ? (icon as React.ReactElement<React.SVGProps<SVGSVGElement>>) : null;
	const iconElement = svgIcon
		? React.cloneElement(svgIcon, {
				stroke: gradientStroke ?? svgIcon.props.stroke,
				fill: gradientStroke ?? svgIcon.props.fill,
				children: (
					<>
						{svgIcon.props.children}
						{gradientStroke ? gradientDefs : null}
					</>
				),
			})
		: icon;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let newValue = e.target.value;
		if (mask) {
			newValue = mask(newValue);
		}
		onChange(newValue);

		if (suggestions && type === 'email') {
			setShowSuggestions(newValue.length > 0 && !newValue.includes('@'));
		}
	};

	const handleSuggestionClick = (domain: string) => {
		const emailBase = value.split('@')[0];
		onChange(emailBase + domain);
		setShowSuggestions(false);
	};

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(e.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(e.target as Node)
			) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div className="relative">
			<label className="block text-sm font-medium mb-1.5 hero-text-muted">{label}</label>
			<div className="relative">
				{icon && (
					<div
						className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors hero-text-subtle"
						style={focusedIconStyle}
					>
						{iconElement}
					</div>
				)}
				<input
					ref={inputRef}
					type={type}
					value={value}
					onChange={handleChange}
					placeholder={placeholder}
					disabled={disabled}
					maxLength={maxLength}
					autoComplete={autoComplete}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					style={focusedInputStyle}
					className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-lg border-2 outline-none transition-all text-sm hero-input ${
						error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''
					} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
				/>
			</div>
			{error && <p className="text-red-500 text-xs mt-1">{error}</p>}
			{showSuggestions && suggestions && (
				<div
					ref={suggestionsRef}
					className="absolute z-20 w-full mt-1 rounded-lg shadow-lg overflow-hidden hero-bg-card hero-border border"
				>
					{EMAIL_DOMAINS.map((domain) => (
						<button
							key={domain}
							type="button"
							onClick={() => handleSuggestionClick(domain)}
							className="w-full px-4 py-2 text-left text-sm cursor-pointer hero-text-muted hero-hover-card"
						>
							{value.split('@')[0]}
							<span style={{ color: brandColor }}>{domain}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
