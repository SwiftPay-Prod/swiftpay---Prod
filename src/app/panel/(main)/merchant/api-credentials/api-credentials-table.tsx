'use client';

import { Tooltip } from '@heroui/react';
import {
	merchantApiCredentialEnvironmentParse,
	merchantApiCredentialStatusParse,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
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
					<Icon icon={Key01Icon} className="icon-sm text-white/50" />
					<span className="font-medium text-white">{credential.name || 'Sem nome'}</span>
				</div>
			),
		},
		{
			key: 'clientId',
			header: 'Public Key',
			render: (credential) => (
				<div className="flex items-center gap-2">
					<code className="rounded bg-white/10 px-2 py-1 text-xs font-mono text-white">
						{credential.clientId.slice(0, 16)}...
					</code>
					<Tooltip>
						<button
							type="button"
							onClick={() => config.onCopyClientId(credential.clientId)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={Copy01Icon} className="icon-sm" />
							<Tooltip.Content>Copiar Public Key</Tooltip.Content>
						</button>
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
					<RevolutStatusBadge status={credential.environment} label={environmentParsed.label} className="gap-1" />
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (credential) => {
				const statusParsed = merchantApiCredentialStatusParse[credential.status];
				return (
					<RevolutStatusBadge status={credential.status} label={statusParsed.label} className="gap-1" />
				);
			},
		},
		{
			key: 'allowedIpRange',
			header: 'IPs Permitidos',
			render: (credential) =>
				credential.allowedIpRange ? (
					<code className="rounded bg-white/10 px-2 py-1 text-xs font-mono text-white">
						{credential.allowedIpRange}
					</code>
				) : (
					<span className="text-sm text-white/50">Todos</span>
				),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (credential) => <span className="text-sm text-white/50">{formatDate(credential.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			render: (credential) => {
				const isRevoked = credential.status === MerchantApiCredentialStatus.Revoked;
				return (
					<div className="flex items-center gap-1">
						<Tooltip>
							<button
								type="button"
								onClick={() => config.onView(credential)}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>Ver detalhes</Tooltip.Content>
							</button>
						</Tooltip>
						{!isRevoked && (
							<>
								<Tooltip>
									<button
										type="button"
										onClick={() => config.onRegenerate(credential)}
										className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#494fdf]/30 bg-[#494fdf]/15 text-[#4f55f1] hover:border-[#494fdf]/50 hover:bg-[#494fdf]/25 transition-colors"
									>
										<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
										<Tooltip.Content>Regenerar chave</Tooltip.Content>
									</button>
								</Tooltip>
								<Tooltip>
									<button
										type="button"
										onClick={() => config.onDelete(credential)}
										className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e23b4a]/30 bg-[#e23b4a]/15 text-[#e23b4a] hover:border-[#e23b4a]/50 hover:bg-[#e23b4a]/25 transition-colors"
									>
										<Icon icon={Delete02Icon} className="icon-sm" />
										<Tooltip.Content>Revogar</Tooltip.Content>
									</button>
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
			className={`rounded-xl border border-white/12 bg-[#16181a] p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
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
					<p className="mt-0.5 text-xs font-mono text-white/50 truncate">{credential.clientId.slice(0, 16)}...</p>
				</div>
				<RevolutStatusBadge status={credential.status} label={statusParsed.label} className="shrink-0" />
			</div>
			<div className="mt-2 flex items-center gap-1.5 flex-wrap">
				<RevolutStatusBadge status={credential.environment} label={envParsed.label} />
				<span className="text-xs text-white/50 truncate">IPs: {credential.allowedIpRange || 'Todos'}</span>
			</div>
			<p className="mt-2 text-xs text-white/50">{formatDate(credential.createdAt)}</p>
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
				<button
					type="button"
					onClick={filterHandlers.onSortToggle}
					className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
				>
					{filterHandlers.values.sortOrder === 'desc' ? (
						<Icon icon={SortingDownIcon} className="icon-sm" />
					) : (
						<Icon icon={SortingUpIcon} className="icon-sm" />
					)}
					<Tooltip.Content>
						{filterHandlers.values.sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigas primeiro'}
					</Tooltip.Content>
				</button>
			</Tooltip>
		</>
	);

	const items = data.items.items;
	const totalCredentials = data.items.totalItems;
	const activeCredentials = items.filter((c) => c.status === MerchantApiCredentialStatus.Active).length;
	const productionCredentials = items.filter((c) => c.environment === 'Production').length;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={ShieldKeyIcon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Credenciais de API</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gerenciamento seguro de Client IDs, Secret Keys e Webhooks
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => window.open(docsUrl, '_blank', 'noopener,noreferrer')}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
						<span>Documentação</span>
					</button>
					{integrationUrl && (
						<button
							type="button"
							onClick={() => window.open(integrationUrl, '_blank', 'noopener,noreferrer')}
							className="button-outline-dark cursor-pointer text-xs"
						>
							<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
							<span>Testar API</span>
						</button>
					)}
					<button
						type="button"
						onClick={modals.create.open}
						className="button-primary cursor-pointer text-xs"
					>
						<Icon icon={AddSquareIcon} className="icon-sm" />
						<span>+ Nova Credencial</span>
					</button>
				</div>
			</div>

			{/* 3-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{/* Total */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total Criadas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Key01Icon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
						{totalCredentials}
					</span>
				</div>

				{/* Ativas */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Chaves Ativas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={ShieldKeyIcon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
						{activeCredentials}
					</span>
				</div>

				{/* Produção */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Produção SPI
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={ArrowReloadHorizontalIcon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
						{productionCredentials}
					</span>
				</div>
			</div>
		<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
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
		</div>

			<div className="flex items-start gap-2 rounded-xl bg-[#ec7e00]/10 p-4">
				<Icon icon={InformationCircleIcon} className="icon-md shrink-0 text-[#ec7e00]" />
				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium text-white">Importante</p>
					<p className="text-sm text-white/50">
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
