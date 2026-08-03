'use client';

import { useState, useActionState } from 'react';
import { Modal, Button, TextField, Input, Label, Select, ListBox, Chip } from '@heroui/react';
import { AddCircleIcon, Alert01Icon, CheckmarkCircle02Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { createMerchantCategory, updateMerchantCategory } from '@/app/actions/merchant/products';
import { categoryStatusOptions, categoryStatusParse, mapParseColorToChipColor } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import { CategoryStatus } from '@/types/enums';
import type { PaymentEnvironment } from '@/types/enums';
import type { MinimalCategoryData } from '@/types/merchant/products';

interface FormState {
	error: string | null;
}

type CategoryModalMode = 'create' | 'edit';

interface CategoryModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	environment: PaymentEnvironment;
	mode: CategoryModalMode;
	category?: MinimalCategoryData | null;
	onSuccess: (category?: MinimalCategoryData) => void;
}

interface CategoryFormProps {
	isEdit: boolean;
	category?: MinimalCategoryData | null;
	merchantId: string;
	environment: PaymentEnvironment;
	onSuccess: (category?: MinimalCategoryData) => void;
	onClose: () => void;
}

function CategoryForm({ isEdit, category, merchantId, environment, onSuccess, onClose }: CategoryFormProps) {
	const [name, setName] = useState(isEdit && category ? category.name : '');
	const [description, setDescription] = useState('');
	const [selectedStatus, setSelectedStatus] = useState<CategoryStatus>(
		isEdit && category ? category.status : CategoryStatus.Active
	);

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const formName = formData.get('name') as string;
			const formDescription = formData.get('description') as string;

			if (!formName.trim()) return { error: 'Informe o nome da categoria' };

			if (isEdit && category) {
				const res = await updateMerchantCategory(merchantId, category.id, {
					name: formName.trim(),
					status: selectedStatus,
				});

				if (res?.error) return { error: res.error.message };

				toast('Categoria atualizada', {
					description: res?.message || 'As alterações foram salvas com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				onSuccess();
				onClose();
			} else {
				const res = await createMerchantCategory(merchantId, {
					name: formName.trim(),
					environment,
					description: formDescription.trim() || null,
				});

				if (res?.error) return { error: res.error.message };

				if (res?.data) {
					const newCategory: MinimalCategoryData = {
						id: res.data.id,
						externalId: res.data.externalId,
						name: res.data.name,
						status: res.data.status,
						environment: res.data.environment,
						productCount: 0,
						createdAt: res.data.createdAt,
					};
					toast('Categoria criada', {
						description: 'A categoria foi criada com sucesso.',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
					onSuccess(newCategory);
					onClose();
				}
			}

			return { error: null };
		},
		{ error: null }
	);

	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					{isEdit ? <Icon icon={PencilEdit01Icon} className="icon-md" /> : <Icon icon={AddCircleIcon} className="icon-md" />}
				</Modal.Icon>
				<Modal.Heading>{isEdit ? 'Editar Categoria' : 'Nova Categoria'}</Modal.Heading>
				{!isEdit && <p className="text-sm text-muted">Crie uma nova categoria para seus produtos</p>}
			</Modal.Header>
			<form action={formAction}>
				<Modal.Body>
					<div className="flex flex-col gap-4">
						<TextField variant="secondary" aria-label="Nome da categoria" name="name" isRequired value={name} onChange={setName}>
							<Label>Nome da categoria</Label>
							<Input variant="secondary" placeholder="Nome da categoria..." autoFocus />
						</TextField>

						{!isEdit && (
							<TextField variant="secondary" aria-label="Descrição" name="description" value={description} onChange={setDescription}>
								<Label>Descrição (opcional)</Label>
								<Input variant="secondary" placeholder="Descrição..." />
							</TextField>
						)}

						{isEdit && (
							<div className="flex flex-col gap-1.5">
								<Label>Status</Label>
								<Select
									variant="secondary"
									aria-label="Status"
									placeholder="Selecione o status"
									value={selectedStatus}
									onChange={(key) => setSelectedStatus(key as CategoryStatus)}
								>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{categoryStatusOptions.map((option) => {
												const statusParse = categoryStatusParse[option.value];
												return (
													<ListBox.Item key={option.value} id={option.value} textValue={option.label}>
														<div className="flex items-center gap-2">
															<Chip
																size="sm"
																variant="soft"
																color={mapParseColorToChipColor(statusParse.color)}
																className="gap-1"
															>
																{statusParse.icon}
																{option.label}
															</Chip>
														</div>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												);
											})}
										</ListBox>
									</Select.Popover>
								</Select>
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
					<Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
						Cancelar
					</Button>
					<AsyncButton type="submit" variant="primary" isPending={isPending} isDisabled={!name.trim()}>
						{isEdit ? <Icon icon={PencilEdit01Icon} className="icon-sm" /> : <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />}
						{isEdit ? 'Salvar Alterações' : 'Criar Categoria'}
					</AsyncButton>
				</Modal.Footer>
			</form>
		</>
	);
}

export function CategoryModal({
	isOpen,
	onOpenChange,
	merchantId,
	environment,
	mode,
	category,
	onSuccess,
}: CategoryModalProps) {
	const isEdit = mode === 'edit' && !!category;

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					{isOpen && (
						<CategoryForm
							key={isEdit ? category?.id : 'create'}
							isEdit={isEdit}
							category={category}
							merchantId={merchantId}
							environment={environment}
							onSuccess={onSuccess}
							onClose={handleClose}
						/>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

