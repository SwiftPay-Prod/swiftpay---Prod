'use client';

import { Button, Chip, ListBox, Tooltip } from '@heroui/react';
import {
	AddCircleHalfDotIcon,
	CheckmarkCircle02Icon,
	Delete02Icon,
	PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import type {
	PaymentLinkDomainMethodOptions,
	PaymentLinkDomainOption,
} from '@/types/admin/platform-settings';
import { PaymentMethod } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import { mapParseColorToChipColor } from '@/parse';
import { InternalListBox } from '@/components/ui/internal-list-box';
import {
	buildDomainEditorKey,
	paymentMethodColor,
	paymentMethodLabel,
} from '../platform-settings-form.helpers';

interface PaymentLinkDomainMethodAccordionProps {
	method: PaymentMethod;
	paymentLinkDomainOptions: PaymentLinkDomainMethodOptions[];
	pendingRemovalKey: string | null;
	onAddDomain: (method: PaymentMethod) => void;
	onEditDomain: (method: PaymentMethod, option: PaymentLinkDomainOption) => void;
	onSetDefaultDomain: (method: PaymentMethod, optionId: string) => void;
	onRequestDomainRemoval: (method: PaymentMethod, optionId: string) => void;
	onConfirmDomainRemoval: (method: PaymentMethod, optionId: string) => void;
	onCancelDomainRemoval: () => void;
}

function methodActionClasses(method: PaymentMethod): string {
	switch (method) {
		case PaymentMethod.Pix:
			return 'text-success hover:border-success-soft-hover hover:bg-success-soft';
		case PaymentMethod.Boleto:
			return 'text-warning hover:border-warning-soft-hover hover:bg-warning-soft';
		case PaymentMethod.CreditCard:
			return 'text-accent hover:border-accent-soft-hover hover:bg-accent-soft';
		default:
			return 'text-foreground hover:border-divider hover:bg-content2';
	}
}

function PaymentLinkDomainSortableItem({
	method,
	option,
	isPendingRemoval,
	onSetDefaultDomain,
	onEditDomain,
	onRequestDomainRemoval,
	onConfirmDomainRemoval,
	onCancelDomainRemoval,
}: {
	method: PaymentMethod;
	option: PaymentLinkDomainOption;
	isPendingRemoval: boolean;
	onSetDefaultDomain: (method: PaymentMethod, optionId: string) => void;
	onEditDomain: (method: PaymentMethod, option: PaymentLinkDomainOption) => void;
	onRequestDomainRemoval: (method: PaymentMethod, optionId: string) => void;
	onConfirmDomainRemoval: (method: PaymentMethod, optionId: string) => void;
	onCancelDomainRemoval: () => void;
}) {
	return (
		<ListBox.Item
			key={option.id}
			id={option.id}
			textValue={`${option.name} ${option.baseUrl}`}
			className='bg-transparent data-[hovered=true]:bg-transparent data-[selected=true]:bg-transparent data-[pressed=true]:bg-transparent data-[focused=true]:bg-transparent data-[pressed=true]:scale-100 data-[pressed=true]:transform-none data-[pressed=true]:opacity-100'
		>
			<div className='grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-divider bg-content1 p-3'>

				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-2'>
						<p className='truncate text-sm font-semibold text-foreground'>{option.name}</p>
						{option.isDefault ? (
							<Chip variant='soft' size='sm' color='success'>
								Padrão
							</Chip>
						) : null}
						<Chip variant='soft' size='sm' color={option.showSwiftPayBranding ? 'accent' : 'default'}>
							{option.showSwiftPayBranding ? 'Com branding' : 'Sem branding'}
						</Chip>
					</div>
					<p className='truncate text-xs text-muted'>{option.baseUrl}</p>
				</div>

				<div className='flex items-center gap-1' onPointerDown={(event) => event.stopPropagation()}>
					{!option.isDefault ? (
						<Tooltip>
							<Button isIconOnly variant='tertiary' size='sm' onPress={() => onSetDefaultDomain(method, option.id)}>
								<Icon icon={CheckmarkCircle02Icon} className='icon-sm' />
								<Tooltip.Content arrowBoundaryOffset={12}>Definir padrão</Tooltip.Content>
							</Button>
						</Tooltip>
					) : null}
					<Tooltip>
						<Button isIconOnly variant='tertiary' size='sm' onPress={() => onEditDomain(method, option)}>
							<Icon icon={PencilEdit01Icon} className='icon-sm' />
							<Tooltip.Content arrowBoundaryOffset={12}>Editar</Tooltip.Content>
						</Button>
					</Tooltip>
					{isPendingRemoval ? (
						<>
							<Button variant='danger' size='sm' onPress={() => onConfirmDomainRemoval(method, option.id)}>
								Confirmar
							</Button>
							<Button variant='tertiary' size='sm' onPress={onCancelDomainRemoval}>
								Cancelar
							</Button>
						</>
					) : (
						<Tooltip>
							<Button
								isIconOnly
								variant='tertiary'
								size='sm'
								className='text-danger'
								onPress={() => onRequestDomainRemoval(method, option.id)}
							>
								<Icon icon={Delete02Icon} className='icon-sm' />
								<Tooltip.Content arrowBoundaryOffset={12}>Remover</Tooltip.Content>
							</Button>
						</Tooltip>
					)}
				</div>
			</div>
		</ListBox.Item>
	);
}

export function PaymentLinkDomainMethodAccordion({
	method,
	paymentLinkDomainOptions,
	pendingRemovalKey,
	onAddDomain,
	onEditDomain,
	onSetDefaultDomain,
	onRequestDomainRemoval,
	onConfirmDomainRemoval,
	onCancelDomainRemoval,
}: PaymentLinkDomainMethodAccordionProps) {
	const methodOptions = paymentLinkDomainOptions.find((group) => group.method === method)?.options ?? [];

	return (
		<div className="rounded-lg border p-4 border-divider bg-content1">
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center gap-2'>
					<Chip
						variant='primary'
						color={mapParseColorToChipColor(paymentMethodColor(method))}
					>
						{paymentMethodLabel(method)}
					</Chip>
					<span className='text-xs text-muted'>
						{methodOptions.length} domínio(s) configurado(s)
					</span>
				</div>
				<Button
					variant='tertiary'
					size='sm'
					onPress={() => onAddDomain(method)}
					className={`border ${methodActionClasses(method)}`}
				>
					<Icon icon={AddCircleHalfDotIcon} className='icon-sm' />
					Adicionar domínio
				</Button>
			</div>

			<div className='mt-3'>
				{methodOptions.length === 0 ? (
					<div className='rounded-lg border border-dashed border-divider bg-content1 p-3 text-xs text-muted'>
						Nenhum domínio configurado para {paymentMethodLabel(method)}.
					</div>
				) : (
					<div className='flex max-h-110 flex-col gap-2 overflow-y-auto pr-1'>
						<InternalListBox
							ariaLabel={`Domínios de ${paymentMethodLabel(method)}`}
						>
							{methodOptions.map((option) => {
								const editorKey = buildDomainEditorKey(method, option.id);
								const isPendingRemoval = pendingRemovalKey === editorKey;

								return (
									<PaymentLinkDomainSortableItem
										key={editorKey}
										method={method}
										option={option}
										isPendingRemoval={isPendingRemoval}
										onSetDefaultDomain={onSetDefaultDomain}
										onEditDomain={onEditDomain}
										onRequestDomainRemoval={onRequestDomainRemoval}
										onConfirmDomainRemoval={onConfirmDomainRemoval}
										onCancelDomainRemoval={onCancelDomainRemoval}
									/>
								);
							})}
						</InternalListBox>
					</div>
				)}
			</div>
		</div>
	);
}