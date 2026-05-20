'use client';

import { useState } from 'react';
import { Button, Input, Label, Modal, Select, TextArea, ListBox } from '@heroui/react';
import { ChampionIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { formatDate } from '@/utils/datetime';
import type { AdminMinimalUser, AdminSuspendFromRankingRequest } from '@/types/admin/users';

interface UserRankingSuspensionModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	user: AdminMinimalUser | null;
	isPending: boolean;
	onConfirm: (data: AdminSuspendFromRankingRequest) => Promise<void>;
	onRemove?: () => Promise<void>;
}

const presets: { label: string; value: number; unit: 'Hours' | 'Days' }[] = [
	{ label: '2h', value: 2, unit: 'Hours' },
	{ label: '6h', value: 6, unit: 'Hours' },
	{ label: '12h', value: 12, unit: 'Hours' },
	{ label: '24h', value: 24, unit: 'Hours' },
	{ label: '3d', value: 3, unit: 'Days' },
	{ label: '7d', value: 7, unit: 'Days' },
	{ label: '30d', value: 30, unit: 'Days' },
];

export function UserRankingSuspensionModal({
	isOpen,
	onOpenChange,
	user,
	isPending,
	onConfirm,
	onRemove,
}: UserRankingSuspensionModalProps) {
	const [durationValue, setDurationValue] = useState('');
	const [durationUnit, setDurationUnit] = useState<'Hours' | 'Days'>('Hours');
	const [reason, setReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	const isCurrentlySuspended = !!(user?.rankingSuspendedUntil && new Date(user.rankingSuspendedUntil) > new Date());

	const activePreset = presets.find((p) => String(p.value) === durationValue && p.unit === durationUnit);

	function handleOpenChange(open: boolean) {
		if (!isPending) {
			onOpenChange(open);
			if (!open) {
				setDurationValue('');
				setDurationUnit('Hours');
				setReason('');
				setError(null);
			}
		}
	}

	function handleClose() {
		handleOpenChange(false);
	}

	function applyPreset(value: number, unit: 'Hours' | 'Days') {
		setDurationValue(String(value));
		setDurationUnit(unit);
		setError(null);
	}

	async function handleConfirm() {
		const parsed = Number(durationValue);
		if (!durationValue || isNaN(parsed) || parsed < 1) {
			setError('Informe uma duração válida (mínimo 1).');
			return;
		}
		if (!reason.trim()) {
			setError('O motivo é obrigatório.');
			return;
		}
		setError(null);
		await onConfirm({ durationValue: parsed, durationUnit, reason: reason.trim() });
	}

	async function handleRemove() {
		if (onRemove) {
			await onRemove();
		}
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange} isDismissable={!isPending}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-warning text-warning-foreground">
							<Icon icon={ChampionIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Suspender do ranking</Modal.Heading>
						<p className="text-sm text-muted">
							Suspenda temporariamente o usuário {user?.name || user?.email} do ranking público.
						</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							{isCurrentlySuspended && (
								<div className="flex flex-col gap-1 rounded-lg border border-warning p-3">
									<span className="text-sm font-medium text-warning">Suspensão ativa</span>
									<span className="text-sm text-muted">
										Expira em {formatDate(user?.rankingSuspendedUntil ?? null)}
										{user?.rankingSuspensionReason ? ` — ${user.rankingSuspensionReason}` : ''}
									</span>
								</div>
							)}

							<div className="flex flex-col gap-2">
								<Label>Duração da suspensão</Label>
								<div className="flex flex-wrap gap-2">
									{presets.map((preset) => (
										<Button
											key={`${preset.value}-${preset.unit}`}
											size="sm"
											variant={activePreset?.label === preset.label ? 'primary' : 'secondary'}
											onPress={() => applyPreset(preset.value, preset.unit)}
											isDisabled={isPending}
										>
											{preset.label}
										</Button>
									))}
								</div>
							</div>

							<div className="flex gap-2 items-end">
								<div className="flex flex-col gap-1 flex-1">
									<Label>Valor personalizado</Label>
									<Input
										type="number"
										min={1}
										placeholder="Ex: 48"
										value={durationValue}
										onChange={(e) => {
											setDurationValue(e.target.value);
											setError(null);
										}}
										disabled={isPending}
										variant="secondary"
									/>
								</div>
								<div className="flex flex-col gap-1 w-32">
									<Label>Unidade</Label>
									<Select
										variant="secondary"
										value={durationUnit}
										onChange={(key) => {
											if (key) setDurationUnit(key as 'Hours' | 'Days');
										}}
										isDisabled={isPending}
									>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												<ListBox.Item id="Hours" textValue="Horas">
													Horas
													<ListBox.ItemIndicator />
												</ListBox.Item>
												<ListBox.Item id="Days" textValue="Dias">
													Dias
													<ListBox.ItemIndicator />
												</ListBox.Item>
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<Label>Motivo da suspensão</Label>
								<TextArea
									variant="secondary"
									placeholder="Informe o motivo da suspensão do ranking..."
									value={reason}
									onChange={(e) => {
										setReason(e.target.value);
										setError(null);
									}}
									className="min-h-20"
									disabled={isPending}
								/>
							</div>

							{error && <span className="text-sm text-danger">{error}</span>}
						</div>
					</Modal.Body>
					<Modal.Footer>
						{isCurrentlySuspended && onRemove && (
							<AsyncButton variant="ghost" className="text-danger mr-auto" onPress={handleRemove} isPending={isPending}>
								Remover suspensão
							</AsyncButton>
						)}
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
							Cancelar
						</Button>
						<AsyncButton
							variant="primary"
							className="bg-warning text-warning-foreground"
							onPress={handleConfirm}
							isPending={isPending}
							isDisabled={!durationValue || !reason.trim()}
						>
							{isCurrentlySuspended ? 'Atualizar suspensão' : 'Suspender do ranking'}
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
