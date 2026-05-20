'use client';

import { Avatar, Button, InputGroup, Label, Modal, TextArea, TextField } from '@heroui/react';
import { SecurityLockIcon, ServerStack01Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncAutocomplete } from '@/components/ui/async-autocomplete';
import type { AdminAcquirerData, AcquirerAccessAccount } from '@/types/admin/acquirers';

function getAcquirerLabel(acquirer: Pick<AdminAcquirerData, 'displayName' | 'name'>): string {
	return acquirer.displayName?.trim() || acquirer.name;
}

interface AddAccessAccountModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onClose: () => void;
	isPending: boolean;
	acquirers: AdminAcquirerData[];
	selectedAcquirerId: string;
	onSelectAcquirerId: (value: string) => void;
	searchValue: string;
	onSearchChange: (value: string) => void;
	isModalPasswordVisible: boolean;
	onTogglePasswordVisible: () => void;
	newAccount: AcquirerAccessAccount;
	onChangeNewAccount: (updater: (prev: AcquirerAccessAccount) => AcquirerAccessAccount) => void;
	onAddAccount: () => void;
}

export function AddAccessAccountModal({
	isOpen,
	onOpenChange,
	onClose,
	isPending,
	acquirers,
	selectedAcquirerId,
	onSelectAcquirerId,
	searchValue,
	onSearchChange,
	isModalPasswordVisible,
	onTogglePasswordVisible,
	newAccount,
	onChangeNewAccount,
	onAddAccount,
}: AddAccessAccountModalProps) {
	const normalizedSearch = searchValue.trim().toLowerCase();
	const filteredAcquirers =
		normalizedSearch.length < 1
			? acquirers
			: acquirers.filter((acquirer) => {
				const display = getAcquirerLabel(acquirer).toLowerCase();
				const nominal = (acquirer.nominal ?? '').toLowerCase();
				const name = (acquirer.name ?? '').toLowerCase();
				return display.includes(normalizedSearch) || nominal.includes(normalizedSearch) || name.includes(normalizedSearch);
			});

	const acquirerOptions = filteredAcquirers.map((acquirer) => ({
		key: acquirer.id,
		label: getAcquirerLabel(acquirer),
		startContent: (
			<Avatar size="sm">
				{acquirer.logoUrl ? (
					<Avatar.Image src={acquirer.logoUrl} alt={getAcquirerLabel(acquirer)} />
				) : (
					<Avatar.Fallback>
						<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
					</Avatar.Fallback>
				)}
			</Avatar>
		),
	}));

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={SecurityLockIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Adicionar conta</Modal.Heading>
						<p className="text-sm text-muted">
							Preencha login, senha e selecione a processadora vinculada a conta.
						</p>
					</Modal.Header>

					<Modal.Body>
						<div className="flex flex-col gap-4">
							<AsyncAutocomplete
								label="Processadora"
								placeholder="Selecione a processadora"
								searchPlaceholder="Buscar processadora"
								minSearchLength={0}
								searchValue={searchValue}
								onSearchChange={onSearchChange}
								isLoading={false}
								options={acquirerOptions}
								value={selectedAcquirerId || null}
								emptyMessage="Nenhuma processadora encontrada"
								onChange={(key) => onSelectAcquirerId(key ?? '')}
								isRequired
							/>

							<TextField
								variant="secondary"
								isRequired
								value={newAccount.login}
								onChange={(value) => onChangeNewAccount((prev) => ({ ...prev, login: value }))}
							>
								<Label>Login (e-mail ou username)</Label>
								<InputGroup>
									<InputGroup.Input placeholder="Ex: user@acquirer.com ou admin_operacao" />
								</InputGroup>
							</TextField>

							<TextField
								variant="secondary"
								isRequired
								value={newAccount.password}
								onChange={(value) => onChangeNewAccount((prev) => ({ ...prev, password: value }))}
								type={isModalPasswordVisible ? 'text' : 'password'}
							>
								<Label>Senha</Label>
								<InputGroup>
									<InputGroup.Input placeholder="Digite a senha da conta" />
									<InputGroup.Suffix>
										<Button
											isIconOnly
											size="sm"
											variant="ghost"
											onPress={onTogglePasswordVisible}
											aria-label={isModalPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
										>
											<Icon icon={isModalPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
										</Button>
									</InputGroup.Suffix>
								</InputGroup>
							</TextField>

							<TextField variant="secondary">
								<Label>Descricao</Label>
								<TextArea
									variant="secondary"
									value={newAccount.description || ''}
									onChange={(event) =>
										onChangeNewAccount((prev) => ({ ...prev, description: event.target.value || null }))
									}
									placeholder="Ex: Conta do financeiro - turno manha"
									rows={3}
								/>
							</TextField>
						</div>
					</Modal.Body>

					<Modal.Footer>
						<Button variant="tertiary" onPress={onClose}>
							Cancelar
						</Button>
						<Button variant="primary" onPress={onAddAccount} isDisabled={isPending}>
							Adicionar conta
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
