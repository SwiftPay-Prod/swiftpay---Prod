'use client';

import { Card, Chip, Separator, TextArea } from '@heroui/react';
import { CancelCircleIcon, CheckmarkSquare02Icon, File01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminMerchantKycPendingItemData } from '@/types/admin/merchants';
import { KycPendingItemEvaluationStatus } from '@/types/admin/merchants';
import { merchantKycPendingItemStatusParse, merchantKycPendingItemTypeParse, mapParseColorToChipColor } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { AsyncButton } from '@/components/ui/async-button';

interface PendingResponsesCardProps {
	items: AdminMerchantKycPendingItemData[];
	rejectingItemId: string | null;
	rejectItemNotes: string;
	isEvaluatingItem: boolean;
	getPendingFieldLabel: (fieldKey: AdminMerchantKycPendingItemData['fieldKey']) => string;
	getPendingFieldCurrentValue: (fieldKey: AdminMerchantKycPendingItemData['fieldKey']) => string;
	onStartReject: (itemId: string) => void;
	onCancelReject: () => void;
	onChangeRejectNotes: (value: string) => void;
	onEvaluateItem: (itemId: string, status: KycPendingItemEvaluationStatus, notes?: string) => void;
}

export function PendingResponsesCard({
	items,
	rejectingItemId,
	rejectItemNotes,
	isEvaluatingItem,
	getPendingFieldLabel,
	getPendingFieldCurrentValue,
	onStartReject,
	onCancelReject,
	onChangeRejectNotes,
	onEvaluateItem,
}: PendingResponsesCardProps) {
	if (items.length === 0) {
		return null;
	}

	return (
		<Card>
			<Card.Header>
				<div className="flex items-center gap-2">
					<Icon icon={File01Icon} className="icon-md text-accent" />
					<Card.Title>Respostas de complemento ({items.length})</Card.Title>
				</div>
			</Card.Header>
			<Separator />
			<Card.Content className="flex flex-col gap-4">
				{items.map((item) => {
					const typeParse = merchantKycPendingItemTypeParse[item.type as keyof typeof merchantKycPendingItemTypeParse];
					const itemStatusParse =
						merchantKycPendingItemStatusParse[item.status as keyof typeof merchantKycPendingItemStatusParse];
					const isRejectingThisItem = rejectingItemId === item.id;
					const newValue = getPendingFieldCurrentValue(item.fieldKey);

					return (
						<div key={item.id} className="flex flex-col gap-3 rounded-lg border border-accent bg-accent/5 p-4">
							<div className="flex items-start justify-between">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-2">
										{typeParse?.icon}
										<span className="font-medium">{item.title}</span>
									</div>
									{item.description && <p className="text-sm text-foreground-500">{item.description}</p>}
									<div className="mt-1 flex flex-wrap items-center gap-2">
										<Chip variant="soft" size="sm" color="accent">
											Campo: {getPendingFieldLabel(item.fieldKey)}
										</Chip>
									</div>
								</div>
								<Chip variant="soft" size="sm" color={mapParseColorToChipColor(itemStatusParse?.color ?? 'default')}>
									{itemStatusParse?.label ?? item.status}
								</Chip>
							</div>

							{item.respondedAt && (
								<div className="rounded-md bg-surface p-3">
									<span className="text-xs font-medium text-muted">Novo valor informado</span>
									<p className="mt-1 text-sm">{newValue}</p>
									<span className="mt-2 block text-xs text-muted">
										Respondido em {formatDate(item.respondedAt)}
									</span>
								</div>
							)}

							{isRejectingThisItem ? (
								<div className="flex flex-col gap-3 rounded-md border border-danger/30 bg-danger/5 p-3">
									<span className="text-sm font-medium text-danger">Motivo da rejeição do item</span>
									<TextArea
										variant="secondary"
										placeholder="Explique por que este item não foi aceito..."
										value={rejectItemNotes}
										onChange={(event) => onChangeRejectNotes(event.target.value)}
										rows={2}
									/>
									<div className="flex gap-2">
										<AsyncButton size="sm" variant="secondary" onPress={onCancelReject}>
											Cancelar
										</AsyncButton>
										<AsyncButton
											size="sm"
											className="bg-danger text-danger-foreground"
											isPending={isEvaluatingItem}
											onPress={() => onEvaluateItem(item.id, KycPendingItemEvaluationStatus.Rejected, rejectItemNotes)}
										>
											Confirmar rejeição
										</AsyncButton>
									</div>
								</div>
							) : (
								<div className="flex gap-2">
									<AsyncButton
										size="sm"
										className="bg-success text-success-foreground"
										isPending={isEvaluatingItem}
										onPress={() => onEvaluateItem(item.id, KycPendingItemEvaluationStatus.Approved)}
									>
										<Icon icon={CheckmarkSquare02Icon} className="icon-sm" />
										Aprovar item
									</AsyncButton>
									<AsyncButton
										size="sm"
										variant="secondary"
										className="text-danger"
										isPending={isEvaluatingItem}
										onPress={() => onStartReject(item.id)}
									>
										<Icon icon={CancelCircleIcon} className="icon-sm" />
										Rejeitar item
									</AsyncButton>
								</div>
							)}
						</div>
					);
				})}
			</Card.Content>
		</Card>
	);
}
