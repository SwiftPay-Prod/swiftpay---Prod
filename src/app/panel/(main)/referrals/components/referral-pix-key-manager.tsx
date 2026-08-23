'use client';

import { useState } from 'react';
import { Button, Chip, Modal } from '@heroui/react';
import { Wallet01Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { UpdateReferralPixKeyForm } from '../forms/update-referral-pix-key-form';
import { mapParseColorToChipColor, pixKeyTypeParse } from '@/parse';
import type { PixKeyType } from '@/types/enums';

interface ReferralPixKeyManagerProps {
	initialPixKeyType: PixKeyType | null;
	initialPixKey: string | null;
	onPixKeyUpdated?: (data: { pixKeyType: PixKeyType; pixKey: string }) => void;
}

export function ReferralPixKeyManager({
	initialPixKeyType,
	initialPixKey,
	onPixKeyUpdated,
}: ReferralPixKeyManagerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [pixKeyType, setPixKeyType] = useState<PixKeyType | null>(initialPixKeyType);
	const [pixKey, setPixKey] = useState<string | null>(initialPixKey);
	const hasPixKey = !!pixKeyType && !!pixKey?.trim();

	const pixKeyTypeLabel = pixKeyType ? pixKeyTypeParse[pixKeyType].label : 'Não definido';
	const pixTypeColor = pixKeyType ? mapParseColorToChipColor(pixKeyTypeParse[pixKeyType].color) : 'default';

	function handleOpen() {
		setIsEditing(!hasPixKey);
		setIsOpen(true);
	}

	return (
		<>
			<Button variant="secondary" onPress={handleOpen}>
				<Icon icon={PencilEdit01Icon} className="icon-sm" />
				Conta de recebimento
			</Button>

			<Modal.Backdrop
				isOpen={isOpen}
				onOpenChange={(nextOpen) => {
					setIsOpen(nextOpen);
					if (!nextOpen) {
						setIsEditing(false);
					}
				}}
			>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-2xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={Wallet01Icon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Conta PIX para comissão</Modal.Heading>
							<p className="text-sm text-muted">
								{hasPixKey && !isEditing
									? 'Confira a conta PIX cadastrada e edite quando precisar.'
									: 'Cadastre a chave PIX e confirme com o código enviado para seu e-mail.'}
							</p>
						</Modal.Header>
						<Modal.Body>
							{!isEditing && hasPixKey && (
								<div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
									<div className="flex flex-col gap-2">
										<span className="text-xs text-muted">Tipo da chave PIX</span>
										<div>
											<Chip variant="soft" color={pixTypeColor} size="sm">
												{pixKeyTypeLabel}
											</Chip>
										</div>
									</div>

									<div className="flex flex-col gap-2">
										<span className="text-xs text-muted">Chave PIX para recebimento</span>
										<span className="font-mono text-sm text-foreground break-all">{pixKey}</span>
									</div>

									<div>
										<Button variant="primary" onPress={() => setIsEditing(true)}>
											<Icon icon={PencilEdit01Icon} className="icon-sm" />
											Editar conta PIX
										</Button>
									</div>
								</div>
							)}

							{!isEditing && !hasPixKey && (
								<div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
									<p className="text-sm text-muted">
										Você ainda não possui uma conta PIX cadastrada para receber comissão.
									</p>
									<div>
										<Button variant="primary" onPress={() => setIsEditing(true)}>
											<Icon icon={Wallet01Icon} className="icon-sm" />
											Cadastrar conta PIX
										</Button>
									</div>
								</div>
							)}

							{isEditing && (
								<div className="flex flex-col gap-3">
									{hasPixKey && (
										<div>
											<Button variant="tertiary" onPress={() => setIsEditing(false)}>
												Voltar para conta atual
											</Button>
										</div>
									)}

									<UpdateReferralPixKeyForm
										initialPixKeyType={pixKeyType}
										initialPixKey={null}
										submitLabel="Confirmar código e salvar"
										onSuccess={(data) => {
											setPixKeyType(data.pixKeyType);
											setPixKey(data.pixKey);
											onPixKeyUpdated?.({
												pixKeyType: data.pixKeyType,
												pixKey: data.pixKey,
											});
											setIsEditing(false);
										}}
									/>
								</div>
							)}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</>
	);
}
