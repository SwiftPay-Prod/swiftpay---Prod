'use client';

import { useState, useActionState } from 'react';
import { Button, TextField, Input, Label, Modal, Tabs, TextArea } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { Icon } from '@/components/ui/icon';
import { ArrowUpIcon, ArrowDownIcon, PackageIcon, Alert01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { adjustProductStock } from '@/app/actions/merchant/products';
import { StockMovementType } from '@/types/enums';
import { toast } from '@heroui/react';

interface FormState {
	error: string | null;
}

interface StockAdjustmentModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	productId: string;
	variantId?: string | null;
	variantName?: string | null;
	currentStock: number | null;
	onSuccess: (newStock: number) => void;
}

export function StockAdjustmentModal({
	isOpen,
	onOpenChange,
	merchantId,
	productId,
	variantId,
	variantName,
	currentStock,
	onSuccess,
}: StockAdjustmentModalProps) {
	const [selectedType, setSelectedType] = useState<StockMovementType>(StockMovementType.In);
	const [quantity, setQuantity] = useState<number | undefined>(undefined);
	const [notes, setNotes] = useState('');

	const displayStock = currentStock ?? 0;
	const previewStock =
		selectedType === StockMovementType.In ? displayStock + (quantity ?? 0) : displayStock - (quantity ?? 0);

	function handleClose() {
		setQuantity(undefined);
		setNotes('');
		setSelectedType(StockMovementType.In);
		onOpenChange(false);
	}

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState): Promise<FormState> => {
			if (!quantity || quantity <= 0) {
				return { error: 'Informe uma quantidade válida' };
			}

			if (selectedType === StockMovementType.Out && quantity > displayStock) {
				return { error: `Estoque insuficiente. Disponível: ${displayStock}` };
			}

			const res = await adjustProductStock(merchantId, productId, {
				type: selectedType,
				quantity,
				variantId: variantId ?? null,
				notes: notes.trim() || null,
			});

			if (res?.error) {
				return { error: res.error.message ?? 'Erro ao ajustar estoque' };
			}

			toast('Estoque ajustado', {
				description: res?.message ?? 'O estoque foi ajustado com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onSuccess(res?.data?.balanceAfter ?? previewStock);
			handleClose();
			return { error: null };
		},
		{ error: null }
	);

	const isValid = quantity !== undefined && quantity > 0;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={PackageIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Ajuste de Estoque</Modal.Heading>
						<p className="text-sm text-muted">{variantName ? `Variante: ${variantName}` : 'Produto principal'}</p>
					</Modal.Header>
					<form action={formAction}>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between rounded-lg bg-content2 p-4">
									<span className="text-sm text-muted">Estoque atual</span>
									<span className="text-lg font-semibold">{currentStock ?? '∞'}</span>
								</div>

								<Tabs selectedKey={selectedType} onSelectionChange={(key) => setSelectedType(key as StockMovementType)}>
									<Tabs.List aria-label="Tipo de movimentação" className="w-full">
										<Tabs.Tab id={StockMovementType.In} className="flex-1 text-success">
											<Icon icon={ArrowDownIcon} className="icon-sm text-success" />
											Entrada
											<Tabs.Indicator className="bg-success-soft" />
										</Tabs.Tab>
										<Tabs.Tab id={StockMovementType.Out} className="flex-1 text-danger">
											<Icon icon={ArrowUpIcon} className="icon-sm text-danger" />
											Saída
											<Tabs.Indicator className="bg-danger-soft" />
										</Tabs.Tab>
									</Tabs.List>
								</Tabs>

								<TextField variant="secondary">
									<Label>Quantidade</Label>
									<NumericFormat
										customInput={Input}
										placeholder="0"
										value={quantity}
										onValueChange={(values) => setQuantity(values.floatValue)}
										allowNegative={false}
										decimalScale={0}
									/>
								</TextField>

								<TextField variant="secondary" value={notes} onChange={setNotes}>
									<Label>Observação (opcional)</Label>
									<TextArea variant="secondary" placeholder="Motivo do ajuste..." />
								</TextField>

								{isValid && (
									<div className="flex items-center justify-between rounded-lg border border-dashed p-4">
										<span className="text-sm text-muted">Estoque após ajuste</span>
										<span className={`text-lg font-semibold ${previewStock < 0 ? 'text-danger' : 'text-success'}`}>
											{previewStock}
										</span>
									</div>
								)}

								{state.error && (
									<div className="flex items-center gap-2 text-sm text-danger">
										<Icon icon={Alert01Icon} className="icon-sm" />
										<span>{state.error}</span>
									</div>
								)}
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton
								type="submit"
								variant="primary"
								className={selectedType === StockMovementType.In ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}
								isPending={isPending}
								isDisabled={!isValid}
							>
								{selectedType === StockMovementType.In ? 'Registrar Entrada' : 'Registrar Saída'}
							</AsyncButton>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

