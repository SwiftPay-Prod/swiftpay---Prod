'use client';

import { Button, Chip, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddSquareIcon,
	ArrowReloadHorizontalIcon,
	ArrowUpRight01Icon,
	Copy01Icon,
	Delete02Icon,
	InformationCircleIcon,
	Key01Icon,
	ShieldKeyIcon,
	SortingDownIcon,
	SortingUpIcon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import { usePublicConfig } from '@/contexts/public-config-context';
import type { ApiCredentialListData } from '@/types/merchant/api-credentials';
import type { Filters } from './page';
import type { Paginated, ApiResponse } from '@/types/common';
import { MerchantApiCredentialStatus } from '@/types/enums';
import {
	merchantApiCredentialEnvironmentParse,
	merchantApiCredentialStatusParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { CreateCredentialModal } from './modals/create-credential-modal';
import { ViewCredentialModal } from './modals/view-credential-modal';
import { useApiCredentialsTable } from './use-api-credentials-table';

type CredentialsPromise = Promise<ApiResponse<Paginated<ApiCredentialListData>>>;

interface ApiCredentialsTableProps {
	fetchPromise: CredentialsPromise;
	merchantId: string;
	filters: Filters;
}

const environmentOptions = parseToFilterOptions(merchantApiCredentialEnvironmentParse, 'Todos os ambientes');
const statusOptions = parseToFilterOptions(merchantApiCredentialStatusParse, 'Todos os status');

interface ColumnsConfig {
	onView: (credential: ApiCredentialListData) => void;
	onRegenerate: (credential: ApiCredentialListData) => void;
	onDelete: (credential: ApiCredentialListData) => void;
	onCopyClientId: (clientId: string) => void;
}

function getColumns(config: ColumnsConfig): DataTableColumn<ApiCredentialListData>[] {
	return [
		{
			key: 'name',
			header: 'Nome',
			render: (credential) => (
				<div className="flex items-center gap-2">
					<Icon icon={Key01Icon} className="icon-sm text-muted" />
					<span className="font-medium text-foreground">{credential.name || 'Sem nome'}</span>
				</div>
			),
		},
		{
			key: 'clientId',
			header: 'Public Key',
			render: (credential) => (
				<div className="flex items-center gap-2">
					<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
						{credential.clientId.slice(0, 16)}...
					</code>
					<Tooltip>
						<Button isIconOnly size="sm" variant="ghost" onPress={() => config.onCopyClientId(credential.clientId)}>
							<Icon icon={Copy01Icon} className="icon-sm" />
							<Tooltip.Content>Copiar Public Key</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
		{
			key: 'environment',
			header: 'Ambiente',
			render: (credential) => {
				const environmentParsed = merchantApiCredentialEnvironmentParse[credential.environment];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(environmentParsed.color)} size="sm" className="gap-1">
						{environmentParsed.icon}
						{environmentParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (credential) => {
				const statusParsed = merchantApiCredentialStatusParse[credential.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'allowedIpRange',
			header: 'IPs Permitidos',
			render: (credential) =>
				credential.allowedIpRange ? (
					<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
						{credential.allowedIpRange}
					</code>
				) : (
					<span className="text-sm text-muted">Todos</span>
				),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (credential) => <span className="text-sm text-muted">{formatDate(credential.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			render: (credential) => {
				const isRevoked = credential.status === MerchantApiCredentialStatus.Revoked;
				return (
					<div className="flex items-center gap-1">
						<Tooltip>
							<Button isIconOnly size="sm" variant="tertiary" onPress={() => config.onView(credential)}>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>Ver detalhes</Tooltip.Content>
							</Button>
						</Tooltip>
						{!isRevoked && (
							<>
								<Tooltip>
									<Button isIconOnly size="sm" variant="primary" onPress={() => config.onRegenerate(credential)}>
										<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
										<Tooltip.Content>Regenerar chave</Tooltip.Content>
									</Button>
								</Tooltip>
								<Tooltip>
									<Button isIconOnly size="sm" variant="danger" onPress={() => config.onDelete(credential)}>
										<Icon icon={Delete02Icon} className="icon-sm" />
										<Tooltip.Content>Revogar</Tooltip.Content>
									</Button>
								</Tooltip>
							</>
						)}
					</div>
				);
			},
		},
	];
}

function renderMobileApiCredentialCard(
	credential: ApiCredentialListData,
	_index: number,
	openActions?: () => void,
) {
	const statusParsed = merchantApiCredentialStatusParse[credential.status];
	const envParsed = merchantApiCredentialEnvironmentParse[credential.environment];

	return (
		<div
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
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<span className="font-semibold text-sm truncate block">{credential.name || 'Sem nome'}</span>
					<p className="mt-0.5 text-xs font-mono text-muted truncate">{credential.clientId.slice(0, 16)}...</p>
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="shrink-0">
					{statusParsed.label}
				</Chip>
			</div>
			<div className="mt-2 flex items-center gap-1.5 flex-wrap">
				<Chip variant="soft" color={mapParseColorToChipColor(envParsed.color)} size="sm">
					{envParsed.label}
				</Chip>
				<span className="text-xs text-muted truncate">IPs: {credential.allowedIpRange || 'Todos'}</span>
			</div>
			<p className="mt-2 text-xs text-muted">{formatDate(credential.createdAt)}</p>
		</div>
	);
}

export function ApiCredentialsTable({ fetchPromise, merchantId, filters }: ApiCredentialsTableProps) {
	const { integrationUrl, docsUrl } = usePublicConfig();
	const {
		data,
		filters: filterHandlers,
		modals,
		actions,
		context,
	} = useApiCredentialsTable({
		fetchPromise,
		merchantId,
		filters,
	});

	const columns = getColumns({
		onView: modals.view.open,
		onRegenerate: modals.regenerateWarning.open,
		onDelete: modals.deleteWarning.open,
		onCopyClientId: actions.copyClientId,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				key={filterHandlers.values.name === '' ? 'empty' : 'filled'}
				label="Buscar"
				placeholder="Nome da credencial..."
				defaultValue={filterHandlers.values.name}
				onChange={filterHandlers.onSearchChange}
			/>

			<SelectFilter
				label="Ambiente"
				value={filterHandlers.values.environment}
				options={environmentOptions}
				onChange={filterHandlers.onEnvironmentChange}
				allLabel="Todos os ambientes"
			/>

			<SelectFilter
				label="Status"
				value={filterHandlers.values.status}
				options={statusOptions}
				onChange={filterHandlers.onStatusChange}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Por página"
				value={filterHandlers.values.pageSize}
				options={pageSizeFilterOptions}
				onChange={filterHandlers.onPageSizeChange}
				showChips={false}
			/>

			<Tooltip>
				<Button variant="secondary" isIconOnly onPress={filterHandlers.onSortToggle} className="p-4">
					{filterHandlers.values.sortOrder === 'desc' ? (
						<Icon icon={SortingDownIcon} className="icon-sm" />
					) : (
						<Icon icon={SortingUpIcon} className="icon-sm" />
					)}
					<Tooltip.Content>
						{filterHandlers.values.sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigas primeiro'}
					</Tooltip.Content>
				</Button>
			</Tooltip>
		</>
	);

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={ShieldKeyIcon} className="icon-md text-accent-foreground" />}
				title="Credenciais de API"
				description="Gerencie suas chaves de acesso para integração"
				actions={
					<>
						<Button variant="ghost" onClick={() => window.open(docsUrl, '_blank', 'noopener,noreferrer')}>
							<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
							Acessar docs
						</Button>
						{integrationUrl && (
							<Button variant="ghost" onClick={() => window.open(integrationUrl, '_blank', 'noopener,noreferrer')}>
								<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
								Testar API
							</Button>
						)}
						<Button variant="primary" onPress={modals.create.open}>
							<Icon icon={AddSquareIcon} className="icon-sm" />
							Nova Credencial
						</Button>
					</>
				}
			/>

			<DataTable
				columns={columns}
				data={data.items.items}
				keyExtractor={(credential) => credential.id}
				isLoading={data.isLoading}
				skeletonRows={context.filtersFromPage.pageSize ?? 10}
				emptyMessage="Nenhuma credencial encontrada"
				minWidth="min-w-150"
				renderMobileCard={renderMobileApiCredentialCard}
				filters={{
					children: renderFiltersContent,
					hasFilters: filterHandlers.hasFilters,
					onClear: filterHandlers.onClear,
					onRefresh: actions.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.items.page,
					pageSize: data.items.pageSize,
					totalItems: data.items.totalItems,
					totalPages: data.items.totalPages,
					onPageChange: filterHandlers.onPageChange,
					isNavigating: data.isLoading,
				}}
			/>

			<div className="flex items-start gap-2 rounded-xl bg-warning/10 p-4">
				<Icon icon={InformationCircleIcon} className="icon-md shrink-0 text-warning" />
				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium text-foreground">Importante</p>
					<p className="text-sm text-muted">
						O Secret Key é exibido apenas uma vez no momento da criação ou regeneração. Guarde-o em local seguro. Se
						você perder o Secret Key, será necessário regenerar a credencial.
					</p>
				</div>
			</div>

			<CreateCredentialModal
				isOpen={modals.create.isOpen}
				onOpenChange={(isOpen) => (isOpen ? modals.create.open() : modals.create.close())}
				onCreate={actions.requestCreate}
				isPending={context.isActionPending}
			/>

			{modals.newCredential.credential && (
				<ViewCredentialModal
					isOpen={modals.newCredential.isOpen}
					onOpenChange={(isOpen) => !isOpen && modals.newCredential.close()}
					credential={modals.newCredential.credential}
					isNew
				/>
			)}

			{modals.regeneratedCredential.credential && (
				<ViewCredentialModal
					isOpen={modals.regeneratedCredential.isOpen}
					onOpenChange={(isOpen) => !isOpen && modals.regeneratedCredential.close()}
					credential={modals.regeneratedCredential.credential}
					isRegenerated
				/>
			)}

			<ViewCredentialModal
				isOpen={modals.view.isOpen}
				onOpenChange={(isOpen) => !isOpen && modals.view.close()}
				credential={modals.view.credential}
			/>

			<ConfirmationModal
				isOpen={modals.regenerateWarning.isOpen}
				onOpenChange={(isOpen) => !isOpen && modals.regenerateWarning.close()}
				title="Regenerar Credencial"
				description={`Tem certeza que deseja regenerar a credencial "${
					modals.regenerateWarning.credential?.name || 'Sem nome'
				}"? O Secret Key atual será invalidado e um novo será gerado. Você receberá um código de confirmação por e-mail.`}
				status="warning"
				confirmLabel="Continuar"
				isPending={context.isActionPending}
				onConfirm={actions.requestRegenerate}
			/>

			<ConfirmationModal
				isOpen={modals.deleteWarning.isOpen}
				onOpenChange={(isOpen) => !isOpen && modals.deleteWarning.close()}
				title="Revogar Credencial"
				description={`Tem certeza que deseja revogar a credencial "${
					modals.deleteWarning.credential?.name || 'Sem nome'
				}"? Esta ação não pode ser desfeita e todas as integrações que usam esta credencial deixarão de funcionar. Você receberá um código de confirmação por e-mail.`}
				status="danger"
				confirmLabel="Continuar"
				isPending={context.isActionPending}
				onConfirm={actions.requestDelete}
			/>
		</div>
	);
}
