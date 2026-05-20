'use client';

import { Link } from '@heroui/react';
import { formatPhone, formatDocument } from '@/utils/input-masks';

interface EmailLinkProps {
	email: string | null | undefined;
	fallback?: string;
	className?: string;
	maskEmail?: boolean;
}

function maskEmailAddress(email: string): string {
	const [localPart, domain] = email.split('@');
	if (!domain || !localPart) return email;
	
	const maskedLocal = localPart.length <= 2 
		? localPart[0] + '*'.repeat(localPart.length - 1)
		: localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
	
	return `${maskedLocal}@${domain}`;
}

export function EmailLink({ email, fallback = '—', className, maskEmail = false }: EmailLinkProps) {
	if (!email) {
		return <span className={`text-muted ${className}`}>{fallback}</span>;
	}

	const displayEmail = maskEmail ? maskEmailAddress(email) : email;

	return (
		<Link href={`mailto:${email}`} className={className}>
			{displayEmail}
		</Link>
	);
}

interface PhoneLinkProps {
	phone: string | null | undefined;
	fallback?: string;
	className?: string;
	formatted?: boolean;
}

export function PhoneLink({ phone, fallback = '—', className, formatted = true }: PhoneLinkProps) {
	if (!phone) {
		return <span className={`text-muted ${className}`}>{fallback}</span>;
	}

	const digits = phone.replace(/\D/g, '');
	const whatsappUrl = `https://api.whatsapp.com/send/?phone=${digits}`;
	const displayValue = formatted ? formatPhone(phone, phone) : phone;

	return (
		<Link href={whatsappUrl} target="_blank" className={className}>
			{displayValue}
			<Link.Icon />
		</Link>
	);
}

interface DocumentDisplayProps {
	document: string | null | undefined;
	documentType?: string | null;
	fallback?: string;
	className?: string;
}

export function DocumentDisplay({ document, documentType, fallback = '—', className }: DocumentDisplayProps) {
	if (!document) {
		return <span className={`text-muted ${className}`}>{fallback}</span>;
	}

	const digits = document.replace(/\D/g, '');
	const normalizedType = documentType?.toUpperCase();
	const isCnpj = normalizedType === 'CNPJ' || digits.length === 14;
	const displayValue = formatDocument(document, documentType);

	if (isCnpj) {
		return (
			<Link href={`https://cnpj.biz/${digits}`} target="_blank" className={`font-mono ${className}`}>
				{displayValue}
				<Link.Icon />
			</Link>
		);
	}

	return <span className={`font-mono ${className}`}>{displayValue}</span>;
}

interface ExternalLinkProps {
	url: string | null | undefined;
	fallback?: string;
	className?: string;
	showIcon?: boolean;
}

export function ExternalLink({ url, fallback = '—', className, showIcon = true }: ExternalLinkProps) {
	if (!url) {
		return <span className={`text-muted ${className}`}>{fallback}</span>;
	}

	return (
		<Link href={url} target="_blank" className={`font-mono text-sm break-all ${className}`}>
			{url}
			{showIcon && <Link.Icon />}
		</Link>
	);
}

