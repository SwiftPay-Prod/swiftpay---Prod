'use client';

import { Alert, Card, Label, ListBox, Select, Separator, TextArea } from '@heroui/react';
import { CancelCircleIcon, CheckmarkCircle02Icon, File01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { MerchantKycEvaluationStatus, MerchantKycPendingField } from '@/types/enums';
import type { EvaluatePendingItemRequest } from '@/types/admin/merchants';
import { AsyncButton } from '@/components/ui/async-button';
import { PendingItemsEditor } from './pending-items-editor';

interface DecisionCardProps {
	decision: MerchantKycEvaluationStatus | null;
	reason: string;
	showApprovalConfirm: boolean;
	hasItemsToEvaluate: boolean;
	isPending: boolean;
	pendingItems: EvaluatePendingItemRequest[];
	pendingFieldSearchValues: Record<number, string>;
	getPendingFieldLabel: (fieldKey: MerchantKycPendingField | null | undefined) => string;
	getPendingFieldOptions: (searchValue: string) => Array<{ key: string; label: string }>;
	onApproveClick: () => void;
	onSelectDecision: (value: MerchantKycEvaluationStatus) => void;
	onCancelDecision: () => void;
	onCancelApprovalConfirm: () => void;
	onConfirmApproval: () => void;
	onChangeReason: (value: string) => void;
	onAddPendingItem: () => void;
	onRemovePendingItem: (index: number) => void;
	onUpdatePendingItem: (index: number, field: keyof EvaluatePendingItemRequest, value: string | null) => void;
	onUpdatePendingFieldSearch: (index: number, value: string) => void;
	onSubmit: () => void;
}

export function DecisionCard({
	decision,
	reason,
	showApprovalConfirm,
	hasItemsToEvaluate,
	isPending,
	pendingItems,
	pendingFieldSearchValues,
	getPendingFieldLabel,
	getPendingFieldOptions,
	onApproveClick,
	onSelectDecision,
	onCancelDecision,
	onCancelApprovalConfirm,
	onConfirmApproval,
	onChangeReason,
	onAddPendingItem,
	onRemovePendingItem,
	onUpdatePendingItem,
	onUpdatePendingFieldSearch,
	onSubmit,
}: DecisionCardProps) {
	const selectedStatus = showApprovalConfirm ? MerchantKycEvaluationStatus.Approved : decision;

	function handleStatusChange(key: string | null) {
		if (!key) {
			onCancelDecision();
			return;
		}

		if (key === MerchantKycEvaluationStatus.Approved) {
			onApproveClick();
			return;
		}

		onSelectDecision(key as MerchantKycEvaluationStatus);
	}

	return (
		<Card>
			<Card.Header>
				<Card.Title>Decisão</Card.Title>
			</Card.Header>
			<Separator />
			<Card.Content className="flex flex-col gap-4">
				{hasItemsToEvaluate && (
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Avalie os itens primeiro</Alert.Title>
							<Alert.Description>
								Você precisa avaliar todos os itens de complemento antes de tomar a decisão final.
							</Alert.Description>
						</Alert.Content>
					</Alert>
				)}

				<div className="flex flex-wrap items-end gap-2">
					<Select
						className="min-w-62 grow"
						variant="secondary"
						placeholder="Selecione o status"
						value={selectedStatus}
						isDisabled={hasItemsToEvaluate}
						onChange={(key) => handleStatusChange((key as string | null) ?? null)}
					>
						<Label>Status da avaliação</Label>
						<Select.Trigger className="w-full">
							<Select.Value />
							<Select.Indicator className="size-4" />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item id={MerchantKycEvaluationStatus.Approved} textValue="Aprovar">
									<div className="flex items-center gap-2">
										<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
										<span>Aprovar</span>
									</div>
									<ListBox.ItemIndicator />
								</ListBox.Item>
								<ListBox.Item id={MerchantKycEvaluationStatus.Complement} textValue="Solicitar complemento">
									<div className="flex items-center gap-2">
										<Icon icon={File01Icon} className="icon-sm text-warning" />
										<span>Solicitar complemento</span>
									</div>
									<ListBox.ItemIndicator />
								</ListBox.Item>
								<ListBox.Item id={MerchantKycEvaluationStatus.Rejected} textValue="Rejeitar">
									<div className="flex items-center gap-2">
										<Icon icon={CancelCircleIcon} className="icon-sm text-danger" />
										<span>Rejeitar</span>
									</div>
									<ListBox.ItemIndicator />
								</ListBox.Item>
							</ListBox>
						</Select.Popover>
					</Select>

					{selectedStatus && (
						<AsyncButton variant="tertiary" onPress={showApprovalConfirm ? onCancelApprovalConfirm : onCancelDecision}>
							Cancelar
						</AsyncButton>
					)}
				</div>

				{showApprovalConfirm && (
					<div className="flex flex-col gap-3 rounded-lg border border-success bg-success-soft p-4">
						<div className="flex items-center gap-2">
							<Icon icon={CheckmarkCircle02Icon} className="icon-md text-success" />
							<span className="font-medium">Confirmar aprovação</span>
						</div>
						<p className="text-sm text-foreground-500">
							Ao confirmar, você irá selecionar a adquirente e configurar as taxas para esta organização.
						</p>
						<div>
							<AsyncButton className="bg-success text-success-foreground" onPress={onConfirmApproval}>
								Confirmar aprovação
							</AsyncButton>
						</div>
					</div>
				)}

				{decision === MerchantKycEvaluationStatus.Rejected && (
					<div className="flex flex-col gap-2">
						<Label isRequired>Motivo da rejeição</Label>
						<TextArea
							variant="secondary"
							placeholder="Descreva o motivo da rejeição..."
							value={reason}
							onChange={(event) => onChangeReason(event.target.value)}
							rows={3}
						/>
					</div>
				)}

				{decision === MerchantKycEvaluationStatus.Complement && (
					<PendingItemsEditor
						pendingItems={pendingItems}
						pendingFieldSearchValues={pendingFieldSearchValues}
						onAddPendingItem={onAddPendingItem}
						onRemovePendingItem={onRemovePendingItem}
						onUpdatePendingItem={onUpdatePendingItem}
						onUpdatePendingFieldSearch={onUpdatePendingFieldSearch}
						getPendingFieldOptions={getPendingFieldOptions}
						getPendingFieldLabel={getPendingFieldLabel}
					/>
				)}

				{decision && decision !== MerchantKycEvaluationStatus.Approved && (
					<AsyncButton
						className={
							decision === MerchantKycEvaluationStatus.Rejected
								? 'bg-danger text-danger-foreground'
								: 'bg-warning text-warning-foreground'
						}
						isPending={isPending}
						onPress={onSubmit}
					>
						{decision === MerchantKycEvaluationStatus.Rejected && 'Confirmar rejeição'}
						{decision === MerchantKycEvaluationStatus.Complement && 'Enviar solicitação'}
					</AsyncButton>
				)}
			</Card.Content>
		</Card>
	);
}
