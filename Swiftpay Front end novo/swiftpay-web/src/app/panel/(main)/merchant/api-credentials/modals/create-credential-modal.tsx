'use client';

import { useState } from 'react';
import { Button, Modal, Input, Label, Select, ListBox, Chip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { AddSquareIcon, Key01Icon } from '@hugeicons/core-free-icons';
import { MerchantApiCredentialEnvironment } from '@/types/enums';
import { merchantApiCredentialEnvironmentParse, mapParseColorToChipColor, apiEnvironmentTypeOptions } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';

interface CreateCredentialModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onCreate: (data: { name?: string; environment: MerchantApiCredentialEnvironment; allowedIpRange?: string }) => Promise<void>;
	isPending: boolean;
}

export function CreateCredentialModal({ isOpen, onOpenChange, onCreate, isPending }: CreateCredentialModalProps) {
	const [name, setName] = useState('');
	const [environment, setEnvironment] = useState<MerchantApiCredentialEnvironment>(MerchantApiCredentialEnvironment.Sandbox);
	const [allowedIpRange, setAllowedIpRange] = useState('');

	const handleSubmit = async () => {
		await onCreate({
			name: name.trim() || undefined,
			environment,
			allowedIpRange: allowedIpRange.trim() || undefined,
		});
		resetForm();
	};

	const handleClose = () => {
		if (!isPending) {
			resetForm();
			onOpenChange(false);
		}
	};

	const resetForm = () => {
		setName('');
		setEnvironment(MerchantApiCredentialEnvironment.Sandbox);
		setAllowedIpRange('');
	};

	const selectedEnvironmentParse = merchantApiCredentialEnvironmentParse[environment];

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Key01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Nova Credencial de API</Modal.Heading>
						<p className="text-sm text-muted">
							Crie uma nova credencial para integrar com nossa API de pagamentos.
						</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="name">Nome (opcional)</Label>
								<Input variant="secondary"
									id="name"
									placeholder="Ex: Integração Loja Online"
									value={name}
									onChange={(e) => setName(e.target.value)}
									disabled={isPending}
								/>
								<span className="text-xs text-muted">
									Um nome para identificar onde esta credencial está sendo usada.
								</span>
							</div>

							<div className="flex flex-col gap-2">
								<Select
									variant="secondary"
									className="w-full"
									placeholder="Selecione o ambiente"
									value={environment}
									onChange={(key) => setEnvironment(key as MerchantApiCredentialEnvironment)}
									isDisabled={isPending}
								>
									<Label>Ambiente</Label>
									<Select.Trigger>
										<Select.Value>
											<div className="flex items-center gap-2">
												<Chip variant="soft"
													color={mapParseColorToChipColor(selectedEnvironmentParse.color)}
													size="sm"
													className="gap-1"
												>
													{selectedEnvironmentParse.icon}
													{selectedEnvironmentParse.label}
												</Chip>
											</div>
										</Select.Value>
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{apiEnvironmentTypeOptions.map((option) => (
												<ListBox.Item key={option.value} id={option.value} textValue={option.label}>
													<Chip variant="soft" color={mapParseColorToChipColor(option.color)} size="sm" className="gap-1">
														{option.icon}
														{option.label}
													</Chip>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
								<span className="text-xs text-muted">
									{environment === MerchantApiCredentialEnvironment.Sandbox
										? 'Use Sandbox para testes. Os pagamentos não serão processados.'
										: 'Use Produção apenas quando estiver pronto para processar pagamentos reais.'}
								</span>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="allowedIpRange">IPs Permitidos (opcional)</Label>
								<Input variant="secondary"
									id="allowedIpRange"
									placeholder="Ex: 192.168.1.0/24"
									value={allowedIpRange}
									onChange={(e) => setAllowedIpRange(e.target.value)}
									disabled={isPending}
								/>
								<span className="text-xs text-muted">
									Restrinja o uso desta credencial a IPs específicos. Deixe em branco para permitir qualquer IP.
								</span>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
							Cancelar
						</Button>
						<AsyncButton variant="primary" onPress={handleSubmit} isPending={isPending}>
							<Icon icon={AddSquareIcon} className="icon-sm" />
							Criar Credencial
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

