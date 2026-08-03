'use client';

import { Suspense, use, useState, useTransition } from 'react';
import { Alert, Button, Chip, Input, Label, ListBox, Modal, TextField, Skeleton, Spinner } from '@heroui/react';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon, CancelCircleIcon, Search01Icon, Target02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { adminAssignUserReferrer, adminPreviewAssignUserReferrer, listUsersForDevTools } from '@/app/actions/admin/users';
import type { AdminMinimalUser, AdminPreviewAssignUserReferrerData, AdminUserDetails } from '@/types/admin/users';
import type { ApiResponse } from '@/types/common';
import { AsyncButton } from '@/components/ui/async-button';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';

type UserDetailsPromise = Promise<ApiResponse<AdminUserDetails>>;

interface UserAssignReferrerModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	targetUser: AdminMinimalUser | null;
	detailsPromise: UserDetailsPromise | null;
	onAssigned?: () => void;
}

interface DevToolsUserOption {
	id: string;
	name: string | null;
	email: string;
	hasPushEnabled: boolean;
}

function UserAssignReferrerModalContent({
	targetUser,
	detailsPromise,
	onClose,
	onAssigned,
}: {
	targetUser: AdminMinimalUser;
	detailsPromise: UserDetailsPromise;
	onClose: () => void;
	onAssigned?: () => void;
}) {
	const detailsResponse = use(detailsPromise);
	const details = detailsResponse.data;
	const [searchEmail, setSearchEmail] = useState('');
	const [selectedReferrerId, setSelectedReferrerId] = useState<string | null>(null);
	const [selectedReferrerLabel, setSelectedReferrerLabel] = useState<string | null>(null);
	const [results, setResults] = useState<DevToolsUserOption[]>([]);
	const [isSearching, startSearching] = useTransition();
	const [isAssigning, startAssigning] = useTransition();
	const [isPreviewLoading, startPreviewLoading] = useTransition();
	const [processHistoricalCommission, setProcessHistoricalCommission] = useState(false);
	const [preview, setPreview] = useState<AdminPreviewAssignUserReferrerData | null>(null);
	const [confirmReassign, setConfirmReassign] = useState(false);

	if (detailsResponse.error || !details) {
		return (
			<Modal.Body>
				<Alert status="danger">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Erro ao carregar usuário</Alert.Title>
						<Alert.Description>{detailsResponse.error?.message ?? 'Não foi possível carregar os dados.'}</Alert.Description>
					</Alert.Content>
				</Alert>
			</Modal.Body>
		);
	}

	const isAlreadyReferred = !!details.referredByUserId;
	const isChangingReferrer = isAlreadyReferred
		&& !!selectedReferrerId
		&& selectedReferrerId !== details.referredByUserId;

	function handleSearchByEmail() {
		const normalizedSearch = searchEmail.trim();
		if (!normalizedSearch) {
			setResults([]);
			return;
		}

		startSearching(async () => {
			const response = await listUsersForDevTools(normalizedSearch);
			if (response.error) {
				toast('Erro ao buscar usuário', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				setResults([]);
				return;
			}

			const options = (response.data ?? [])
				.filter((item) => item.id !== targetUser.id)
				.map((item) => ({
					id: item.id,
					name: item.name,
					email: item.email,
					hasPushEnabled: item.hasPushEnabled,
				}));

			setResults(options);
		});
	}

	function handleSelectReferrer(id: string) {
		setSelectedReferrerId(id);
		const selected = results.find((item) => item.id === id);
		setSelectedReferrerLabel(selected ? `${selected.name ?? 'Sem nome'} (${selected.email})` : null);
		setConfirmReassign(false);

		if (!processHistoricalCommission) {
			setPreview(null);
			return;
		}

		startPreviewLoading(async () => {
			const response = await adminPreviewAssignUserReferrer(targetUser.id, id);
			if (response.error || !response.data) {
				setPreview(null);
				toast('Não foi possível calcular o preview', {
					description: response.error?.message ?? 'Falha ao calcular o valor estimado da comissão.',
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			setPreview(response.data);
		});
	}

	function handleToggleProcessHistorical(value: boolean) {
		setProcessHistoricalCommission(value);

		if (!value) {
			setPreview(null);
			return;
		}

		if (!selectedReferrerId) {
			return;
		}

		startPreviewLoading(async () => {
			const response = await adminPreviewAssignUserReferrer(targetUser.id, selectedReferrerId);
			if (response.error || !response.data) {
				setPreview(null);
				toast('Não foi possível calcular o preview', {
					description: response.error?.message ?? 'Falha ao calcular o valor estimado da comissão.',
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			setPreview(response.data);
		});
	}

	function handleAssign() {
		if (!selectedReferrerId) {
			toast('Selecione o gerente de contas', {
				description: 'Escolha um gerente de contas antes de confirmar.',
				variant: 'warning',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
			return;
		}

		startAssigning(async () => {
			const response = await adminAssignUserReferrer(targetUser.id, {
				referrerUserId: selectedReferrerId,
				processHistoricalCommission,
			});

			if (response.error) {
				toast('Erro ao vincular gerente de contas', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			toast('Gerente de contas vinculado com sucesso', {
				description: response.data?.isProcessingAsync
					? 'Vínculo registrado com sucesso. As comissões históricas serão calculadas em segundo plano.'
					: 'Vínculo com gerente de contas registrado com sucesso.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});

			onAssigned?.();
			onClose();
		});
	}

	return (
		<>
			<Modal.Body className="flex flex-col gap-4">
				<div className="rounded-xl border border-divider bg-content1 p-4">
					<p className="text-sm text-muted">Usuário selecionado</p>
					<p className="text-sm font-medium">{details.name ?? 'Sem nome'} ({details.email})</p>
				</div>

				{isAlreadyReferred && (
					<Alert status="warning">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Usuário já vinculado a outro gerente de contas</Alert.Title>
							<Alert.Description>
								<div className="flex flex-col gap-1">
									<span>Gerente de contas atual:</span>
									<span><strong>ID:</strong> {details.referredByUserId ?? 'Não informado'}</span>
									<span><strong>Nome:</strong> {details.referredByUserName ?? 'Não informado'}</span>
									<span><strong>E-mail:</strong> {details.referredByUserEmail ?? 'Não informado'}</span>
								</div>
							</Alert.Description>
						</Alert.Content>
					</Alert>
				)}

				<div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
							<TextField variant="secondary" name="searchEmail" value={searchEmail} onChange={(value) => setSearchEmail(value)}>
								<Label>Buscar gerente de contas por e-mail</Label>
								<Input variant="secondary" placeholder="usuario@dominio.com" />
							</TextField>
							<AsyncButton
								type="button"
								variant="secondary"
								onPress={handleSearchByEmail}
								isPending={isSearching}
							>
								<Icon icon={Search01Icon} className="icon-sm" />
								Buscar
							</AsyncButton>
						</div>

						<div className="rounded-xl border border-divider bg-surface p-2">
							{results.length === 0 ? (
								<p className="px-2 py-3 text-xs text-muted">Nenhum usuário encontrado para seleção.</p>
							) : (
								<ListBox
									aria-label="Resultados de busca de gerente de contas"
									selectionMode="single"
									selectedKeys={selectedReferrerId ? [selectedReferrerId] : []}
									onSelectionChange={(keys) => {
										const selectedKey = Array.from(keys as Set<React.Key>)[0];
										if (selectedKey) {
											handleSelectReferrer(String(selectedKey));
										}
									}}
								>
									{results.map((result) => (
										<ListBox.Item key={result.id} id={result.id} textValue={`${result.name ?? ''} ${result.email}`}>
											<div className="flex flex-col">
												<span className="text-sm font-medium">{result.name ?? 'Sem nome'}</span>
												<span className="text-xs text-muted">{result.email}</span>
											</div>
											<ListBox.ItemIndicator />
										</ListBox.Item>
									))}
								</ListBox>
							)}
						</div>

						{selectedReferrerLabel && (
							<div className="flex items-center gap-2 text-sm">
								<span className="text-muted">Selecionado:</span>
								<Chip variant="soft" color="accent" size="sm">{selectedReferrerLabel}</Chip>
							</div>
						)}

						{isChangingReferrer && (
							<label className="flex flex-col gap-2 rounded-xl border border-warning-soft-hover bg-warning-soft p-3 text-sm">
								<div className="flex items-start gap-3">
									<input
										type="checkbox"
										checked={confirmReassign}
										onChange={(event) => setConfirmReassign(event.target.checked)}
										className="mt-1 h-4 w-4"
									/>
									<span>Confirmo a troca de gerente de contas deste usuário.</span>
								</div>
								<p className="text-xs text-muted pl-7">
									Ao confirmar, o vínculo atual será substituído pelo novo gerente de contas selecionado.
									Se &quot;Processar novamente&quot; estiver marcado, o saldo compilado será revertido do gerente de contas atual
									e recompilado para o novo gerente de contas.
								</p>
							</label>
						)}

						<label className="flex flex-col gap-2 rounded-xl border border-divider bg-content1 p-3 text-sm">
							<div className="flex items-start gap-3">
							<input
								type="checkbox"
								checked={processHistoricalCommission}
								onChange={(event) => handleToggleProcessHistorical(event.target.checked)}
								className="mt-1 h-4 w-4"
							/>
							<span>Processar novamente a comissão histórica do usuário indicado.</span>
							</div>
							<p className="text-xs text-muted pl-7">
								Ao marcar esta opção, o sistema recompila as movimentações elegíveis já concluídas
								(pagamentos e saques) do indicado dentro da janela de indicação, atualizando os
								totais de comissão compilada. Use apenas quando houver ajuste de vínculo
								recente ou necessidade de reconciliação histórica.
							</p>
						</label>

						{processHistoricalCommission && selectedReferrerId && (
							<div className="rounded-xl border border-divider bg-surface p-3">
								<p className="text-sm font-medium text-foreground">Preview da comissão histórica</p>
								{isPreviewLoading ? (
									<div className="flex items-center gap-2 pt-2 text-sm text-muted">
										<Spinner size="sm" />
										<span>Calculando valor estimado...</span>
									</div>
								) : preview ? (
									<div className="mt-2 flex flex-col gap-2 text-sm">
										<div className="flex justify-between">
											<span className="text-muted">Comissão estimada total</span>
											<span className="font-semibold text-success">{formatCurrency(preview.estimatedCommissionTotal)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Pagamentos elegíveis</span>
											<span>{preview.eligiblePaymentsCount}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Saques elegíveis</span>
											<span>{preview.eligiblePayoutsCount}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Percentual aplicado</span>
											<span>{(preview.referralCommissionPercentage / 100).toFixed(2)}%</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Janela considerada</span>
											<span>{formatDate(preview.referredAt)} até {formatDate(preview.referralWindowEndAt)}</span>
										</div>
									</div>
								) : (
									<p className="pt-2 text-xs text-muted">Não foi possível calcular o preview no momento.</p>
								)}
							</div>
						)}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose} isDisabled={isAssigning}>
					Fechar
				</Button>
				<AsyncButton
					type="button"
					variant="primary"
					onPress={handleAssign}
					isPending={isAssigning}
					isDisabled={!selectedReferrerId || (isChangingReferrer && !confirmReassign)}
				>
					Confirmar vínculo
				</AsyncButton>
			</Modal.Footer>
		</>
	);
}

export function UserAssignReferrerModal({
	isOpen,
	onOpenChange,
	targetUser,
	detailsPromise,
	onAssigned,
}: UserAssignReferrerModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Target02Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Vincular gerente de contas</Modal.Heading>
						<p className="text-sm text-muted">Vincule manualmente um gerente de contas para o usuário selecionado.</p>
					</Modal.Header>

					{targetUser && detailsPromise ? (
						<Suspense
							fallback={
								<Modal.Body className="flex flex-col gap-3">
									<Skeleton className="h-20 rounded-xl" />
									<Skeleton className="h-20 rounded-xl" />
									<Skeleton className="h-10 rounded-xl" />
								</Modal.Body>
							}
						>
							<UserAssignReferrerModalContent
								targetUser={targetUser}
								detailsPromise={detailsPromise}
								onClose={handleClose}
								onAssigned={onAssigned}
							/>
						</Suspense>
					) : (
						<Modal.Body className="flex flex-col gap-3">
							<Skeleton className="h-20 rounded-xl" />
							<Skeleton className="h-20 rounded-xl" />
							<Skeleton className="h-10 rounded-xl" />
						</Modal.Body>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
