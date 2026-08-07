'use client';

import { useEffect, useState, useTransition } from 'react';
import { Input, Label, TextField, TextArea, toast } from '@heroui/react';
import { updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { Icon } from '@/components/ui/icon';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { TextIcon, Heading01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import type { CheckoutData } from '@/types/merchant/checkouts';

interface MessagesTabProps {
	checkout: CheckoutData;
	merchantId: string;
	onRefresh: () => void;
	onDraftChange?: (draft: {
		pageTitle: string;
		headerMessage: string;
		subHeaderMessage: string;
		footerMessage: string;
		successMessage: string;
		hasPendingChanges: boolean;
	}) => void;
}

interface FormData {
	pageTitle: string;
	headerMessage: string;
	subHeaderMessage: string;
	footerMessage: string;
	successMessage: string;
}

function _validateMessages(data: FormData): string[] {
	const errors: string[] = [];
	if (data.pageTitle.length > 120) errors.push('Titulo da pagina deve ter no maximo 120 caracteres.');
	if (data.headerMessage.length > 120) errors.push('Mensagem de cabecalho deve ter no maximo 120 caracteres.');
	if (data.subHeaderMessage.length > 160) errors.push('Subtitulo deve ter no maximo 160 caracteres.');
	if (data.footerMessage.length > 300) errors.push('Mensagem de rodape deve ter no maximo 300 caracteres.');
	if (data.successMessage.length > 300) errors.push('Mensagem de sucesso deve ter no maximo 300 caracteres.');
	return [...new Set(errors)];
}

export function MessagesTab({ checkout, merchantId, onRefresh, onDraftChange }: MessagesTabProps) {
	const config = checkout.config;

	const getInitialFormData = (): FormData => ({
		pageTitle: config?.pageTitle ?? '',
		headerMessage: config?.headerMessage ?? '',
		subHeaderMessage: config?.subHeaderMessage ?? '',
		footerMessage: config?.footerMessage ?? '',
		successMessage: config?.successMessage ?? '',
	});

	const [formData, setFormData] = useState<FormData>(getInitialFormData);
	const [isSaving, startTransition] = useTransition();

	function handleSave() {
		startTransition(async () => {
			try {
				const response = await updateMerchantCheckout(merchantId, checkout.id, {
					pageTitle: formData.pageTitle,
					headerMessage: formData.headerMessage,
					subHeaderMessage: formData.subHeaderMessage,
					footerMessage: formData.footerMessage,
					successMessage: formData.successMessage,
				});

				if (response?.error) {
					toast.danger(response.error.message ?? 'Erro ao salvar mensagens.');
					return;
				}

				toast.success('Mensagens salvas!');
				onRefresh();
			} catch {
				toast.danger('Erro ao salvar mensagens.');
			}
		});
	}

	const hasChanges =
		formData.pageTitle !== (config?.pageTitle ?? '') ||
		formData.headerMessage !== (config?.headerMessage ?? '') ||
		formData.subHeaderMessage !== (config?.subHeaderMessage ?? '') ||
		formData.footerMessage !== (config?.footerMessage ?? '') ||
		formData.successMessage !== (config?.successMessage ?? '');

	useEffect(() => {
		onDraftChange?.({
			pageTitle: formData.pageTitle,
			headerMessage: formData.headerMessage,
			subHeaderMessage: formData.subHeaderMessage,
			footerMessage: formData.footerMessage,
			successMessage: formData.successMessage,
			hasPendingChanges: hasChanges,
		});
	}, [
		formData.pageTitle,
		formData.headerMessage,
		formData.subHeaderMessage,
		formData.footerMessage,
		formData.successMessage,
		hasChanges,
		onDraftChange,
	]);

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={handleSave} isSaving={isSaving}>
			<SectionAccordion
				id="messages"
				icon={TextIcon}
				title="Mensagens Personalizadas"
				summary={
					formData.headerMessage.trim()
						? `Cabeçalho: ${formData.headerMessage}`
						: 'Defina textos do checkout e da confirmação'
				}
				bodyClassName="p-4"
			>
				<div className="space-y-4">
					<TextField
						variant="secondary"
						value={formData.pageTitle}
						onChange={(value) => setFormData((prev) => ({ ...prev, pageTitle: value }))}
					>
						<div className="flex items-center gap-2">
							<Icon icon={Heading01Icon} className="icon-sm" />
							<Label>Título da Página</Label>
						</div>
						<Input variant="secondary" placeholder="Checkout - Sua Loja" />
						<span className="text-xs text-muted">Aparece na aba do navegador</span>
					</TextField>

					<TextField
						variant="secondary"
						value={formData.headerMessage}
						onChange={(value) => setFormData((prev) => ({ ...prev, headerMessage: value }))}
					>
						<div className="flex items-center gap-2">
							<Icon icon={Heading01Icon} className="icon-sm" />
							<Label>Mensagem de Cabeçalho</Label>
						</div>
						<Input variant="secondary" placeholder="CHECKOUT SEGURO" />
						<span className="text-xs text-muted">Título principal exibido no topo (ex: CHECKOUT SEGURO)</span>
					</TextField>

					<TextField
						variant="secondary"
						value={formData.subHeaderMessage}
						onChange={(value) => setFormData((prev) => ({ ...prev, subHeaderMessage: value }))}
					>
						<div className="flex items-center gap-2">
							<Icon icon={TextIcon} className="icon-sm" />
							<Label>Subtítulo do Cabeçalho</Label>
						</div>
						<Input variant="secondary" placeholder="Compra 100% protegida" />
						<span className="text-xs text-muted">Texto secundário abaixo do título (ex: Compra 100% protegida)</span>
					</TextField>

					<TextField
						variant="secondary"
						value={formData.footerMessage}
						onChange={(value) => setFormData((prev) => ({ ...prev, footerMessage: value }))}
					>
						<div className="flex items-center gap-2">
							<Icon icon={TextIcon} className="icon-sm" />
							<Label>Mensagem de Rodapé</Label>
						</div>
						<TextArea variant="secondary" placeholder="Dúvidas? Entre em contato conosco." rows={2} />
						<span className="text-xs text-muted">Exibida no rodapé da página de checkout</span>
					</TextField>

					<TextField
						variant="secondary"
						value={formData.successMessage}
						onChange={(value) => setFormData((prev) => ({ ...prev, successMessage: value }))}
					>
						<div className="flex items-center gap-2">
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
							<Label>Mensagem de Sucesso</Label>
						</div>
						<TextArea variant="secondary" placeholder="Obrigado pela sua compra! Seu pedido foi confirmado." rows={2} />
						<span className="text-xs text-muted">Exibida após pagamento confirmado</span>
					</TextField>
				</div>
			</SectionAccordion>
		</CheckoutTabSaveLayout>
	);
}
