'use client';

import { useState } from 'react';
import { Button, Modal, Chip } from '@heroui/react';
import { Copy01Icon, InformationCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { MerchantEmailTemplateType } from '@/types/enums';

interface VariablesReferenceModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	templateType: MerchantEmailTemplateType;
}

interface VariableInfo {
	name: string;
	description: string;
	source: string;
	example: string;
	category: 'customer' | 'order' | 'merchant' | 'tracking' | 'digital' | 'cart';
}

const categoryLabels: Record<VariableInfo['category'], string> = {
	customer: 'Cliente',
	order: 'Pedido',
	merchant: 'Loja',
	tracking: 'Rastreio',
	digital: 'Itens Digitais',
	cart: 'Carrinho',
};

const categoryColors: Record<VariableInfo['category'], 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
	customer: 'accent',
	order: 'success',
	merchant: 'default',
	tracking: 'warning',
	digital: 'accent',
	cart: 'warning',
};

const commonVariables: VariableInfo[] = [
	{ name: 'customer_name', description: 'Nome completo do cliente', source: 'Informado pelo cliente ao criar o pedido/transação', example: 'João Silva', category: 'customer' },
	{ name: 'customer_email', description: 'Email do cliente', source: 'Informado pelo cliente ao criar o pedido/transação', example: 'joao@email.com', category: 'customer' },
	{ name: 'merchant_name', description: 'Nome da loja', source: 'Configurações da organização (Dados Cadastrais)', example: 'Minha Loja', category: 'merchant' },
	{ name: 'merchant_logo', description: 'URL do logo da loja', source: 'Configurações da organização (Dados Cadastrais)', example: 'https://...', category: 'merchant' },
	{ name: 'store_url', description: 'URL da loja', source: 'Configurações da organização (Dados Cadastrais)', example: 'https://minhaloja.com', category: 'merchant' },
	{ name: 'support_email', description: 'Email de suporte', source: 'Configurações da organização (Contato)', example: 'suporte@loja.com', category: 'merchant' },
	{ name: 'support_phone', description: 'Telefone de suporte', source: 'Configurações da organização (Contato)', example: '(11) 99999-9999', category: 'merchant' },
	{ name: 'order_number', description: 'Número do pedido', source: 'Gerado automaticamente ao criar o pedido', example: '#12345', category: 'order' },
	{ name: 'order_date', description: 'Data do pedido', source: 'Data de criação do pedido', example: '25/01/2026 14:30', category: 'order' },
	{ name: 'order_total', description: 'Total do pedido', source: 'Calculado automaticamente (subtotal + frete - desconto)', example: 'R$ 199,90', category: 'order' },
	{ name: 'order_subtotal', description: 'Subtotal do pedido', source: 'Soma dos valores dos itens do pedido', example: 'R$ 179,90', category: 'order' },
	{ name: 'order_shipping', description: 'Valor do frete', source: 'Calculado pelo frete selecionado ou informado manualmente', example: 'R$ 25,00', category: 'order' },
	{ name: 'order_discount', description: 'Desconto aplicado', source: 'Cupom de desconto aplicado no checkout', example: 'R$ 5,00', category: 'order' },
	{ name: 'payment_method', description: 'Método de pagamento', source: 'Método escolhido pelo cliente (PIX, Cartão, etc)', example: 'PIX', category: 'order' },
];

const trackingVariables: VariableInfo[] = [
	{ name: 'carrier_name', description: 'Nome da transportadora', source: 'Informado ao marcar o pedido como enviado', example: 'Correios - SEDEX', category: 'tracking' },
	{ name: 'tracking_code', description: 'Código de rastreio', source: 'Informado ao marcar o pedido como enviado', example: 'BR123456789BR', category: 'tracking' },
	{ name: 'tracking_url', description: 'URL de rastreamento', source: 'Link gerado automaticamente ou informado manualmente', example: 'https://...', category: 'tracking' },
	{ name: 'estimated_delivery', description: 'Previsão de entrega', source: 'Informado ao marcar o pedido como enviado', example: '25/01/2026', category: 'tracking' },
];

const deliveryVariables: VariableInfo[] = [
	{ name: 'delivery_date', description: 'Data de entrega', source: 'Data em que o pedido foi marcado como entregue', example: '25/01/2026', category: 'order' },
];

const digitalVariables: VariableInfo[] = [];

const cartVariables: VariableInfo[] = [
	{ name: 'cart_total', description: 'Total do carrinho', source: 'Soma dos itens abandonados no checkout', example: 'R$ 299,90', category: 'cart' },
	{ name: 'cart_items_count', description: 'Quantidade de itens', source: 'Número de itens no carrinho abandonado', example: '3', category: 'cart' },
	{ name: 'checkout_url', description: 'URL para finalizar compra', source: 'Link para retomar o checkout abandonado', example: 'https://...', category: 'cart' },
];

const welcomeVariables: VariableInfo[] = [
	{ name: 'registration_date', description: 'Data de cadastro', source: 'Data do primeiro pedido do cliente na loja', example: '25/01/2026', category: 'customer' },
];

function getVariablesForType(templateType: MerchantEmailTemplateType): VariableInfo[] {
	switch (templateType) {
		case MerchantEmailTemplateType.PaymentConfirmation:
			return commonVariables;
		case MerchantEmailTemplateType.DigitalDelivery:
			return [...commonVariables, ...digitalVariables];
		case MerchantEmailTemplateType.OrderShipped:
			return [...commonVariables, ...trackingVariables];
		case MerchantEmailTemplateType.OrderDelivered:
			return [...commonVariables, ...deliveryVariables];
		case MerchantEmailTemplateType.Welcome:
			return [...commonVariables.filter(v => v.category !== 'order'), ...welcomeVariables];
		case MerchantEmailTemplateType.AbandonedCart:
			return [...commonVariables.filter(v => !['product_list', 'order_number', 'order_date', 'order_total', 'order_subtotal', 'order_shipping', 'order_discount', 'payment_method'].includes(v.name)), ...cartVariables];
		default:
			return commonVariables;
	}
}

export function VariablesReferenceModal({ isOpen, onOpenChange, templateType }: VariablesReferenceModalProps) {
	const [copiedVar, setCopiedVar] = useState<string | null>(null);
	const variables = getVariablesForType(templateType);

	const groupedVariables = variables.reduce(
		(acc, variable) => {
			if (!acc[variable.category]) {
				acc[variable.category] = [];
			}
			acc[variable.category].push(variable);
			return acc;
		},
		{} as Record<VariableInfo['category'], VariableInfo[]>
	);

	function handleCopy(variableName: string) {
		void navigator.clipboard.writeText(`[[${variableName}]]`).catch(() => undefined);
		setCopiedVar(variableName);
		setTimeout(() => setCopiedVar(null), 2000);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={InformationCircleIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Variáveis Disponíveis</Modal.Heading>
						<p className="text-sm text-muted">Use estas variáveis no conteúdo dos blocos para personalizar o email</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-6">
							{Object.entries(groupedVariables).map(([category, vars]) => (
								<div key={category}>
									<div className="mb-3 flex items-center gap-2">
										<Chip variant="soft" color={categoryColors[category as VariableInfo['category']]}>
											{categoryLabels[category as VariableInfo['category']]}
										</Chip>
									</div>
									<div className="flex flex-col gap-2">
										{vars.map((variable) => (
											<div
												key={variable.name}
												className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/5 p-3"
											>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<code className="rounded bg-muted/20 px-2 py-0.5 font-mono text-sm text-foreground">
															[[{variable.name}]]
														</code>
													</div>
													<p className="mt-1 text-sm text-muted">{variable.description}</p>
													<p className="mt-0.5 text-xs text-foreground/60">
														<span className="font-medium">Origem:</span> {variable.source}
													</p>
													<p className="mt-0.5 text-xs text-muted/70">Ex: {variable.example}</p>
												</div>
												<Button
													isIconOnly
													size="sm"
													variant="tertiary"
													onPress={() => handleCopy(variable.name)}
													className={copiedVar === variable.name ? 'text-success' : ''}
												>
													<Icon
														icon={copiedVar === variable.name ? CheckmarkCircle02Icon : Copy01Icon}
														className="icon-sm"
													/>
												</Button>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onPress={() => onOpenChange(false)}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
