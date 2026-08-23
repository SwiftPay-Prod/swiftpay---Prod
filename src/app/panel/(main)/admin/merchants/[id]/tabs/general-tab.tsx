'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button, Chip, Alert, Separator } from '@heroui/react';
import {
	Calendar03Icon,
	CheckListIcon,
	UserIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { SystemAccordion } from '@/components/ui/system-accordion';
import {
	MerchantAddressAccordion,
	MerchantAdminNotesAccordion,
	MerchantBusinessAccordion,
	MerchantContactAccordion,
	MerchantDatesAccordion,
	MerchantDocumentsAccordion,
	MerchantOrganizationInfoAccordion,
} from '@/components/merchant/merchant-organization-accordions';
import type { AdminMerchantDetails } from '@/types/admin/merchants';
import { MerchantKycPendingItemStatus, MerchantKycStatus, MerchantStatus } from '@/types/enums';
import {
	merchantIdentityDocumentTypeParse,
	merchantKycPendingItemTypeParse,
	merchantKycPendingItemStatusParse,
	mapParseColorToChipColor,
} from '@/parse';
import { formatDate, formatRelativeTime } from '@/utils/datetime';
import { EmailLink } from '@/components/ui/data-links';
import { Routes } from '@/router/routes';

interface GeneralTabProps {
	merchant: AdminMerchantDetails;
}

function InfoField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5 py-1.5">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<div className="text-sm text-foreground">{children}</div>
		</div>
	);
}

export function GeneralTab({ merchant }: GeneralTabProps) {
	const router = useRouter();

	function handleEvaluate() {
		router.push(Routes.panel.admin.merchantEvaluate(merchant.id));
	}

	const pendingItemsPending = merchant.kycPendingItems.filter(
		(item) => item.status === MerchantKycPendingItemStatus.Pending
	);
	const pendingItemsResponded = merchant.kycPendingItems.filter(
		(item) => item.status === MerchantKycPendingItemStatus.Responded
	);
	const totalPendingItemsRequested = merchant.kycPendingItems.filter(
		(item) =>
			item.status === MerchantKycPendingItemStatus.Pending || item.status === MerchantKycPendingItemStatus.Responded
	).length;
	const allItemsResponded =
		totalPendingItemsRequested > 0 && pendingItemsPending.length === 0 && pendingItemsResponded.length > 0;

	const evaluableStatuses: MerchantKycStatus[] = [MerchantKycStatus.Pending, MerchantKycStatus.UnderReview];
	const canEvaluate = evaluableStatuses.includes(merchant.kycStatus as MerchantKycStatus);

	return (
		<div className="flex flex-col gap-4">
			{merchant.status === MerchantStatus.Suspended && (
				<Alert status="warning">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Organização suspensa</Alert.Title>
						<Alert.Description>
							Esta organização está temporariamente suspensa e não pode processar transações.
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			{merchant.kyc?.rejectionReason && (
				<Alert status="danger">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Motivo da rejeição</Alert.Title>
						<Alert.Description>{merchant.kyc.rejectionReason}</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			{merchant.kycStatus === MerchantKycStatus.Complement && totalPendingItemsRequested > 0 && (
				<Alert status="accent">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Complemento solicitado</Alert.Title>
						<Alert.Description>
							{pendingItemsPending.length === totalPendingItemsRequested ? (
								<>Aguardando a organização responder {totalPendingItemsRequested} item(ns).</>
							) : pendingItemsPending.length > 0 ? (
								<>
									A organização respondeu {pendingItemsResponded.length} de {totalPendingItemsRequested} item(ns).
									Faltam {pendingItemsPending.length} para poder avaliar.
								</>
							) : (
								<>A organização respondeu todos os {totalPendingItemsRequested} item(ns) solicitados.</>
							)}
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			{canEvaluate && allItemsResponded && (
				<div className="flex items-center gap-4">
					<Alert status="success" className="flex-1">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Pronto para avaliar</Alert.Title>
							<Alert.Description>
								A organização respondeu todos os {totalPendingItemsRequested} item(ns) solicitados. Você pode avaliar as
								respostas agora.
							</Alert.Description>
						</Alert.Content>
					</Alert>
					<Button variant="secondary" size="sm" onPress={handleEvaluate}>
						<Icon icon={CheckListIcon} className="icon-sm" />
						Avaliar
					</Button>
				</div>
			)}

			<MerchantOrganizationInfoAccordion merchant={merchant} accordionIdPrefix="merchant-general" viewer="admin" />

			<SystemAccordion
				id="merchant-general-owner"
				defaultExpanded={false}
				icon={UserIcon}
				title="Responsável / Proprietário"
				summary="Dados do usuário responsável"
				color="secondary"
			>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
					<InfoField label="Nome do usuário">{merchant.user.name || '-'}</InfoField>
					<InfoField label="E-mail do usuário">
						<EmailLink email={merchant.user.email} className="font-medium" />
					</InfoField>
					<InfoField label="Tipo de documento de identidade">
						{merchant.kyc?.identityDocumentType
							? merchantIdentityDocumentTypeParse[
									merchant.kyc.identityDocumentType as keyof typeof merchantIdentityDocumentTypeParse
							  ]?.label
							: '-'}
					</InfoField>
					<InfoField label="Número do documento de identidade">{merchant.kyc?.identityDocumentNumber || '-'}</InfoField>
				</div>
			</SystemAccordion>

			<MerchantContactAccordion merchant={merchant} accordionIdPrefix="merchant-general" viewer="admin" />
			<MerchantAddressAccordion merchant={merchant} accordionIdPrefix="merchant-general" viewer="admin" />
			<MerchantBusinessAccordion merchant={merchant} accordionIdPrefix="merchant-general" viewer="admin" />
			<MerchantDocumentsAccordion merchant={merchant} accordionIdPrefix="merchant-general" viewer="admin" />
			<MerchantDatesAccordion merchant={merchant} accordionIdPrefix="merchant-general" viewer="admin" />
			<MerchantAdminNotesAccordion merchant={merchant} accordionIdPrefix="merchant-general" />

			{merchant.kycPendingItems.length > 0 && (
				<SystemAccordion
					id="merchant-general-history"
					defaultExpanded={false}
					icon={Calendar03Icon}
					title={`Histórico de complementos (${merchant.kycPendingItems.length})`}
					summary="Solicitações e respostas de complementação"
					color="accent"
				>
					<div className="flex flex-col gap-3">
						{merchant.kycPendingItems.map((item) => {
							const typeParse =
								merchantKycPendingItemTypeParse[item.type as keyof typeof merchantKycPendingItemTypeParse];
							const itemStatusParse =
								merchantKycPendingItemStatusParse[item.status as keyof typeof merchantKycPendingItemStatusParse];

							return (
								<div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												{typeParse?.icon}
												<span className="text-sm font-semibold text-foreground">{item.title}</span>
											</div>
											<p className="text-sm text-muted-foreground">{item.description}</p>
										</div>
										<div className="flex flex-col items-end gap-1">
											<Chip variant="soft" size="sm" color={mapParseColorToChipColor(itemStatusParse?.color ?? 'default')}>
												{itemStatusParse?.label ?? item.status}
											</Chip>
											<span className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
										</div>
									</div>

									{item.response && (
										<div className="rounded-lg bg-surface p-3">
											<p className="text-xs font-medium text-muted-foreground">Resposta da organização</p>
											<p className="mt-1 text-sm text-foreground">{item.response}</p>
											{item.respondedAt && (
												<p className="mt-1 text-xs text-muted-foreground">Respondido em {formatDate(item.respondedAt)}</p>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</SystemAccordion>
			)}

			<Separator />
		</div>
	);
}
