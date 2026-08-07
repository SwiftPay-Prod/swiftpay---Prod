'use client';

import { Avatar, Button, Tooltip } from '@heroui/react';
import { Delete02Icon, ServerStack01Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { AccessAccountRow } from './types';

function maskPassword(password: string): string {
	if (!password) return '-';
	return '*'.repeat(Math.max(password.length, 8));
}

const DESCRIPTION_HIDDEN_PREVIEW_LENGTH = 14;
const DESCRIPTION_COLUMN_PREVIEW_LENGTH = 24;

function hiddenDescriptionPreview(description: string | null): string {
	if (!description) return '-';
	return '*'.repeat(DESCRIPTION_HIDDEN_PREVIEW_LENGTH);
}

function maskLogin(login: string): string {
	if (!login) return '-';

	if (login.includes('@')) {
		const [localPart = '', domainPart = ''] = login.split('@');
		const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
		const maskedLocal = `${visibleLocal}${'*'.repeat(Math.max(localPart.length - visibleLocal.length, 2))}`;

		const [domainName = '', ...domainSuffix] = domainPart.split('.');
		const visibleDomain = domainName.slice(0, Math.min(1, domainName.length));
		const maskedDomainName = `${visibleDomain}${'*'.repeat(Math.max(domainName.length - visibleDomain.length, 2))}`;
		const suffix = domainSuffix.length > 0 ? `.${domainSuffix.join('.')}` : '';

		return `${maskedLocal}@${maskedDomainName}${suffix}`;
	}

	const visiblePart = login.slice(0, Math.min(2, login.length));
	return `${visiblePart}${'*'.repeat(Math.max(login.length - visiblePart.length, 2))}`;
}

function truncateText(value: string, maxLength: number): string {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength)}...`;
}

interface GetColumnsOptions {
	isSensitiveVisible: boolean;
	onOpenDetails: (row: AccessAccountRow) => void;
	onRemoveAccount: (row: AccessAccountRow) => void;
	canEdit: boolean;
	isPending: boolean;
}

export function getAccessAccountColumns({
	isSensitiveVisible,
	onOpenDetails,
	onRemoveAccount,
	canEdit,
	isPending,
}: GetColumnsOptions): DataTableColumn<AccessAccountRow>[] {
	return [
		{
			key: 'acquirer',
			header: 'Adquirente',
			render: (row) => (
				<div className="flex items-center gap-2">
					{row.acquirerLogoUrl ? (
						<Avatar size="sm">
							<Avatar.Image src={row.acquirerLogoUrl} alt={row.acquirerDisplayName} />
							<Avatar.Fallback>
								<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
							</Avatar.Fallback>
						</Avatar>
					) : (
						<div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
							<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
						</div>
					)}
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-sm font-medium text-foreground">{row.acquirerDisplayName}</span>
					</div>
				</div>
			),
		},
		{
			key: 'login',
			header: 'Login',
			render: (row) => (
				<span className="text-sm font-medium">{isSensitiveVisible ? row.login : maskLogin(row.login)}</span>
			),
		},
		{
			key: 'password',
			header: 'Senha',
			render: (row) => (
				<span className="text-sm font-medium">{isSensitiveVisible ? row.password : maskPassword(row.password)}</span>
			),
		},
		{
			key: 'description',
			header: 'Descricao',
			render: (row) => {
				const rawDescription = isSensitiveVisible
					? row.description?.trim() || '-'
					: hiddenDescriptionPreview(row.description);
				const truncatedDescription = truncateText(rawDescription, DESCRIPTION_COLUMN_PREVIEW_LENGTH);

				return (
					<span className="block max-w-52 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted">
						{truncatedDescription}
					</span>
				);
			},
		},
		{
			key: 'actions',
			header: 'Acoes',
			align: 'right',
			sortable: false,
			render: (row) => (
				<div className="flex items-center justify-end gap-1">
					<Tooltip>
						<Button
							isIconOnly
							variant="tertiary"
							size="sm"
							onPress={() => onOpenDetails(row)}
							aria-label="Ver detalhes da conta"
						>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					{canEdit && (
						<Tooltip>
							<Button
								isIconOnly
								variant="tertiary"
								size="sm"
								className="text-danger"
								onPress={() => onRemoveAccount(row)}
								isDisabled={isPending}
								aria-label="Remover conta"
							>
								<Icon icon={Delete02Icon} className="icon-sm" />
								<Tooltip.Content>Remover conta</Tooltip.Content>
							</Button>
						</Tooltip>
					)}
				</div>
			),
		},
	];
}
