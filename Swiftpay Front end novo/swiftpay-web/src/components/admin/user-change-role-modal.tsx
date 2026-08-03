'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Label, Select, ListBox, Modal } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { UserRole } from '@/types/enums';
import { userRoleParse, mapParseColorToChipColor } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';
import { adminUpdateUserRole } from '@/app/actions/admin/users';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';

interface UserChangeRoleModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	user: {
		id: string;
		name: string | null;
		email: string;
		role: UserRole;
	} | null;
	currentUserRole: UserRole;
}

const availableRoles = [UserRole.God, UserRole.Admin, UserRole.Support, UserRole.Merchant];

export function UserChangeRoleModal({ isOpen, onOpenChange, user, currentUserRole }: UserChangeRoleModalProps) {
	const router = useRouter();
	const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
	const [isPending, setIsPending] = useState(false);

	const canAssignRole = (adminRole: UserRole, newRole: UserRole): boolean => {
		const roleLevels: Record<UserRole, number> = {
			[UserRole.God]: 0,
			[UserRole.Admin]: 1,
			[UserRole.Merchant]: 2,
			[UserRole.Support]: 3,
		};
		
		const adminLevel = roleLevels[adminRole];
		const newRoleLevel = roleLevels[newRole];

		return adminLevel <= newRoleLevel;
	};

	const getAvailableRoles = (): UserRole[] => {
		return availableRoles.filter(role => canAssignRole(currentUserRole, role));
	};

	const availableRolesForUser = getAvailableRoles();

	const handleClose = () => {
		if (!isPending) {
			onOpenChange(false);
			setSelectedRole(null);
		}
	};

	const handleChangeRole = async () => {
		if (!user || !selectedRole) return;

		setIsPending(true);
		try {
			const response = await adminUpdateUserRole(user.id, selectedRole);
			if (response.error) {
				toast('Erro ao alterar cargo', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				toast('Cargo alterado', {
					description: `Cargo alterado para ${userRoleParse[selectedRole].label}`,
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				onOpenChange(false);
				setSelectedRole(null);
				router.refresh();
			}
		} catch {
			toast('Erro ao alterar cargo', {
				description: 'Ocorreu um erro inesperado. Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
		} finally {
			setIsPending(false);
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!isPending) {
			onOpenChange(open);
			if (!open) setSelectedRole(null);
		}
	};

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange} isDismissable={!isPending}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={PencilEdit01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Alterar cargo</Modal.Heading>
						<p className="text-sm text-muted">Altere o cargo do usuário {user?.name || user?.email}.</p>
					</Modal.Header>
					<Modal.Body>
						<Select
							variant="secondary"
							className="w-full"
							placeholder="Selecione o cargo"
							value={selectedRole ?? ''}
							onChange={(key) => setSelectedRole(key as UserRole)}
							isDisabled={isPending}
						>
							<Label>Novo cargo</Label>
							<Select.Trigger>
								<Select.Value>
									{selectedRole ? (
										<div className="flex items-center gap-2">
											<Chip variant="soft"
												color={mapParseColorToChipColor(userRoleParse[selectedRole].color)}
												size="sm"
												className="gap-1"
											>
												{userRoleParse[selectedRole].icon}
												{userRoleParse[selectedRole].label}
											</Chip>
										</div>
									) : (
										'Selecione o cargo'
									)}
								</Select.Value>
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{availableRolesForUser.map((r) => (
										<ListBox.Item key={r} id={r} textValue={userRoleParse[r].label}>
											<Chip variant="soft" color={mapParseColorToChipColor(userRoleParse[r].color)} size="sm" className="gap-1">
												{userRoleParse[r].icon}
												{userRoleParse[r].label}
											</Chip>
											<ListBox.ItemIndicator />
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
							Cancelar
						</Button>
						<AsyncButton
							variant="primary"
							onPress={handleChangeRole}
							isPending={isPending}
							isDisabled={!selectedRole || selectedRole === user?.role}
						>
							Alterar cargo
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

