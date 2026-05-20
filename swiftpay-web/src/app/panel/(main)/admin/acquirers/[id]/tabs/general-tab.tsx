'use client';

import { Avatar, Chip, Separator } from '@heroui/react';
import {
	Building02Icon,
	Calendar03Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	File01Icon,
	InformationCircleIcon,
	Link01Icon,
	ServerStack01Icon,
	Shield01Icon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import { formatDate } from '@/utils/datetime';
import { getAcquirerDisplayTitle, getAcquirerDisplaySubtitle } from '@/utils/acquirer-display';
import { ProviderCategoryChip } from '@/components/admin/provider-category-chip';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface GeneralTabProps {
	acquirer: AdminAcquirerData;
}

export function GeneralTab({ acquirer }: GeneralTabProps) {
	const acquirerTitle = getAcquirerDisplayTitle({
		displayName: acquirer.displayName ?? acquirer.name,
		nominal: acquirer.nominal,
	});
	const acquirerSubtitle = getAcquirerDisplaySubtitle({
		displayName: acquirer.displayName ?? acquirer.name,
		nominal: acquirer.nominal,
	});

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<div className="flex flex-col gap-6">
				<SystemAccordion
					id="acquirer-general"
					icon={Shield01Icon}
					color="accent"
					title="Informações Gerais"
					defaultExpanded
				>
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							{acquirer.logoUrl ? (
								<Avatar size="lg">
									<Avatar.Image src={acquirer.logoUrl} alt={acquirer.name} />
									<Avatar.Fallback>
										<Icon icon={ServerStack01Icon} size={24} className="text-accent" />
									</Avatar.Fallback>
								</Avatar>
							) : (
								<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
									<Icon icon={ServerStack01Icon} size={24} className="text-accent" />
								</div>
							)}
							<div>
								<p className="font-medium">{acquirerTitle}</p>
								<p className="text-sm text-muted">{acquirerSubtitle}</p>
								<p className="text-sm text-muted">{acquirer.code}</p>
							</div>
						</div>
						<Separator />
						<div>
							<label className="text-sm text-muted">Status</label>
							<div className="mt-1">
								<div className="flex items-center gap-2">
									{acquirer.isActive ? (
										<>
											<Icon icon={CheckmarkCircle02Icon} size={16} className="text-success" />
											<span className="text-sm font-medium text-success">Ativa</span>
										</>
									) : (
										<>
											<Icon icon={CancelCircleIcon} size={16} className="text-muted" />
											<span className="text-sm font-medium text-muted">Inativa</span>
										</>
									)}
								</div>
							</div>
						</div>
						<div>
							<label className="text-sm text-muted">Categoria</label>
							<div className="mt-1">
								<div className="flex flex-col gap-2">
									<ProviderCategoryChip category={acquirer.providerCategory} className="w-fit" />
									{acquirer.providerCategory === 'PaymentInstitution' && (
										<div className="flex items-start gap-2 rounded-lg bg-secondary-soft p-3">
											<Icon icon={InformationCircleIcon} className="icon-sm text-secondary shrink-0 mt-0.5" />
											<p className="text-xs text-secondary">
												Esta processadora opera como Instituição de Pagamento (IP). Organizações vinculadas precisam
												passar por cadastro de submerchant (KYC) antes de processar transações.
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
						{acquirer.description && (
							<div>
								<label className="text-sm text-muted">Descrição</label>
								<p className="text-sm">{acquirer.description}</p>
							</div>
						)}
						<div>
							<label className="text-sm text-muted">Criado em</label>
							<div className="flex items-center gap-2 mt-1">
								<Icon icon={Calendar03Icon} size={16} className="text-muted" />
								<span className="text-sm">{formatDate(acquirer.createdAt)}</span>
							</div>
						</div>
						<div>
							<label className="text-sm text-muted">Atualizado em</label>
							<div className="flex items-center gap-2 mt-1">
								<Icon icon={Calendar03Icon} size={16} className="text-muted" />
								<span className="text-sm">{formatDate(acquirer.updatedAt)}</span>
							</div>
						</div>
					</div>
				</SystemAccordion>
			</div>

			<div className="flex flex-col gap-6">
				<SystemAccordion
					id="acquirer-features"
					icon={Wallet01Icon}
					color="warning"
					title="Funcionalidades"
				>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm">PIX</span>
							{acquirer.supportsPix ? (
								<Chip variant="soft" color="success" size="sm">
									Suportado
								</Chip>
							) : (
								<Chip variant="soft" color="default" size="sm">
									Não suportado
								</Chip>
							)}
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span className="text-sm">Cartão de Crédito</span>
							{acquirer.supportsCreditCard ? (
								<Chip variant="soft" color="success" size="sm">
									Suportado
								</Chip>
							) : (
								<Chip variant="soft" color="default" size="sm">
									Não suportado
								</Chip>
							)}
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span className="text-sm">Boleto</span>
							{acquirer.supportsBoleto ? (
								<Chip variant="soft" color="success" size="sm">
									Suportado
								</Chip>
							) : (
								<Chip variant="soft" color="default" size="sm">
									Não suportado
								</Chip>
							)}
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span className="text-sm">Saque</span>
							{acquirer.supportsWithdrawal ? (
								<Chip variant="soft" color="success" size="sm">
									Suportado
								</Chip>
							) : (
								<Chip variant="soft" color="default" size="sm">
									Não suportado
								</Chip>
							)}
						</div>
					</div>
				</SystemAccordion>

				<SystemAccordion
					id="acquirer-merchants"
					icon={Building02Icon}
					color="success"
					title="Organizações"
					defaultExpanded={false}
				>
					<div className="flex items-center justify-between">
						<div>
							<label className="text-sm text-muted">Total de organizações</label>
							<p className="text-2xl font-bold mt-1">{acquirer.totalMerchants}</p>
						</div>
					</div>
				</SystemAccordion>

				{(acquirer.documentationUrl || acquirer.webhookDocumentationUrl) && (
					<SystemAccordion
						id="acquirer-docs"
						icon={File01Icon}
						color="secondary"
						title="Documentação"
						defaultExpanded={false}
					>
						<div className="space-y-4">
							{acquirer.documentationUrl && (
								<div>
									<label className="text-sm text-muted">Documentação Geral</label>
									<a
										href={acquirer.documentationUrl ?? undefined}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 text-sm text-accent hover:underline mt-1"
									>
										<Icon icon={Link01Icon} size={16} />
										{acquirer.documentationUrl}
									</a>
								</div>
							)}
							{acquirer.webhookDocumentationUrl && (
								<div>
									<label className="text-sm text-muted">Documentação de Webhook</label>
									<a
										href={acquirer.webhookDocumentationUrl ?? undefined}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 text-sm text-accent hover:underline mt-1"
									>
										<Icon icon={Link01Icon} size={16} />
										{acquirer.webhookDocumentationUrl}
									</a>
								</div>
							)}
						</div>
					</SystemAccordion>
				)}

				<SystemAccordion
					id="acquirer-webhook"
					icon={Link01Icon}
					color="blue"
					title="Webhook da Processadora"
					defaultExpanded={false}
				>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted">Configuração</span>
							<Chip variant="soft" size="sm" color={acquirer.isWebhookConfigured ? 'success' : 'warning'}>
								{acquirer.isWebhookConfigured ? 'Configurado' : 'Não configurado'}
							</Chip>
						</div>
						<div>
							<label className="text-sm text-muted">Path</label>
							<p className="text-sm font-mono mt-1">{acquirer.webhookPath ?? '—'}</p>
						</div>
						<div>
							<label className="text-sm text-muted">URL</label>
							{acquirer.webhookUrl ? (
								<a
									href={acquirer.webhookUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-sm text-accent hover:underline mt-1"
								>
									<Icon icon={Link01Icon} size={16} />
									{acquirer.webhookUrl}
								</a>
							) : (
								<p className="text-sm mt-1">—</p>
							)}
						</div>
					</div>
				</SystemAccordion>
			</div>
		</div>
	);
}
