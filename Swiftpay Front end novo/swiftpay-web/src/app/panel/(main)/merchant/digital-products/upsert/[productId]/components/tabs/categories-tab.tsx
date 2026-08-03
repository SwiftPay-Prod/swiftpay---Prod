'use client';

import { useState, useActionState } from 'react';
import { Button, Chip, Modal, Form, TextField, Input, Label, FieldError } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Add01Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { CategorySearchCombobox } from '@/components/merchant/products/category-search-combobox';
import { createMerchantCategory } from '@/app/actions/merchant/products';
import type { MinimalCategoryData } from '@/types/merchant/products';
import type { CategoriesTabProps } from './types';

interface CreateCategoryModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	environment: CategoriesTabProps['environment'];
	onSuccess: (category: MinimalCategoryData) => void;
}

function CreateCategoryModal({ isOpen, onOpenChange, merchantId, environment, onSuccess }: CreateCategoryModalProps) {
	const [state, formAction, isPending] = useActionState(
		async (_prevState: { error: string | null }, formData: FormData): Promise<{ error: string | null }> => {
			const name = formData.get('name') as string;
			if (!name?.trim()) return { error: 'Informe o nome da categoria' };

			const res = await createMerchantCategory(merchantId, { name: name.trim(), environment });

			if (res?.error) return { error: res.error.message ?? 'Erro ao criar categoria' };

			if (res?.data) {
				onSuccess(res.data);
				onOpenChange(false);
			}

			return { error: null };
		},
		{ error: null }
	);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="sm" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-sm">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Add01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Nova Categoria</Modal.Heading>
						<p className="text-sm text-muted">Crie uma categoria para organizar seus produtos</p>
					</Modal.Header>
					<Form action={formAction} validationErrors={state.error ? { name: state.error } : undefined}>
						<Modal.Body>
							<TextField variant="secondary" name="name" isRequired>
								<Label>Nome da Categoria</Label>
								<Input variant="secondary" placeholder="Ex: Eletrônicos, Roupas..." autoFocus />
								<FieldError />
							</TextField>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton type="submit" variant="primary" isPending={isPending}>
								Criar Categoria
							</AsyncButton>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

export function CategoriesTab({
	merchantId,
	environment,
	categories,
	setCategories,
	selectedCategoryIds,
	onSelectCategory,
	onRemoveCategory,
	disabled,
}: CategoriesTabProps) {
	const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

	function handleCategoryCreated(newCategory: MinimalCategoryData) {
		setCategories([...categories, newCategory]);
		onSelectCategory(newCategory);
		setIsCreateCategoryOpen(false);
	}

	return (
		<div className="flex flex-col gap-6">
			<CreateCategoryModal
				isOpen={isCreateCategoryOpen}
				onOpenChange={setIsCreateCategoryOpen}
				merchantId={merchantId}
				environment={environment}
				onSuccess={handleCategoryCreated}
			/>

			<CategorySearchCombobox
				merchantId={merchantId}
				environment={environment}
				selectedCategoryIds={selectedCategoryIds}
				onSelect={onSelectCategory}
				isDisabled={disabled}
			/>

			{selectedCategoryIds.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedCategoryIds.map((id) => {
						const category = categories.find((c) => c.id === id);
						if (!category) return null;
						return (
							<Chip key={id} variant="soft">
								{category.name}
								{!disabled && (
									<button type="button" className="ml-1" onClick={() => onRemoveCategory(id)}>
										<Icon icon={CancelCircleIcon} className="icon-xs" />
									</button>
								)}
							</Chip>
						);
					})}
				</div>
			)}
		</div>
	);
}
