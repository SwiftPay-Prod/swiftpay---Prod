'use client';

import { useState, useCallback, useTransition } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import type { z } from 'zod';
import type { ProductType } from '@/types/enums';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import { createElement } from 'react';
import { Icon } from '@/components/ui/icon';

interface UseProductFormOptions<TFieldValues extends FieldValues> {
	schema: z.ZodType<TFieldValues>;
	defaultValues: TFieldValues;
	isEditMode: boolean;
	productType: ProductType;
	onSubmit: (data: TFieldValues) => Promise<{ success: boolean; error?: string }>;
	onDelete?: () => Promise<{ success: boolean; error?: string }>;
}

interface UseProductFormReturn<TFieldValues extends FieldValues> {
	form: UseFormReturn<TFieldValues>;
	isViewMode: boolean;
	isSubmitting: boolean;
	isDeleting: boolean;
	isDirty: boolean;
	enableEdit: () => void;
	cancelEdit: () => void;
	handleSubmit: () => void;
	handleDelete: () => Promise<void>;
}

export function useProductForm<TFieldValues extends FieldValues>({
	schema,
	defaultValues,
	isEditMode,
	onSubmit,
	onDelete,
}: UseProductFormOptions<TFieldValues>): UseProductFormReturn<TFieldValues> {
	const router = useRouter();
	const [isViewMode, setIsViewMode] = useState(isEditMode);
	const [isSubmitting, startSubmitTransition] = useTransition();
	const [isDeleting, startDeleteTransition] = useTransition();

	const form = useForm<TFieldValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(schema as any) as Resolver<TFieldValues>,
		defaultValues: defaultValues as DefaultValues<TFieldValues>,
		mode: 'onChange',
	});

	const { formState: { isDirty }, reset } = form;

	const enableEdit = useCallback(() => {
		setIsViewMode(false);
	}, []);

	const cancelEdit = useCallback(() => {
		reset(defaultValues);
		setIsViewMode(true);
	}, [reset, defaultValues]);

	const handleSubmit = useCallback(() => {
		form.handleSubmit((data) => {
			startSubmitTransition(async () => {
				const result = await onSubmit(data);
				if (result.success) {
					reset(data);
					if (isEditMode) {
						setIsViewMode(true);
						router.refresh();
					}
				} else if (result.error) {
					toast('Erro ao salvar', {
						description: result.error,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				}
			});
		})();
	}, [form, onSubmit, reset, isEditMode, router]);

	const handleDelete = useCallback(async () => {
		if (!onDelete) return;

		startDeleteTransition(async () => {
			const result = await onDelete();
			if (!result.success && result.error) {
				toast('Erro ao excluir', {
					description: result.error,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			}
		});
	}, [onDelete]);

	return {
		form,
		isViewMode,
		isSubmitting,
		isDeleting,
		isDirty,
		enableEdit,
		cancelEdit,
		handleSubmit,
		handleDelete,
	};
}

