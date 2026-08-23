'use client';

import { Button, Modal } from '@heroui/react';
import { IntegrationPlatformInfo } from './components/integration-platform-info';

interface IntegrationDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	name: string;
	subtitle: string;
	isActive: boolean;
	description: string;
	capabilities: string[];
	examples: string[];
	websiteUrl: string | null;
	imageUrl: string | null;
}

export function IntegrationDetailsModal({
	isOpen,
	onOpenChange,
	name,
	subtitle,
	isActive,
	description,
	capabilities,
	examples,
	websiteUrl,
	imageUrl,
}: IntegrationDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>Detalhes da integração</Modal.Heading>
						<IntegrationPlatformInfo
							name={name}
							subtitle={subtitle}
							imageUrl={imageUrl}
							isActive={isActive}
							websiteUrl={websiteUrl}
						/>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4 text-sm text-muted">
							<p>{description}</p>

							<div className="flex flex-col gap-2 rounded-lg border border-border p-3">
								<span className="text-sm font-medium text-foreground">O que você pode fazer</span>
								<ul className="list-disc pl-5">
									{capabilities.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>

							<div className="flex flex-col gap-2 rounded-lg border border-border p-3">
								<span className="text-sm font-medium text-foreground">Exemplos de uso</span>
								<ul className="list-disc pl-5">
									{examples.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
