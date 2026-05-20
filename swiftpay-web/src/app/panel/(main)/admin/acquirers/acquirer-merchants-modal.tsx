'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Chip, Skeleton } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Building02Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { SearchFilter } from '@/components/ui/search-filter';
import { InlineList } from '@/components/ui/inline-list';
import { adminGetAcquirerMerchants } from '@/app/actions/admin/acquirers';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { DocumentDisplay } from '@/components/ui/data-links';
import { merchantStatusParse, mapParseColorToChipColor } from '@/parse';
import type { AcquirerMerchantData } from '@/types/admin/acquirers';
import { getAcquirerDisplaySubtitle } from '@/utils/acquirer-display';

interface AcquirerMerchantsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	acquirerId: string;
	acquirerDisplayName: string;
	acquirerNominal: string | null;
}

function MerchantsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-10 w-full rounded-lg" />
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-14 rounded-lg" />
			))}
		</div>
	);
}

export function AcquirerMerchantsModal({
	isOpen,
	onOpenChange,
	acquirerId,
	acquirerDisplayName,
	acquirerNominal,
}: AcquirerMerchantsModalProps) {
	const [merchants, setMerchants] = useState<AcquirerMerchantData[]>([]);
	const [searchValue, setSearchValue] = useState('');
	const [totalItems, setTotalItems] = useState(0);
	const [loadedAcquirerId, setLoadedAcquirerId] = useState<string | null>(null);

	const isLoading = isOpen && loadedAcquirerId !== acquirerId;

	useEffect(() => {
		if (!isOpen || loadedAcquirerId === acquirerId) return;

		let cancelled = false;

		adminGetAcquirerMerchants(acquirerId, { pageSize: 100 }).then((res) => {
			if (cancelled) return;
			if (res?.data) {
				setMerchants(res.data.items);
				setTotalItems(res.data.totalItems);
			}
			setLoadedAcquirerId(acquirerId);
		});

		return () => {
			cancelled = true;
		};
	}, [isOpen, acquirerId, loadedAcquirerId]);

	function handleOpenChange(open: boolean) {
		if (!open) {
			setSearchValue('');
			setLoadedAcquirerId(null);
			setMerchants([]);
			setTotalItems(0);
		}
		onOpenChange(open);
	}

	const filteredMerchants = useMemo(() => {
		if (!searchValue.trim()) return merchants;
		const query = searchValue.toLowerCase().trim();
		return merchants.filter(
			(m) =>
				(m.name?.toLowerCase().includes(query) ?? false) ||
				(m.legalName?.toLowerCase().includes(query) ?? false) ||
				(m.documentNumber?.toLowerCase().includes(query) ?? false)
		);
	}, [merchants, searchValue]);

	const acquirerSubtitle = getAcquirerDisplaySubtitle({
		displayName: acquirerDisplayName,
		nominal: acquirerNominal,
	});

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Building02Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Organizações Vinculadas</Modal.Heading>
						<p className="text-sm text-muted">
							{totalItems} organizações vinculadas à {acquirerDisplayName}
						</p>
						<p className="text-xs text-muted">{acquirerSubtitle}</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							<SearchFilter
								defaultValue={searchValue}
								onChange={setSearchValue}
								placeholder="Buscar por nome ou documento..."
								className="w-full"
							/>

							{isLoading ? (
								<MerchantsSkeleton />
							) : filteredMerchants.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8 text-muted">
									<Icon icon={Building02Icon} className="icon-xl mb-2 opacity-50" />
									<p className="text-sm">
										{searchValue ? 'Nenhuma organização encontrada' : 'Nenhuma organização vinculada'}
									</p>
								</div>
							) : (
								<InlineList
									items={filteredMerchants}
									getKey={(m) => m.id}
									getTitle={(m) => (
										<AdminMerchantLink
											merchantId={m.id}
											name={m.name ?? 'Sem nome'}
											newTab={false}
											className="text-accent hover:underline"
										/>
									)}
									getSubtitle={(m) => (
										<span className="flex items-center gap-2">
											<DocumentDisplay
												document={m.documentNumber}
												documentType={m.documentType}
												fallback="Documento não informado"
											/>
										</span>
									)}
									renderLeading={() => (
										<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
											<Icon icon={Building02Icon} className="icon-sm text-accent" />
										</div>
									)}
									renderTrailing={(m) => (
										<div className="flex items-center gap-2">
											{m.isDefault && (
												<Chip variant="soft" size="sm" color="accent">
													Padrão
												</Chip>
											)}
											<Chip
												variant="soft"
												size="sm"
												color={mapParseColorToChipColor(merchantStatusParse[m.status].color)}
											>
												{merchantStatusParse[m.status].label}
											</Chip>
											{m.isActive ? (
												<Icon icon={CheckmarkCircle02Icon} size={16} className="text-success" />
											) : (
												<Icon icon={CancelCircleIcon} size={16} className="text-muted" />
											)}
										</div>
									)}
									empty={null}
								/>
							)}
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

