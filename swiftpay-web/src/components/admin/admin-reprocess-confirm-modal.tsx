'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Button, Select, Label, ListBox, Chip, Checkbox } from '@heroui/react';
import type { ParseColor } from '@/parse/types';
import { mapParseColorToChipColor } from '@/parse';

interface AdminReprocessOption {
	value: string;
	label: string;
	color?: ParseColor;
	icon?: ReactNode;
}

interface AdminReprocessConfirmModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	statusLabel: string;
	acknowledgeLabel: string;
	options: AdminReprocessOption[];
	defaultStatus?: string;
	isPending?: boolean;
	onConfirm: (targetStatus: string) => Promise<void>;
}

export function AdminReprocessConfirmModal({
	isOpen,
	onOpenChange,
	title,
	description,
	confirmLabel,
	statusLabel,
	acknowledgeLabel,
	options,
	defaultStatus,
	isPending = false,
	onConfirm,
}: AdminReprocessConfirmModalProps) {
	const initialStatus = useMemo(() => defaultStatus ?? options[0]?.value ?? '', [defaultStatus, options]);
	const [selectedStatus, setSelectedStatus] = useState(initialStatus);
	const [isAware, setIsAware] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		Promise.resolve().then(() => {
			setSelectedStatus(initialStatus);
			setIsAware(false);
		});
	}, [isOpen, initialStatus]);

	const canConfirm = selectedStatus.length > 0 && isAware && !isPending;

	async function handleConfirm() {
		if (!canConfirm) return;
		await onConfirm(selectedStatus);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="sm" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>{title}</Modal.Heading>
						<p className="text-sm text-muted">{description}</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							<Select variant="secondary" value={selectedStatus} onChange={(key) => setSelectedStatus((key as string) || '')}>
								<Label className="text-sm font-medium text-foreground">{statusLabel}</Label>
								<Select.Trigger>
									<Select.Value>
										{(() => {
											const selectedOption = options.find((option) => option.value === selectedStatus);
											if (!selectedOption) return 'Selecione um status';

											if (selectedOption.color) {
												return (
													<Chip variant="soft" color={mapParseColorToChipColor(selectedOption.color)} size="sm" className="gap-1">
														{selectedOption.icon}
														{selectedOption.label}
													</Chip>
												);
											}

											return selectedOption.label;
										})()}
									</Select.Value>
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{options.map((option) => (
											<ListBox.Item key={option.value} id={option.value} textValue={option.label}>
												{option.color ? (
													<Chip variant="soft" color={mapParseColorToChipColor(option.color)} size="sm" className="gap-1">
														{option.icon}
														{option.label}
													</Chip>
												) : (
													option.label
												)}
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							<Checkbox
								variant="secondary"
								isSelected={isAware}
								onChange={setIsAware}
								className="items-start"
							>
								<Checkbox.Control>
									<Checkbox.Indicator />
								</Checkbox.Control>
								<Checkbox.Content>
									<Label className="text-sm text-foreground/90 cursor-pointer">{acknowledgeLabel}</Label>
								</Checkbox.Content>
							</Checkbox>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isPending}>
							Cancelar
						</Button>
						<Button variant="primary" onPress={handleConfirm} isDisabled={!canConfirm} isPending={isPending}>
							{confirmLabel}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
