'use client';

import { useState, useEffect } from 'react';
import { Card, Chip, Separator, Skeleton } from '@heroui/react';
import {
	QrCodeIcon,
	BarCodeIcon,
	CreditCardIcon,
	Wallet01Icon,
	Shield01Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { adminGetAcquirerRequiredFields } from '@/app/actions/admin/acquirers';
import type { AcquirerRequiredFieldsConfig, AcquirerOperationConfig, AcquirerFieldRequirement } from '@/types/admin/acquirers';

interface RequiredFieldsTabProps {
	acquirerId: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: 'accent' | 'success' | 'warning' | 'danger' | 'default' }> = {
	customer: { label: 'Cliente', color: 'accent' },
	payment: { label: 'Pagamento', color: 'success' },
	system: { label: 'Sistema', color: 'default' },
	merchant: { label: 'Merchant', color: 'warning' },
	config: { label: 'Configuração', color: 'danger' },
};

function FieldsTable({ fields }: { fields: AcquirerFieldRequirement[] }) {
	const requiredFields = fields.filter((f) => f.required);
	const optionalFields = fields.filter((f) => !f.required);

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border text-left">
						<th className="px-3 py-2 font-medium text-muted">Campo</th>
						<th className="px-3 py-2 font-medium text-muted">Tipo</th>
						<th className="px-3 py-2 font-medium text-muted">Status</th>
						<th className="px-3 py-2 font-medium text-muted">Origem</th>
						<th className="hidden px-3 py-2 font-medium text-muted md:table-cell">Descrição</th>
					</tr>
				</thead>
				<tbody>
					{requiredFields.map((field) => (
						<FieldRow key={field.name} field={field} />
					))}
					{optionalFields.map((field) => (
						<FieldRow key={field.name} field={field} />
					))}
				</tbody>
			</table>
		</div>
	);
}

function FieldRow({ field }: { field: AcquirerFieldRequirement }) {
	const source = field.source ? SOURCE_LABELS[field.source] : null;

	return (
		<tr className="border-b border-border/50 last:border-b-0">
			<td className="px-3 py-2.5">
				<div className="flex flex-col gap-0.5">
					<span className="font-medium">{field.label}</span>
					<code className="text-xs text-muted">{field.name}</code>
				</div>
			</td>
			<td className="px-3 py-2.5">
				<code className="rounded bg-surface px-1.5 py-0.5 text-xs">{field.type}</code>
			</td>
			<td className="px-3 py-2.5">
				{field.required ? (
					<Chip size="sm" variant="soft" color="danger" className="gap-1">
						<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
						Obrigatório
					</Chip>
				) : (
					<Chip size="sm" variant="soft" color="default" className="gap-1">
						Opcional
					</Chip>
				)}
			</td>
			<td className="px-3 py-2.5">
				{source && (
					<Chip size="sm" variant="soft" color={source.color}>
						{source.label}
					</Chip>
				)}
			</td>
			<td className="hidden px-3 py-2.5 md:table-cell">
				<div className="flex flex-col gap-0.5">
					{field.description && <span className="text-muted">{field.description}</span>}
					{field.example && (
						<span className="text-xs text-muted/70">Ex: {field.example}</span>
					)}
				</div>
			</td>
		</tr>
	);
}

function OperationCard({
	title,
	icon,
	operation,
}: {
	title: string;
	icon: React.ReactNode;
	operation: AcquirerOperationConfig | null;
}) {
	if (!operation) {
		return (
			<Card className="opacity-60">
				<Card.Header>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{icon}
							<h3 className="text-base font-semibold">{title}</h3>
						</div>
						<Chip size="sm" variant="soft" color="default" className="gap-1">
							<Icon icon={CancelCircleIcon} className="icon-xs" />
							Não suportado
						</Chip>
					</div>
				</Card.Header>
			</Card>
		);
	}

	const requiredCount = operation.fields.filter((f) => f.required).length;
	const optionalCount = operation.fields.filter((f) => !f.required).length;

	return (
		<Card>
			<Card.Header>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{icon}
							<h3 className="text-base font-semibold">{title}</h3>
						</div>
						<div className="flex items-center gap-2">
							<Chip size="sm" variant="soft" color="danger">
								{requiredCount} obrigatório{requiredCount !== 1 ? 's' : ''}
							</Chip>
							{optionalCount > 0 && (
								<Chip size="sm" variant="soft" color="default">
									{optionalCount} opcional{optionalCount !== 1 ? 'is' : ''}
								</Chip>
							)}
						</div>
					</div>
					<p className="text-sm text-muted">{operation.description}</p>
					<div className="flex flex-wrap items-center gap-2">
						<code className="rounded bg-surface px-2 py-0.5 text-xs font-medium">{operation.endpoint}</code>
						<Chip size="sm" variant="soft" color={operation.amountFormat === 'centavos' ? 'accent' : 'warning'}>
							Valor em {operation.amountFormat}
						</Chip>
					</div>
				</div>
			</Card.Header>
			<Separator />
			<Card.Content className="p-0">
				<FieldsTable fields={operation.fields} />
			</Card.Content>
		</Card>
	);
}

function RequiredFieldsSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Card>
				<Card.Header>
					<Skeleton className="h-6 w-48 rounded-lg" />
				</Card.Header>
				<Card.Content>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-full rounded-lg" />
						<Skeleton className="h-4 w-3/4 rounded-lg" />
					</div>
				</Card.Content>
			</Card>
			{[1, 2, 3].map((i) => (
				<Card key={i}>
					<Card.Header>
						<Skeleton className="h-6 w-36 rounded-lg" />
					</Card.Header>
					<Card.Content>
						<div className="flex flex-col gap-2">
							<Skeleton className="h-8 w-full rounded-lg" />
							<Skeleton className="h-8 w-full rounded-lg" />
							<Skeleton className="h-8 w-full rounded-lg" />
						</div>
					</Card.Content>
				</Card>
			))}
		</div>
	);
}

export function RequiredFieldsTab({ acquirerId }: RequiredFieldsTabProps) {
	const [config, setConfig] = useState<AcquirerRequiredFieldsConfig | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		adminGetAcquirerRequiredFields(acquirerId).then((response) => {
			if (cancelled) return;

			if (response?.error) {
				setError(response.error.message);
			} else if (response?.data) {
				setConfig(response.data);
			}
			setIsLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [acquirerId]);

	if (isLoading) return <RequiredFieldsSkeleton />;

	if (error) {
		return (
			<Card>
				<Card.Content>
					<p className="text-sm text-danger">{error}</p>
				</Card.Content>
			</Card>
		);
	}

	if (!config) return null;

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<Card.Header>
					<div className="flex items-center gap-2">
						<Icon icon={Shield01Icon} className="icon-md text-accent" />
						<div>
							<h3 className="text-base font-semibold">Autenticação</h3>
							<p className="text-sm text-muted">{config.auth.description}</p>
						</div>
					</div>
				</Card.Header>
				<Separator />
				<Card.Content className="p-0">
					<div className="flex items-center gap-2 px-3 py-2">
						<span className="text-sm font-medium text-muted">Método:</span>
						<Chip size="sm" variant="soft" color="accent">{config.auth.method}</Chip>
					</div>
					<FieldsTable fields={config.auth.fields} />
				</Card.Content>
			</Card>

			<div className="flex items-center gap-2">
				<Icon icon={InformationCircleIcon} className="icon-sm text-muted" />
				<span className="text-sm text-muted">
					Campos obrigatórios por operação da processadora
				</span>
			</div>

			<OperationCard
				title="PIX"
				icon={<Icon icon={QrCodeIcon} className="icon-md text-accent" />}
				operation={config.pix}
			/>

			<OperationCard
				title="Boleto"
				icon={<Icon icon={BarCodeIcon} className="icon-md text-accent" />}
				operation={config.boleto}
			/>

			<OperationCard
				title="Cartão de Crédito"
				icon={<Icon icon={CreditCardIcon} className="icon-md text-accent" />}
				operation={config.creditCard}
			/>

			<OperationCard
				title="Saque (Withdrawal)"
				icon={<Icon icon={Wallet01Icon} className="icon-md text-accent" />}
				operation={config.withdrawal}
			/>
		</div>
	);
}
