'use client';

import { useState } from 'react';
import { Chip, Input, Label, ListBox, Select, TextArea, TextField } from '@heroui/react';
import { AddCircleIcon, CheckmarkCircle02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { EvaluatePendingItemRequest } from '@/types/admin/merchants';
import { MerchantKycPendingField, MerchantKycPendingItemType } from '@/types/enums';
import { mapParseColorToChipColor, merchantKycPendingItemTypeParse } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface PendingItemsEditorProps {
	pendingItems: EvaluatePendingItemRequest[];
	pendingFieldSearchValues: Record<number, string>;
	onAddPendingItem: () => void;
	onRemovePendingItem: (index: number) => void;
	onUpdatePendingItem: (index: number, field: keyof EvaluatePendingItemRequest, value: string | null) => void;
	onUpdatePendingFieldSearch: (index: number, value: string) => void;
	getPendingFieldOptions: (searchValue: string) => Array<{ key: string; label: string }>;
	getPendingFieldLabel: (fieldKey: MerchantKycPendingField | null | undefined) => string;
}

export function PendingItemsEditor({
	pendingItems,
	pendingFieldSearchValues,
	onAddPendingItem,
	onRemovePendingItem,
	onUpdatePendingItem,
	onUpdatePendingFieldSearch,
	getPendingFieldOptions,
	getPendingFieldLabel,
}: PendingItemsEditorProps) {
	const [confirmedItems, setConfirmedItems] = useState<boolean[]>([]);

	function handleConfirmItem(index: number) {
		setConfirmedItems((previous) => previous.map((value, currentIndex) => (currentIndex === index ? true : value)));
	}

	function handleReopenItem(index: number) {
		setConfirmedItems((previous) => previous.map((value, currentIndex) => (currentIndex === index ? false : value)));
	}

	function handleAddPendingItem() {
		setConfirmedItems((previous) => {
			const normalized = previous.length === pendingItems.length ? previous : pendingItems.map(() => false);
			return [...normalized, false];
		});
		onAddPendingItem();
	}

	function handleRemovePendingItem(index: number) {
		setConfirmedItems((previous) => {
			const normalized = previous.length === pendingItems.length ? previous : pendingItems.map(() => false);
			return normalized.filter((_, currentIndex) => currentIndex !== index);
		});
		onRemovePendingItem(index);
	}

	function handleFieldUpdate(index: number, field: keyof EvaluatePendingItemRequest, value: string | null) {
		handleReopenItem(index);
		onUpdatePendingItem(index, field, value);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">Itens pendentes</span>
				<AsyncButton size="sm" variant="secondary" onPress={handleAddPendingItem}>
					<Icon icon={AddCircleIcon} className="icon-sm" />
					Adicionar
				</AsyncButton>
			</div>

			{pendingItems.length === 0 && (
				<p className="text-center text-sm text-foreground-500">
					Adicione os itens que a organização precisa complementar.
				</p>
			)}

			{pendingItems.length > 0 && (
				<div className="flex flex-col gap-2">
					{pendingItems.map((item, index) => {
						const itemKey = `pending-${index}`;
						const isConfirmed = confirmedItems.length === pendingItems.length ? (confirmedItems[index] ?? false) : false;
						const canConfirmItem =
							Boolean(item.type) &&
							Boolean(item.fieldKey) &&
							Boolean(item.title.trim()) &&
							Boolean((item.description ?? '').trim());

						return (
							<SystemAccordion
								key={`${itemKey}-${isConfirmed ? 'confirmed' : 'editing'}`}
								id={itemKey}
								defaultExpanded={!isConfirmed}
								color={isConfirmed ? 'success' : 'accent'}
								hideIcon
								title={`Item ${index + 1}`}
								summary={
									<span className="inline-flex items-center gap-2">
										<span>{isConfirmed ? 'Confirmado' : 'Em edição'}</span>
										<span
											role="button"
											tabIndex={0}
											aria-label={`Remover item pendente ${index + 1}`}
											className="button button--icon-only button--sm button--tertiary"
											onClick={(event) => {
												event.stopPropagation();
												handleRemovePendingItem(index);
											}}
											onMouseDown={(event) => event.stopPropagation()}
											onKeyDown={(event) => {
												event.stopPropagation();
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													handleRemovePendingItem(index);
												}
											}}
											onKeyUp={(event) => event.stopPropagation()}
										>
											<Icon icon={Delete02Icon} className="icon-sm text-danger" />
										</span>
									</span>
								}
							>
								<Select
									variant="secondary"
									value={item.type}
									onChange={(key) => handleFieldUpdate(index, 'type', key as MerchantKycPendingItemType)}
								>
									<Label isRequired>Tipo</Label>
									<Select.Trigger className="w-full">
										<Select.Value />
										<Select.Indicator className="size-4" />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{Object.values(MerchantKycPendingItemType).map((type) => {
												const parse = merchantKycPendingItemTypeParse[type];
												return (
													<ListBox.Item key={type} id={type} textValue={parse?.label ?? type}>
														<Chip variant="soft" color={mapParseColorToChipColor(parse?.color ?? 'default')}>
															{parse?.icon}
															{parse?.label ?? type}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												);
											})}
										</ListBox>
									</Select.Popover>
								</Select>

								<AsyncCombobox
									label="Campo a complementar"
									isRequired
									placeholder="Selecione o campo"
									searchPlaceholder="Buscar campo..."
									searchValue={pendingFieldSearchValues[index] ?? ''}
									selectedValue={item.fieldKey ? getPendingFieldLabel(item.fieldKey) : null}
									minSearchLength={0}
									isLoading={false}
									options={getPendingFieldOptions(pendingFieldSearchValues[index] ?? '')}
									value={item.fieldKey}
									emptyMessage="Nenhum campo encontrado"
									onSearchChange={(value) => onUpdatePendingFieldSearch(index, value)}
									onChange={(key) => handleFieldUpdate(index, 'fieldKey', key as MerchantKycPendingField | null)}
								/>

								<TextField variant="secondary" aria-label="Título">
									<Label isRequired>Título</Label>
									<Input
										variant="secondary"
										placeholder="Ex: Contrato social atualizado"
										value={item.title}
										onChange={(event) => handleFieldUpdate(index, 'title', event.target.value)}
									/>
								</TextField>

								<TextField variant="secondary" aria-label="Descrição">
									<Label isRequired>Descrição</Label>
									<TextArea
										variant="secondary"
										placeholder="Descreva o que precisa ser enviado..."
										value={item.description ?? ''}
										onChange={(event) => handleFieldUpdate(index, 'description', event.target.value || null)}
										rows={2}
									/>
								</TextField>

								<div className="flex justify-end">
									<AsyncButton
										size="sm"
										variant="secondary"
										isDisabled={!isConfirmed && !canConfirmItem}
										onPress={() => {
											if (isConfirmed) {
												handleReopenItem(index);
												return;
											}

											if (!canConfirmItem) {
												return;
											}

											handleConfirmItem(index);
										}}
									>
										<Icon icon={CheckmarkCircle02Icon} className={`${isConfirmed ? 'text-danger' : ''} icon-sm`} />
										<span className={isConfirmed ? 'text-danger' : undefined}>
											{isConfirmed ? 'Desmarcar confirmação' : 'Confirmar item pendente'}
										</span>
									</AsyncButton>
								</div>
							</SystemAccordion>
						);
					})}
				</div>
			)}
		</div>
	);
}
