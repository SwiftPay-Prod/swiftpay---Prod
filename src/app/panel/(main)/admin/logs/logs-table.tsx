'use client';

import { Suspense, use, useState, type ReactNode } from 'react';
import { Button, Chip, Modal, Tooltip } from '@heroui/react';
import { Clock01Icon, File01Icon, Mail01Icon, TextFontIcon, UserCircle02Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn, DataTableFiltersProps } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { JsonCodeBlock } from '@/components/ui/json-code-block';
import {
	acquirerTypeParse,
	adminLogTypeParse,
	getAdminEmailTemplateParse,
	getAdminLogActionParse,
	getAdminLogStatusParse,
	mapParseColorToChipColor,
	pageSizeFilterOptions,
	apiActionFilterOptions,
	securityActionFilterOptions,
	emailTemplateFilterOptions,
} from '@/parse';
import { formatDate, formatRelativeTime } from '@/utils/datetime';
import { formatDocument as formatDocumentMask, formatPhone } from '@/utils/input-masks';
import type { AdminLogEntry, AdminLogType } from '@/types/admin/logs';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import type { ApiResponse, Paginated } from '@/types/common';
import type { Filters } from './page';
import { useLogsTable } from './use-logs-table';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import Image from 'next/image';
import { AcquirerType } from '@/types/enums';

type LogsPromise = Promise<ApiResponse<Paginated<AdminLogEntry>>>;

interface LogsTableProps {
	fetchPromise: LogsPromise | null;
	filters: Filters;
}

const logTabs: AdminLogType[] = ['Api', 'Security', 'Email', 'AcquirerWebhook', 'Profiler'];
const logTypeTabItems: InternalTabItem[] = logTabs.map((type) => ({
	id: type,
	label: adminLogTypeParse[type].label,
	icon: adminLogTypeParse[type].icon,
}));

function formatValue(value?: string | number | null) {
	if (value === undefined || value === null || value === '') return '-';
	return String(value);
}

function getAcquirerWebhookStatus(statusCode?: number | null): { label: string; color: 'default' | 'success' | 'warning' | 'danger' } {
	if (statusCode === null || statusCode === undefined) {
		return { label: 'Sem status', color: 'default' };
	}

	if (statusCode >= 200 && statusCode < 300) {
		return { label: 'Sucesso', color: 'success' };
	}

	if (statusCode >= 400 && statusCode < 500) {
		return { label: 'Erro 4xx', color: 'warning' };
	}

	if (statusCode >= 500) {
		return { label: 'Erro 5xx', color: 'danger' };
	}

	return { label: `HTTP ${statusCode}`, color: 'default' };
}

function getAcquirerDisplayName(log: AdminLogEntry): string {
	const values = [log.acquirerDisplayName, log.acquirerCode, log.acquirerType]
		.map((value) => value?.trim())
		.filter((value): value is string => !!value && value !== '-');

	return values[0] ?? '-';
}

function getAcquirerTypeLabel(log: AdminLogEntry): string | null {
	const type = log.acquirerType?.trim();
	if (!type || type === '-') return null;

	if (type in acquirerTypeParse) {
		return acquirerTypeParse[type as AcquirerType].label;
	}

	return type;
}

function resolveAcquirerLogoUrl(log: AdminLogEntry, catalog: AdminAcquirerData[]): string | null {
	if (log.acquirerLogoUrl?.trim()) return log.acquirerLogoUrl;

	const acquirerFromCatalog =
		catalog.find((item) => item.id === log.acquirerId) ??
		catalog.find((item) => item.code === log.acquirerCode) ??
		catalog.find((item) => item.type === log.acquirerType);

	return acquirerFromCatalog?.logoUrl ?? null;
}

function AcquirerIdentity({ log, catalog = [] }: { log: AdminLogEntry; catalog?: AdminAcquirerData[] }) {
	const displayName = getAcquirerDisplayName(log);
	const typeLabel = getAcquirerTypeLabel(log);
	const logoUrl = resolveAcquirerLogoUrl(log, catalog);
	const initial = displayName !== '-' ? displayName.charAt(0).toUpperCase() : 'A';

	return (
		<div className="flex items-center gap-2">
			{logoUrl ? (
				<Image
					src={logoUrl}
					alt={displayName}
					width={32}
					height={32}
					className="rounded-md border border-divider object-cover shrink-0"
				/>
			) : (
				<div className="h-8 w-8 rounded-md border border-divider bg-content1 text-xs text-muted flex items-center justify-center shrink-0">
					{initial}
				</div>
			)}
			<div className="flex flex-col min-w-0">
				<span className="text-sm text-foreground line-clamp-1">{displayName}</span>
				{typeLabel && <span className="text-xs text-muted line-clamp-1">{typeLabel}</span>}
			</div>
		</div>
	);
}

function tryParseJson(value?: string | null): Record<string, unknown> | null {
	if (!value) return null;
	try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
		return parsed as Record<string, unknown>;
	} catch {
		return null;
	}
}

function getCredentialDisplay(log: AdminLogEntry): string {
	if (log.credentialId) return log.credentialId;

	const request = tryParseJson(log.requestBody);
	const keys = request?.credentialKeys;
	if (Array.isArray(keys) && keys.length > 0) {
		const normalizedKeys = keys.filter((key): key is string => typeof key === 'string' && key.trim().length > 0);
		if (normalizedKeys.length > 0) return `Keys: ${normalizedKeys.join(', ')}`;
	}

	return '-';
}

function getErrorDisplay(log: AdminLogEntry): string {
	if (log.errorCode) return log.errorCode;

	const response = tryParseJson(log.responseBody);
	const message = response?.message;
	if (typeof message === 'string' && message.trim().length > 0) return message;

	const error = response?.error;
	if (error && typeof error === 'object' && !Array.isArray(error)) {
		const errorMessage = (error as Record<string, unknown>).message;
		if (typeof errorMessage === 'string' && errorMessage.trim().length > 0) return errorMessage;
	}

	const details = response?.errors;
	if (details && typeof details === 'object' && !Array.isArray(details)) {
		const firstEntry = Object.values(details as Record<string, unknown>)[0];
		if (typeof firstEntry === 'string' && firstEntry.trim().length > 0) return firstEntry;
		if (Array.isArray(firstEntry)) {
			const firstArrayError = firstEntry.find(
				(item): item is string => typeof item === 'string' && item.trim().length > 0
			);
			if (firstArrayError) return firstArrayError;
		}
	}

	return '-';
}

function getDetailsDisplay(log: AdminLogEntry): string {
	if (log.details && log.details.trim().length > 0) return log.details;

	const error = getErrorDisplay(log);
	if (error !== '-') return error;

	return `Ação: ${formatValue(log.action)} | Status: ${formatValue(log.status)} | Recurso: ${formatValue(log.resourceType)} (${formatValue(log.resourceId)})`;
}

function formatDocumentValue(value?: string | null) {
	if (!value) return '-';
	return formatDocumentMask(value, undefined, value);
}

function formatContactValue(value?: string | null) {
	if (!value) return '-';
	if (value.includes('@')) return value;
	const digits = value.replace(/\D/g, '');
	if (digits.length < 10) return value;
	return formatPhone(value, value);
}

function ApiLogDetailsModal({
	log,
	isOpen,
	onOpenChange,
}: {
	log: AdminLogEntry | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	if (!log) return null;
	const actionParse = getAdminLogActionParse(log);
	const statusParse = getAdminLogStatusParse(log.status);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={File01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes do Log</Modal.Heading>
						<p className="text-sm text-muted">Informações completas do evento registrado.</p>
					</Modal.Header>
					<Modal.Body>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted">Tipo</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(adminLogTypeParse.Api.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{adminLogTypeParse.Api.icon}
									{adminLogTypeParse.Api.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted">Status</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(statusParse.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{statusParse.icon}
									{statusParse.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Ação</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(actionParse.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{actionParse.icon}
									{actionParse.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Código HTTP</span>
								<span className="text-sm text-foreground">{formatValue(log.statusCode)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Criado em</span>
								<span className="text-sm text-foreground">{formatDate(log.createdAt)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Erro</span>
								<span className="text-sm text-foreground">{getErrorDisplay(log)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Endpoint</span>
								<span className="text-sm text-foreground">
									{log.httpMethod ? `${log.httpMethod} ` : ''}
									{formatValue(log.endpoint)}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Organização</span>
								<span className="text-sm text-foreground">{formatValue(log.merchantName)}</span>
								<span className="text-xs text-muted">{formatDocumentValue(log.merchantDocument)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Merchant ID</span>
								<span className="text-sm text-foreground">{formatValue(log.merchantId)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Credencial</span>
								<span className="text-sm text-foreground">{getCredentialDisplay(log)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Processadora</span>
								<span className="text-sm text-foreground">{formatValue(log.acquirerType)}</span>
								<span className="text-xs text-muted">{formatValue(log.acquirerId)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Recurso</span>
								<span className="text-sm text-foreground">{formatValue(log.resourceType)}</span>
								<span className="text-xs text-muted">{formatValue(log.resourceId)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Tempo de resposta</span>
								<span className="text-sm text-foreground">{log.responseTimeMs ? `${log.responseTimeMs} ms` : '-'}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">IP</span>
								<span className="text-sm text-foreground">{formatValue(log.ipAddress)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Localização</span>
								<span className="text-sm text-foreground">{formatValue(log.location)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">User-Agent</span>
								<span className="text-sm text-foreground wrap-break-word">{formatValue(log.userAgent)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Detalhes</span>
								<div className="rounded-lg bg-content1 p-3 text-xs text-muted whitespace-pre-wrap wrap-break-word">
									{getDetailsDisplay(log)}
								</div>
							</div>
							<JsonCodeBlock label="Request" value={log.requestBody} />
							<JsonCodeBlock label="Resposta" value={log.responseBody} />
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

function SecurityLogDetailsModal({
	log,
	isOpen,
	onOpenChange,
}: {
	log: AdminLogEntry | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	if (!log) return null;
	const actionParse = getAdminLogActionParse(log);
	const statusParse = getAdminLogStatusParse(log.status);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={File01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes do Log</Modal.Heading>
						<p className="text-sm text-muted">Informações completas do evento registrado.</p>
					</Modal.Header>
					<Modal.Body>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted">Tipo</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(adminLogTypeParse.Security.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{adminLogTypeParse.Security.icon}
									{adminLogTypeParse.Security.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted">Status</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(statusParse.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{statusParse.icon}
									{statusParse.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Ação</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(actionParse.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{actionParse.icon}
									{actionParse.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Criado em</span>
								<span className="text-sm text-foreground">{formatDate(log.createdAt)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Usuário</span>
								<span className="text-sm text-foreground">{formatValue(log.userEmail)}</span>
								<span className="text-xs text-muted">{formatValue(log.userId)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Serviço</span>
								<span className="text-sm text-foreground">{formatValue(log.serviceName)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">IP</span>
								<span className="text-sm text-foreground">{formatValue(log.ipAddress)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Localização</span>
								<span className="text-sm text-foreground">{formatValue(log.location)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">User-Agent</span>
								<span className="text-sm text-foreground wrap-break-word">{formatValue(log.userAgent)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Detalhes</span>
								<div className="rounded-lg bg-content1 p-3 text-xs text-muted whitespace-pre-wrap wrap-break-word">
									{formatValue(log.details)}
								</div>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

function EmailLogDetailsModal({
	log,
	isOpen,
	onOpenChange,
}: {
	log: AdminLogEntry | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	if (!log) return null;
	const statusParse = getAdminLogStatusParse(log.emailStatus ?? log.status);
	const templateParse = getAdminEmailTemplateParse(log.emailTemplate);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={File01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes do Log</Modal.Heading>
						<p className="text-sm text-muted">Informações completas do evento registrado.</p>
					</Modal.Header>
					<Modal.Body>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted">Tipo</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(adminLogTypeParse.Email.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{adminLogTypeParse.Email.icon}
									{adminLogTypeParse.Email.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted">Status</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(statusParse.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{statusParse.icon}
									{statusParse.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Criado em</span>
								<span className="text-sm text-foreground">{formatDate(log.createdAt)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Organização</span>
								<span className="text-sm text-foreground">{formatValue(log.merchantName)}</span>
								<span className="text-xs text-muted">{formatDocumentValue(log.merchantDocument)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Merchant ID</span>
								<span className="text-sm text-foreground">{formatValue(log.merchantId)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Usuário</span>
								<span className="text-sm text-foreground">{formatValue(log.userId)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Destinatário</span>
								<span className="text-sm text-foreground">{formatContactValue(log.emailTo)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Template</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(templateParse.color)}
									size="sm"
									className="gap-1 w-fit"
								>
									{templateParse.icon}
									{templateParse.label}
								</Chip>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Assunto</span>
								<span className="text-sm text-foreground">{formatValue(log.emailSubject)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Serviço</span>
								<span className="text-sm text-foreground">{formatValue(log.serviceName)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">IP</span>
								<span className="text-sm text-foreground">{formatValue(log.ipAddress)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Tempo de envio</span>
								<span className="text-sm text-foreground">
									{log.emailSendTimeMs ? `${log.emailSendTimeMs} ms` : '-'}
								</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Parâmetros</span>
								<div className="rounded-lg bg-content1 p-3 text-xs text-muted whitespace-pre-wrap wrap-break-word">
									{formatValue(log.emailParameters)}
								</div>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Erro</span>
								<div className="rounded-lg bg-content1 p-3 text-xs text-muted whitespace-pre-wrap wrap-break-word">
									{formatValue(log.emailErrorMessage)}
								</div>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Detalhes</span>
								<div className="rounded-lg bg-content1 p-3 text-xs text-muted whitespace-pre-wrap wrap-break-word">
									{formatValue(log.details)}
								</div>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

function AcquirerWebhookDetailsModal({
	log,
	isOpen,
	onOpenChange,
}: {
	log: AdminLogEntry | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	if (!log) return null;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={File01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Webhook da Processadora</Modal.Heading>
						<p className="text-sm text-muted">Payload recebido da processadora com metadados da requisição.</p>
					</Modal.Header>
					<Modal.Body>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Processadora</span>
								<AcquirerIdentity log={log} />
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Acquirer ID</span>
								<span className="text-sm text-foreground">{formatValue(log.acquirerId)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Criado em</span>
								<span className="text-sm text-foreground">{formatDate(log.createdAt)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Status HTTP</span>
								<span className="text-sm text-foreground">{formatValue(log.statusCode)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">Endpoint</span>
								<span className="text-sm text-foreground">
									{log.httpMethod ? `${log.httpMethod} ` : ''}
									{formatValue(log.endpoint)}
								</span>
								<span className="text-xs text-muted wrap-break-word">{formatValue(log.queryString)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">IP</span>
								<span className="text-sm text-foreground">{formatValue(log.ipAddress)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Localização</span>
								<span className="text-sm text-foreground">{formatValue(log.location)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Correlation ID</span>
								<span className="text-sm text-foreground wrap-break-word">{formatValue(log.correlationId)}</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted">Content-Type</span>
								<span className="text-sm text-foreground">{formatValue(log.contentType)}</span>
								<span className="text-xs text-muted">Length: {formatValue(log.contentLength)}</span>
							</div>
							<div className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs text-muted">User-Agent</span>
								<span className="text-sm text-foreground wrap-break-word">{formatValue(log.userAgent)}</span>
							</div>
							<JsonCodeBlock label="Headers" value={log.requestHeaders} />
							<JsonCodeBlock label="Payload" value={log.requestBody} />
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

function getApiColumns(onView: (log: AdminLogEntry) => void, acquirerCatalog: AdminAcquirerData[]): DataTableColumn<AdminLogEntry>[] {
	return [
		{
			key: 'action',
			header: 'Ação',
			sortable: false,
			render: (log) => {
				const actionParse = getAdminLogActionParse(log);
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(actionParse.color)} size="sm" className="gap-1">
						{actionParse.icon}
						{actionParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (log) => {
				const statusParse = getAdminLogStatusParse(log.status);
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
						{statusParse.icon}
						{statusParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'code',
			header: 'Código',
			render: (log) => <span className="text-sm text-muted">{log.statusCode ?? '-'}</span>,
		},
		{
			key: 'error',
			header: 'Erro',
			render: (log) => <span className="text-sm text-muted">{log.errorCode ?? '-'}</span>,
		},
		{
			key: 'merchant',
			header: 'Organização',
			render: (log) => (
				<div className="flex flex-col">
					<AdminMerchantLink
						merchantId={log.merchantId}
						name={log.merchantName}
						className="text-sm text-accent hover:underline"
					/>
					<span className="text-xs text-muted">
						{log.merchantDocument ? formatDocumentValue(log.merchantDocument) : (log.merchantId ?? '-')}
					</span>
				</div>
			),
		},
		{
			key: 'acquirer',
			header: 'Processadora',
			render: (log) => <AcquirerIdentity log={log} catalog={acquirerCatalog} />,
		},
		{
			key: 'endpoint',
			header: 'Endpoint',
			render: (log) => (
				<span className="text-sm text-muted">
					{log.httpMethod ? `${log.httpMethod} ` : ''}
					{log.endpoint ?? '-'}
				</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (log) => <span className="text-sm text-muted">{formatDate(log.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (log) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onView(log)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function getSecurityColumns(onView: (log: AdminLogEntry) => void): DataTableColumn<AdminLogEntry>[] {
	return [
		{
			key: 'action',
			header: 'Ação',
			sortable: false,
			render: (log) => {
				const actionParse = getAdminLogActionParse(log);
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(actionParse.color)} size="sm" className="gap-1">
						{actionParse.icon}
						{actionParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (log) => {
				const statusParse = getAdminLogStatusParse(log.status);
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
						{statusParse.icon}
						{statusParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'user',
			header: 'Usuário',
			render: (log) => <span className="text-sm text-muted">{log.userEmail ?? '-'}</span>,
		},
		{
			key: 'details',
			header: 'Detalhes',
			sortable: false,
			render: (log) => {
				const content = log.details ?? '-';
				return (
					<Tooltip>
						<span className="text-sm text-muted line-clamp-1 max-w-80">{content}</span>
						<Tooltip.Content>{content}</Tooltip.Content>
					</Tooltip>
				);
			},
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (log) => <span className="text-sm text-muted">{formatDate(log.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (log) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onView(log)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function getEmailColumns(onView: (log: AdminLogEntry) => void): DataTableColumn<AdminLogEntry>[] {
	return [
		{
			key: 'status',
			header: 'Status',
			render: (log) => {
				const statusParse = getAdminLogStatusParse(log.emailStatus ?? log.status);
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
						{statusParse.icon}
						{statusParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'to',
			header: 'Destinatário',
			render: (log) => <span className="text-sm text-muted">{formatContactValue(log.emailTo)}</span>,
		},
		{
			key: 'subject',
			header: 'Assunto',
			render: (log) => <span className="text-sm text-muted">{log.emailSubject ?? '-'}</span>,
		},
		{
			key: 'template',
			header: 'Template',
			sortable: false,
			render: (log) => {
				const templateParse = getAdminEmailTemplateParse(log.emailTemplate);
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(templateParse.color)} size="sm" className="gap-1">
						{templateParse.icon}
						{templateParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'merchant',
			header: 'Organização',
			render: (log) => (
				<div className="flex flex-col">
					<AdminMerchantLink
						merchantId={log.merchantId}
						name={log.merchantName}
						className="text-sm text-accent hover:underline"
					/>
					<span className="text-xs text-muted">
						{log.merchantDocument ? formatDocumentValue(log.merchantDocument) : (log.merchantId ?? '-')}
					</span>
				</div>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (log) => <span className="text-sm text-muted">{formatDate(log.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (log) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onView(log)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function getAcquirerWebhookColumns(
	onView: (log: AdminLogEntry) => void,
	acquirerCatalog: AdminAcquirerData[]
): DataTableColumn<AdminLogEntry>[] {
	return [
		{
			key: 'acquirer',
			header: 'Processadora',
			render: (log) => <AcquirerIdentity log={log} catalog={acquirerCatalog} />,
		},
		{
			key: 'status',
			header: 'Status',
			render: (log) => {
				const status = getAcquirerWebhookStatus(log.statusCode);
				return (
					<Chip variant="soft" color={status.color} size="sm">
						{status.label}
					</Chip>
				);
			},
		},
		{
			key: 'request',
			header: 'Requisição',
			render: (log) => (
				<span className="text-sm text-muted">
					{log.httpMethod ? `${log.httpMethod} ` : ''}
					{log.endpoint ?? '-'}
				</span>
			),
		},
		{
			key: 'ip',
			header: 'IP',
			render: (log) => <span className="text-sm text-muted">{log.ipAddress ?? '-'}</span>,
		},
		{
			key: 'contentType',
			header: 'Content-Type',
			render: (log) => <span className="text-sm text-muted">{log.contentType ?? '-'}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (log) => <span className="text-sm text-muted">{formatDate(log.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (log) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onView(log)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileLogCard(log: AdminLogEntry, index: number, openActions?: () => void): ReactNode {
	const isApiLog = !!log.endpoint;
	const isEmailLog = !!log.emailTo;
	const isSecurityLog = !isApiLog && !isEmailLog && !!log.userEmail;

	const actionParse = getAdminLogActionParse(log);
	const statusParse = getAdminLogStatusParse(
		isEmailLog ? (log.emailStatus ?? log.status) : log.status
	);

	return (
		<div
			key={log.id}
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={
				openActions
					? (event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								openActions();
							}
						}
					: undefined
			}
		>
			{isApiLog && (
				<>
					<div className="flex items-center gap-2 mb-2">
						<Chip variant="soft" color={mapParseColorToChipColor(actionParse.color)} size="sm" className="gap-1">
							{actionParse.icon}
							{actionParse.label}
						</Chip>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
					</div>

					<div className="flex flex-col gap-1.5">
						{(log.statusCode || log.errorCode) && (
							<div className="flex items-center gap-2 text-xs">
								{log.statusCode && (
									<span className="text-muted">
										Código: <span className="font-mono">{log.statusCode}</span>
									</span>
								)}
								{log.errorCode && (
									<span className="text-muted">
										Erro: <span className="font-mono">{log.errorCode}</span>
									</span>
								)}
							</div>
						)}

						{log.merchantId && (
							<div className="flex flex-col gap-0.5">
								<AdminMerchantLink
									merchantId={log.merchantId}
									name={log.merchantName}
									className="text-xs text-accent hover:underline"
								/>
								<span className="text-xs text-muted pl-5">
									{log.merchantDocument ? formatDocumentValue(log.merchantDocument) : (log.merchantId ?? '-')}
								</span>
							</div>
						)}

						{(log.acquirerDisplayName || log.acquirerType || log.acquirerCode) && (
							<div className="flex items-center gap-1 text-xs text-muted">
								<span>Processadora: {getAcquirerDisplayName(log)}</span>
							</div>
						)}

						{log.endpoint && (
							<div className="flex items-center gap-1 text-xs text-muted font-mono">
								{log.httpMethod && <span className="font-semibold">{log.httpMethod}</span>}
								<span>{log.endpoint}</span>
							</div>
						)}

						<div className="flex items-center gap-1 text-xs text-muted pt-1">
							<Icon icon={Clock01Icon} className="icon-xs" />
							<span title={formatDate(log.createdAt)}>{formatRelativeTime(log.createdAt)}</span>
						</div>
					</div>
				</>
			)}

			{isSecurityLog && (
				<>
					<div className="flex items-center gap-2 mb-2">
						<Chip variant="soft" color={mapParseColorToChipColor(actionParse.color)} size="sm" className="gap-1">
							{actionParse.icon}
							{actionParse.label}
						</Chip>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
					</div>

					<div className="flex flex-col gap-1.5">
						{log.userEmail && (
							<div className="flex items-center gap-1 text-xs text-muted">
								<Icon icon={UserCircle02Icon} className="icon-xs" />
								<span>{log.userEmail}</span>
							</div>
						)}

						{log.details && (
							<div className="flex items-start gap-1 text-xs text-muted">
								<Icon icon={TextFontIcon} className="icon-xs shrink-0 mt-0.5" />
								<span className="line-clamp-2">{log.details}</span>
							</div>
						)}

						<div className="flex items-center gap-1 text-xs text-muted pt-1">
							<Icon icon={Clock01Icon} className="icon-xs" />
							<span title={formatDate(log.createdAt)}>{formatRelativeTime(log.createdAt)}</span>
						</div>
					</div>
				</>
			)}

			{isEmailLog && (
				<>
					<div className="flex items-center gap-2 mb-2">
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
						{log.emailTemplate && (
							<Chip
								variant="soft"
								color={mapParseColorToChipColor(getAdminEmailTemplateParse(log.emailTemplate).color)}
								size="sm"
								className="gap-1"
							>
								{getAdminEmailTemplateParse(log.emailTemplate).icon}
								{getAdminEmailTemplateParse(log.emailTemplate).label}
							</Chip>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						{log.emailTo && (
							<div className="flex items-center gap-1 text-xs text-muted">
								<Icon icon={Mail01Icon} className="icon-xs" />
								<span>{formatContactValue(log.emailTo)}</span>
							</div>
						)}

						{log.emailSubject && (
							<div className="flex items-start gap-1 text-xs text-muted">
								<Icon icon={TextFontIcon} className="icon-xs shrink-0 mt-0.5" />
								<span className="line-clamp-1">{log.emailSubject}</span>
							</div>
						)}

						{log.merchantId && (
							<div className="flex flex-col gap-0.5">
								<AdminMerchantLink
									merchantId={log.merchantId}
									name={log.merchantName}
									className="text-xs text-accent hover:underline"
								/>
								<span className="text-xs text-muted pl-5">
									{log.merchantDocument ? formatDocumentValue(log.merchantDocument) : (log.merchantId ?? '-')}
								</span>
							</div>
						)}

						<div className="flex items-center gap-1 text-xs text-muted pt-1">
							<Icon icon={Clock01Icon} className="icon-xs" />
							<span title={formatDate(log.createdAt)}>{formatRelativeTime(log.createdAt)}</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function LogsTableContent({
	fetchPromise,
	columns,
	minWidth,
	changePage,
	onSortChange,
	sortBy,
	sortOrder,
	isPending,
	filters,
}: {
	fetchPromise: LogsPromise;
	columns: DataTableColumn<AdminLogEntry>[];
	minWidth: string;
	changePage: (page: number) => void;
	onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	isPending: boolean;
	filters?: DataTableFiltersProps;
}) {
	const { data: responseData } = use(fetchPromise) ?? { data: null };
	const items = responseData ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

	return (
		<DataTable
			columns={columns}
			data={items.items}
			keyExtractor={(log) => log.id}
			renderMobileCard={renderMobileLogCard}
			isLoading={isPending}
			minWidth={minWidth}
			filters={filters}
			pagination={{
				page: items.page,
				pageSize: items.pageSize,
				totalItems: items.totalItems,
				totalPages: items.totalPages,
				onPageChange: changePage,
				sortBy,
				sortOrder,
				onSortChange,
				isNavigating: isPending,
			}}
		/>
	);
}

function LogsTableFallback({
	columns,
	minWidth,
	pageSize,
	filters,
}: {
	columns: DataTableColumn<AdminLogEntry>[];
	minWidth: string;
	pageSize: number;
	filters?: DataTableFiltersProps;
}) {
	return (
		<DataTable
			columns={columns}
			data={[]}
			keyExtractor={() => 'loading'}
			isLoading={true}
			skeletonRows={pageSize}
			minWidth={minWidth}
			filters={filters}
		/>
	);
}

function ProfilerContent() {
	const [selectedApi, setSelectedApi] = useState<'main' | 'payment'>('main');
	const mainUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
	const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL ?? '';
	const iframeUrl =
		selectedApi === 'main'
			? `${mainUrl}/profiler/results-index`
			: `${paymentUrl}/profiler/results-index`;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex gap-2">
				<Button
					variant={selectedApi === 'main' ? 'secondary' : 'tertiary'}
					size="sm"
					onPress={() => setSelectedApi('main')}
				>
					API Principal
				</Button>
				<Button
					variant={selectedApi === 'payment' ? 'secondary' : 'tertiary'}
					size="sm"
					onPress={() => setSelectedApi('payment')}
				>
					API de Pagamentos
				</Button>
			</div>
			<div className="overflow-hidden rounded-lg border border-content2 bg-content1">
				<iframe
					src={iframeUrl}
					className="h-175 w-full border-0"
					title={selectedApi === 'main' ? 'MiniProfiler - API Principal' : 'MiniProfiler - API de Pagamentos'}
				/>
			</div>
		</div>
	);
}

export function LogsTable({ fetchPromise, filters }: LogsTableProps) {
	const { filters: filterState, actions, isPending } = useLogsTable({ filters });
	const logType = filterState.values.type;
	const [selectedLog, setSelectedLog] = useState<AdminLogEntry | null>(null);
	const [isDetailsOpen, setDetailsOpen] = useState(false);

	if (logType === 'Profiler') {
		return (
			<div className="flex flex-col gap-4">
				<PageHeader
					icon={<Icon icon={File01Icon} size={24} />}
					title="Logs"
					description="Auditoria de erros e eventos da plataforma."
				/>
				<div className="rounded-lg border border-content2 bg-surface">
					<div className="border-b border-content2 px-4 pt-4 pb-0">
						<InternalTabs
							ariaLabel="Tipos de logs"
							items={logTypeTabItems}
							selectedKey={logType}
							onSelectionChange={(value) => actions.setType(value as AdminLogType)}
						/>
					</div>
					<div className="p-4">
						<ProfilerContent />
					</div>
				</div>
			</div>
		);
	}

	const searchPlaceholder =
		logType === 'Security'
			? 'Usuário ou detalhes...'
			: logType === 'Email'
				? 'Destinatário, assunto ou template...'
				: logType === 'AcquirerWebhook'
					? 'Payload, headers, endpoint ou IP...'
				: 'Endpoint, detalhes ou erro...';

	const renderFiltersContent = () => (
		<>
			<div className="col-span-full">
				<InternalTabs
					ariaLabel="Tipos de logs"
					items={logTypeTabItems}
					selectedKey={logType}
					onSelectionChange={(value) => actions.setType(value as AdminLogType)}
				/>
			</div>

			<SearchFilter
				label="Buscar"
				placeholder={searchPlaceholder}
				value={filterState.values.search}
				onChange={(value) => filterState.updateFilter('search', value)}
				className="w-full"
			/>

			<AsyncCombobox
				label="Organização"
				placeholder="Selecione uma organização"
				searchPlaceholder="Buscar por nome ou documento da organização"
				searchValue={filterState.merchant.search}
				selectedValue={filterState.merchant.selectedName}
				isLoading={filterState.merchant.isLoading}
				options={filterState.merchant.options}
				value={filterState.merchant.value}
				onSearchChange={filterState.merchant.onSearchChange}
				onChange={filterState.merchant.onChange}
				className="w-full"
			/>

			<AsyncCombobox
				label="Processadora"
				placeholder="Selecione uma processadora"
				searchPlaceholder="Buscar por nome ou codigo da processadora"
				searchValue={filterState.acquirer.search}
				selectedValue={filterState.acquirer.selectedDisplayName}
				isLoading={filterState.acquirer.isLoading}
				options={filterState.acquirer.options.map((option) => {
					const rawOption = filterState.acquirer.rawOptions.find((item) => item.id === option.key);
					const displayName = option.label;

					return {
						...option,
						endContent: rawOption?.logoUrl ? (
							<Image
								src={rawOption.logoUrl}
								alt={displayName}
								width={20}
								height={20}
								className="rounded-sm border border-divider object-cover shrink-0"
							/>
						) : null,
					};
				})}
				value={filterState.acquirer.value}
				onSearchChange={filterState.acquirer.onSearchChange}
				onChange={filterState.acquirer.onChange}
				className="w-full"
			/>

			{logType === 'Api' && (
				<SearchFilter
					label="Status"
					placeholder="Código HTTP"
					value={filterState.values.statusCode}
					onChange={(value) => filterState.updateFilter('statusCode', value)}
					className="w-full"
				/>
			)}

			{logType === 'Api' && (
				<SelectFilter
					label="Ação"
					value={filterState.values.action || 'all'}
					options={apiActionFilterOptions}
					onChange={(value) => filterState.updateFilter('action', value === 'all' ? '' : value)}
					className="w-full"
				/>
			)}

			{logType === 'Security' && (
				<SelectFilter
					label="Ação"
					value={filterState.values.action || 'all'}
					options={securityActionFilterOptions}
					onChange={(value) => filterState.updateFilter('action', value === 'all' ? '' : value)}
					className="w-full"
				/>
			)}

			{logType === 'Email' && (
				<SelectFilter
					label="Template"
					value={filterState.values.action || 'all'}
					options={emailTemplateFilterOptions}
					onChange={(value) => filterState.updateFilter('action', value === 'all' ? '' : value)}
					className="w-full"
				/>
			)}

			<SelectFilter
				label="Por página"
				value={filterState.values.pageSize}
				options={pageSizeFilterOptions}
				onChange={(value) => filterState.updateFilter('pageSize', value)}
				className="w-full"
			/>
		</>
	);

	const minWidth = logType === 'Security' ? '1200px' : logType === 'Email' ? '1300px' : logType === 'AcquirerWebhook' ? '1400px' : '1600px';
	const columns =
		logType === 'Security'
			? getSecurityColumns((log) => {
					setSelectedLog(log);
					setDetailsOpen(true);
				})
			: logType === 'Email'
				? getEmailColumns((log) => {
						setSelectedLog(log);
						setDetailsOpen(true);
					})
				: logType === 'AcquirerWebhook'
					? getAcquirerWebhookColumns((log) => {
							setSelectedLog(log);
							setDetailsOpen(true);
					  }, filterState.acquirer.catalog)
				: getApiColumns((log) => {
						setSelectedLog(log);
						setDetailsOpen(true);
					}, filterState.acquirer.catalog);

	const dataTableFilters: DataTableFiltersProps = {
		children: renderFiltersContent,
		hasFilters: filterState.hasFilters,
		onApply: actions.applyFilters,
		onClear: filterState.clear,
		onRefresh: actions.refresh,
		isApplying: isPending,
		isRefreshing: isPending,
	};

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={File01Icon} size={24} />}
				title="Logs"
				description="Auditoria de erros e eventos da plataforma."
			/>

			<Suspense
				fallback={
					<LogsTableFallback
						columns={columns}
						minWidth={minWidth}
						pageSize={Number(filterState.values.pageSize)}
						filters={dataTableFilters}
					/>
				}
			>
				<LogsTableContent
					fetchPromise={fetchPromise!}
					columns={columns}
					minWidth={minWidth}
					changePage={actions.changePage}
					onSortChange={actions.handleSortChange}
					sortBy={filterState.values.sortBy}
					sortOrder={filterState.values.sortOrder}
					isPending={isPending}
					filters={dataTableFilters}
				/>
			</Suspense>

			{logType === 'Security' && (
				<SecurityLogDetailsModal log={selectedLog} isOpen={isDetailsOpen} onOpenChange={setDetailsOpen} />
			)}
			{logType === 'Email' && (
				<EmailLogDetailsModal log={selectedLog} isOpen={isDetailsOpen} onOpenChange={setDetailsOpen} />
			)}
			{logType === 'Api' && (
				<ApiLogDetailsModal log={selectedLog} isOpen={isDetailsOpen} onOpenChange={setDetailsOpen} />
			)}
			{logType === 'AcquirerWebhook' && (
				<AcquirerWebhookDetailsModal log={selectedLog} isOpen={isDetailsOpen} onOpenChange={setDetailsOpen} />
			)}
		</div>
	);
}
