'use client';

import { Button, FieldError, Input, Label, Modal, Switch, TextField } from '@heroui/react';
import { LinkSquare02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { PaymentLinkDomainOption } from '@/types/admin/platform-settings';
import { paymentMethodLabel } from '../platform-settings-form.helpers';
import type { DomainModalState } from '../platform-settings-form.types';

interface PaymentLinkDomainModalProps {
	state: DomainModalState;
	error: string | null;
	onClose: () => void;
	onSave: () => void;
	onDraftChange: <K extends keyof PaymentLinkDomainOption>(
		field: K,
		value: PaymentLinkDomainOption[K]
	) => void;
}

export function PaymentLinkDomainModal({
	state,
	error,
	onClose,
	onSave,
	onDraftChange,
}: PaymentLinkDomainModalProps) {
	return (
		<Modal.Backdrop isOpen={state.isOpen} onOpenChange={onClose}>
			<Modal.Container size='lg' placement='center' scroll='outside'>
				<Modal.Dialog className='max-w-lg'>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className='bg-accent-soft text-accent'>
							<Icon icon={LinkSquare02Icon} className='icon-md' />
						</Modal.Icon>
						<Modal.Heading>
							{state.optionId ? 'Editar domínio' : 'Adicionar domínio'}
						</Modal.Heading>
						<p className='text-sm text-muted'>
							{state.method ? paymentMethodLabel(state.method) : 'Método'}
						</p>
					</Modal.Header>
					<Modal.Body>
						<div className='grid grid-cols-1 gap-4'>
							<TextField isRequired>
								<Label>Nome</Label>
								<Input
									value={state.draft?.name ?? ''}
									onChange={(event) => onDraftChange('name', event.target.value)}
									placeholder='Domínio padrão PIX'
								/>
							</TextField>
							<TextField isRequired>
								<Label>URL base</Label>
								<Input
									value={state.draft?.baseUrl ?? ''}
									onChange={(event) => onDraftChange('baseUrl', event.target.value)}
									placeholder='https://pay.exemplo.com'
								/>
							</TextField>
							<Switch
								isSelected={state.draft?.showSafefyBranding ?? false}
								onChange={(selected) => onDraftChange('showSafefyBranding', selected)}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								Exibir branding Safefy
							</Switch>
							{error ? <FieldError>{error}</FieldError> : null}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button type='button' variant='tertiary' onPress={onClose}>
							Cancelar
						</Button>
						<Button type='button' variant='primary' onPress={onSave}>
							Salvar domínio
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
