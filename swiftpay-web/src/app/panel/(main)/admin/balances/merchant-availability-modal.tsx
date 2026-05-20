'use client';

import { Suspense, use, useState } from 'react';
import { Button, Modal, Skeleton } from '@heroui/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Building02Icon } from '@hugeicons/core-free-icons';

import { adminGetPlatformBalanceAcquirerMerchantAvailability } from '@/app/actions/admin/dashboard';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { InlineList } from '@/components/ui/inline-list';
import { Icon } from '@/components/ui/icon';
import { SearchFilter } from '@/components/ui/search-filter';
import { DocumentDisplay, EmailLink } from '@/components/ui/data-links';
import type { ApiResponse, Paginated } from '@/types/common';
import type { AdminPlatformBalanceMerchantAvailabilityData } from '@/types/admin/dashboard';
import { formatCurrency } from '@/utils/currency';

type MerchantAvailabilityPromise = Promise<ApiResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>>;

interface MerchantAvailabilityModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	acquirerId: string;
	acquirerDisplayName: string;
	initialPromise: MerchantAvailabilityPromise;
}

function MerchantAvailabilitySkeleton() {
	return (
		<div className="flex flex-col gap-4">
			{Array.from({ length: 5 }).map((_, index) => (
				<Skeleton key={index} className="h-14 rounded-lg" />
			))}
		</div>
	);
}

function MerchantAvailabilityList({
	dataPromise,
	onPageChange,
	currentSearch,
	acquirerDisplayName,
}: {
	dataPromise: MerchantAvailabilityPromise;
	onPageChange: (page: number) => void;
	currentSearch: string;
	acquirerDisplayName: string;
}) {
	const response = use(dataPromise);
	const data = response?.data ?? {
		items: [],
		totalItems: 0,
		page: 1,
		pageSize: 10,
		totalPages: 0,
	};

	if (response?.error) {
		return <p className="text-sm text-danger">{response.error.message}</p>;
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm text-muted">
					{data.totalItems} organizações com saldo disponível ou bloqueado em {acquirerDisplayName}
				</p>
				<p className="text-xs text-muted">
					Página {data.page} de {Math.max(1, data.totalPages)}
				</p>
			</div>

			{data.items.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-divider py-8 text-muted">
					<Icon icon={Building02Icon} className="icon-xl mb-2 opacity-50" />
					<p className="text-sm">
						{currentSearch
							? 'Nenhuma organização encontrada com o filtro informado.'
							: 'Nenhuma organização com saldo disponível ou bloqueado encontrada nesta adquirente.'}
					</p>
				</div>
			) : (
				<InlineList
					items={data.items}
					getKey={(merchant) => merchant.merchantId}
					getTitle={(merchant) => (
						<AdminMerchantLink
							merchantId={merchant.merchantId}
							name={merchant.merchantName ?? 'Sem nome'}
							newTab={true}
							className="text-accent hover:underline"
						/>
					)}
					getSubtitle={(merchant) => (
						<span className="flex items-center gap-2">
							<DocumentDisplay
								document={merchant.documentNumber}
								documentType={merchant.documentType}
								fallback="Documento não informado"
							/>
							<span className="text-muted">•</span>
							<EmailLink email={merchant.email} fallback="Email não informado" />
						</span>
					)}
					renderLeading={() => (
						<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
							<Icon icon={Building02Icon} className="icon-sm text-accent" />
						</div>
					)}
					renderTrailing={(merchant) => (
						<div className="flex flex-col items-end gap-0.5 text-right">
							<span className="text-xs text-muted">Disponível</span>
							<span className={`text-sm font-semibold ${merchant.availableBalance >= 0 ? 'text-success' : 'text-danger'}`}>
								{formatCurrency(merchant.availableBalance)}
							</span>
							<span className="mt-1 text-xs text-muted">Bloqueado (saque)</span>
							<span className={`text-sm font-semibold ${merchant.blockedBalance > 0 ? 'text-warning' : 'text-muted'}`}>
								{formatCurrency(merchant.blockedBalance)}
							</span>
						</div>
					)}
					empty={null}
				/>
			)}

			{data.totalPages > 1 && (
				<div className="flex items-center justify-between border-t border-divider pt-2">
					<p className="text-xs text-muted">
						{(data.page - 1) * data.pageSize + 1} - {Math.min(data.page * data.pageSize, data.totalItems)} de {data.totalItems}
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="tertiary"
							size="sm"
							isDisabled={data.page <= 1}
							onPress={() => onPageChange(data.page - 1)}
						>
							<Icon icon={ArrowLeft01Icon} className="icon-sm" />
							Anterior
						</Button>
						<Button
							variant="tertiary"
							size="sm"
							isDisabled={data.page >= data.totalPages}
							onPress={() => onPageChange(data.page + 1)}
						>
							Próxima
							<Icon icon={ArrowRight01Icon} className="icon-sm" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export function MerchantAvailabilityModal({
	isOpen,
	onOpenChange,
	acquirerId,
	acquirerDisplayName,
	initialPromise,
}: MerchantAvailabilityModalProps) {
	const [searchValue, setSearchValue] = useState('');
	const [resetKey, setResetKey] = useState(0);
	const [dataPromise, setDataPromise] = useState(initialPromise);

	function fetchPage(page: number, search: string) {
		setDataPromise(
			adminGetPlatformBalanceAcquirerMerchantAvailability(acquirerId, {
				page,
				pageSize: 10,
				search: search || undefined,
			})
		);
	}

	function handleSearch(nextSearch: string) {
		setSearchValue(nextSearch);
		fetchPage(1, nextSearch);
	}

	function handlePageChange(page: number) {
		fetchPage(page, searchValue);
	}

	function handleOpenChange(open: boolean) {
		if (!open) {
			setSearchValue('');
			setResetKey((current) => current + 1);
		}

		onOpenChange(open);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Building02Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Organizações com saldo disponível</Modal.Heading>
						<p className="text-sm text-muted">Veja quais organizações compõem os saldos disponível e bloqueado de saque desta adquirente.</p>
						<p className="text-xs text-muted">{acquirerDisplayName}</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							<SearchFilter
								defaultValue=""
								resetKey={resetKey}
								onChange={handleSearch}
								placeholder="Buscar por nome, documento ou email..."
								className="w-full"
							/>
							<Suspense fallback={<MerchantAvailabilitySkeleton />}>
								<MerchantAvailabilityList
									dataPromise={dataPromise}
									onPageChange={handlePageChange}
									currentSearch={searchValue}
									acquirerDisplayName={acquirerDisplayName}
								/>
							</Suspense>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => handleOpenChange(false)}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
