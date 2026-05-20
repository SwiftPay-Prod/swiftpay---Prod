'use client';

import { useState } from 'react';
import { Button, Modal, Chip, Alert } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	Alert01Icon,
	CheckmarkCircle02Icon,
	Copy01Icon,
	Key01Icon,
	SecurityLockIcon,
	ViewIcon,
	ViewOffIcon,
} from '@hugeicons/core-free-icons';
import type { ApiCredentialData, ApiCredentialListData, RegenerateApiCredentialData } from '@/types/merchant/api-credentials';
import { merchantApiCredentialEnvironmentParse, merchantApiCredentialStatusParse, mapParseColorToChipColor } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { toast } from '@heroui/react';

type CredentialType = ApiCredentialData | ApiCredentialListData | RegenerateApiCredentialData;

interface ViewCredentialModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	credential: CredentialType | null;
	isNew?: boolean;
	isRegenerated?: boolean;
}

function hasClientSecret(credential: CredentialType): credential is ApiCredentialData | RegenerateApiCredentialData {
	return 'clientSecret' in credential && !!credential.clientSecret;
}

export function ViewCredentialModal({ isOpen, onOpenChange, credential, isNew, isRegenerated }: ViewCredentialModalProps) {
	const [showSecret, setShowSecret] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	if (!credential) return null;

	const environmentParsed = merchantApiCredentialEnvironmentParse[credential.environment];
	const showStatus = 'status' in credential;
	const statusParsed = showStatus ? merchantApiCredentialStatusParse[credential.status] : null;
	const hasSecret = hasClientSecret(credential);

	const handleCopy = (field: string, value: string) => {
		void navigator.clipboard.writeText(value).catch(() => undefined);
		setCopiedField(field);
		toast('Copiado!', {
			description: `${field} copiado para a área de transferência.`,
			variant: 'success',
			indicator: <Icon icon={Copy01Icon} className="icon-sm" />,
		});
		setTimeout(() => setCopiedField(null), 2000);
	};

	const handleClose = () => {
		setShowSecret(false);
		setCopiedField(null);
		onOpenChange(false);
	};

	const title = isNew ? 'Credencial Criada!' : isRegenerated ? 'Credencial Regenerada!' : 'Detalhes da Credencial';
	const titleIcon = isNew || isRegenerated
		? <Icon icon={CheckmarkCircle02Icon} className="icon-md" />
		: <Icon icon={Key01Icon} className="icon-md" />;
	const iconClass = isNew || isRegenerated ? 'bg-success text-success-foreground' : 'bg-accent text-accent-foreground';

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className={iconClass}>{titleIcon}</Modal.Icon>
						<Modal.Heading>{title}</Modal.Heading>
						{(isNew || isRegenerated) && (
							<p className="text-sm text-muted">
								{isNew
									? 'Sua nova credencial foi criada com sucesso.'
									: 'O Secret Key foi regenerado com sucesso.'}
							</p>
						)}
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							{hasSecret && (
								<Alert color="warning" className="gap-2">
									<Icon icon={SecurityLockIcon} className="icon-md shrink-0" />
									<div>
										<p className="font-medium">Atenção!</p>
										<p className="text-sm">
											O Secret Key será exibido apenas uma vez. Copie e guarde-o em local seguro.
										</p>
									</div>
								</Alert>
							)}

							<div className="flex flex-col gap-1">
								<span className="text-sm text-muted">Nome</span>
								<span className="font-medium text-foreground">{credential.name || 'Sem nome'}</span>
							</div>

							<div className="flex items-center gap-4">
								<div className="flex flex-col gap-1">
									<span className="text-sm text-muted">Ambiente</span>
									<Chip variant="soft" color={mapParseColorToChipColor(environmentParsed.color)} size="sm" className="gap-1 w-fit">
										{environmentParsed.icon}
										{environmentParsed.label}
									</Chip>
								</div>
								{showStatus && statusParsed && (
									<div className="flex flex-col gap-1">
										<span className="text-sm text-muted">Status</span>
										<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1 w-fit">
											{statusParsed.icon}
											{statusParsed.label}
										</Chip>
									</div>
								)}
							</div>

							<div className="flex flex-col gap-1">
								<span className="text-sm text-muted">Public Key</span>
								<div className="flex items-center gap-2">
									<code className="flex-1 rounded bg-default/20 px-3 py-2 font-mono text-sm text-foreground break-all">
										{credential.clientId}
									</code>
									<Button
										isIconOnly
										size="sm"
										variant="secondary"
										onPress={() => handleCopy('Public Key', credential.clientId)}
									>
										{copiedField === 'Public Key' ? (
											<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
										) : (
											<Icon icon={Copy01Icon} className="icon-sm" />
										)}
									</Button>
								</div>
							</div>

							{hasSecret && (
								<div className="flex flex-col gap-1">
									<span className="text-sm text-muted">Secret Key</span>
									<div className="flex items-center gap-2">
										<code className={`flex-1 rounded bg-default/20 px-3 py-2 font-mono text-sm text-foreground break-all ${showSecret ? '' : 'visual-blur'}`}>
											{credential.clientSecret}
										</code>
										<Button isIconOnly size="sm" variant="tertiary" onPress={() => setShowSecret(!showSecret)}>
											{showSecret ? (
												<Icon icon={ViewOffIcon} className="icon-sm" />
											) : (
												<Icon icon={ViewIcon} className="icon-sm" />
											)}
										</Button>
										<Button
											isIconOnly
											size="sm"
											variant="tertiary"
											onPress={() => handleCopy('Secret Key', credential.clientSecret)}
										>
											{copiedField === 'Secret Key' ? (
												<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
											) : (
												<Icon icon={Copy01Icon} className="icon-sm" />
											)}
										</Button>
									</div>
								</div>
							)}

							{!hasSecret && (
								<div className="flex flex-col gap-1">
									<span className="text-sm text-muted">Secret Key</span>
									<div className="flex items-center gap-2 rounded bg-danger/10 px-3 py-2">
										<Icon icon={Alert01Icon} className="icon-sm text-danger" />
										<span className="text-sm text-danger">
											O Secret Key não está mais disponível. Regenere a credencial se necessário.
										</span>
									</div>
								</div>
							)}

							<div className="flex flex-col gap-1">
								<span className="text-sm text-muted">IPs Permitidos</span>
								{credential.allowedIpRange ? (
									<code className="rounded bg-default/20 px-3 py-2 font-mono text-sm text-foreground w-fit">
										{credential.allowedIpRange}
									</code>
								) : (
									<span className="text-foreground">Todos os IPs</span>
								)}
							</div>

							<div className="flex items-center gap-4">
								<div className="flex flex-col gap-1">
									<span className="text-sm text-muted">Criado em</span>
									<span className="text-foreground">{formatDate(credential.createdAt)}</span>
								</div>
								{'updatedAt' in credential && credential.updatedAt && (
									<div className="flex flex-col gap-1">
										<span className="text-sm text-muted">Atualizado em</span>
										<span className="text-foreground">{formatDate(credential.updatedAt)}</span>
									</div>
								)}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="primary" onPress={handleClose}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

