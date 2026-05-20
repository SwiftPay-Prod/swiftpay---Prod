'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Alert, Button, Chip, Dropdown, Input, Label, Modal, Spinner, TextField } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	Tick01Icon,
	ShoppingCart01Icon,
	Copy01Icon,
	Link01Icon,
	Share08Icon,
	Delete02Icon,
	MoreHorizontalCircle01Icon,
	ArrowUpRight01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	ViewIcon,
	Cancel01Icon,
	PencilEdit01Icon,
	Tick02Icon,
} from '@hugeicons/core-free-icons';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { AsyncButton } from '@/components/ui/async-button';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { ReviewIssuesAlert } from '@/components/ui/review-step-layout';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { mapParseColorToChipColor } from '@/parse';
import { NameTabForm } from '../forms/name-tab-form';
import { PaymentsTab } from '../tabs/payments-tab';
import { CustomerTab } from '../tabs/customer-tab';
import { MessagesTab } from '../tabs/messages-tab';
import { FeaturesTab } from '../tabs/features-tab';
import { TrackingTab } from '../tabs/tracking-tab';
import { ProductsTab } from '../tabs/products-tab';
import { CouponsTab } from '../tabs/coupons-tab';
import { UrlsTab } from '../tabs/urls-tab';
import { SeoTab } from '../tabs/seo-tab';
import { VisualTab } from '../tabs/visual-tab';
import { TemplatesTab } from '../tabs/templates-tab';
import { ReviewTab } from '../tabs/review-tab';
import { useCheckoutOnboarding } from '../hooks/use-checkout-onboarding';
import type { UseCheckoutOnboardingProps } from '../hooks/use-checkout-onboarding';
import { PaymentEnvironment } from '@/types/enums';
import { CHECKOUT_ONBOARDING_STEPS } from '@/types/merchant/checkout-onboarding';

export function CheckoutOnboarding({
	merchantId,
	checkout,
	templates,
	initialStep,
	isPending,
	onCreateCheckout,
	onUpdateName,
	onComplete,
	onRefresh,
}: UseCheckoutOnboardingProps) {
	const {
		currentStep,
		activeStep,
		currentStepConfig,
		isOnboardingCompleted,
		isReviewStep,
		statusParse,
		savingStepKey,
		onboardingForm,
		setOnboardingFormValues,
		saveStepConfig,
		reviewIssues,
		visibleWizardSteps,
		visibleContentSteps,
		contentContainerRef,
		isStatusPending,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		isTransferModalOpen,
		setIsTransferModalOpen,
		isActivationGuideModalOpen,
		closeActivationGuideModal,
		isFinalizingActivationTransition,
		isPreviewModalOpen,
		setIsPreviewModalOpen,
		livePreviewUrl,
		isDeletingCheckout,
		isTransferringCheckout,
		hasActiveUnsavedChanges,
		isActiveStepSaving,
		paymentsDraft,
		customerDraft,
		productsDraft,
		featuresDraft,
		urlsDraft,
		contactDraft,
		messagesDraft,
		trackingDraft,
		seoDraft,
		visualDraft,
		setPaymentsDraft,
		setCustomerDraft,
		setProductsDraft,
		setFeaturesDraft,
		setUrlsDraft,
		setVisualDraft,
		setContactDraft: _setContactDraft,
		setMessagesDraft,
		setTrackingDraft,
		setSeoDraft,
		handleGoToListing,
		handleBack,
		handleNext,
		handleStepClick,
		handleNameSubmit,
		handleFinishOnboarding,
		handleDeleteCheckout,
		handleTransferCheckoutToProduction,
		handleCopyLink,
		handleOpenCheckoutLink,
		handleShareCheckoutLink,
		triggerActiveStepSave,
	} = useCheckoutOnboarding({
		merchantId,
		checkout,
		templates,
		initialStep,
		isPending,
		onCreateCheckout,
		onUpdateName,
		onComplete,
		onRefresh,
	});

	const stepTabItems: InternalTabItem[] = visibleWizardSteps.map((step) => ({
		id: step.key,
		label: step.title,
	}));
	const currentVisibleStepIndex = visibleWizardSteps.findIndex((step) => step.fullIndex === activeStep);
	const isLastVisibleStep = currentVisibleStepIndex === visibleWizardSteps.length - 1;

	const currentStepKey = currentStepConfig?.key ?? visibleWizardSteps[0]?.key ?? 'name';
	const useInternalTabs = checkout?.status === 'Active';
	const isNameStepActive = activeStep === 0;
	const shouldShowUpdateHint = ['template', 'payments', 'customer', 'messages', 'features', 'urls', 'seo', 'visual'].includes(currentStepKey);
	const isNavigationBlocked = isPending || isStatusPending || isFinalizingActivationTransition;
	const [isEditNameOverlayOpen, setIsEditNameOverlayOpen] = useState(false);
	const [nameDraft, setNameDraft] = useState(checkout?.name ?? '');

	function handleOpenEditNameOverlay() {
		setNameDraft(checkout?.name ?? '');
		setIsEditNameOverlayOpen(true);
	}

	function handleSubmitNameFromHeader() {
		const normalizedName = nameDraft.trim();
		if (!normalizedName) {
			return;
		}

		onUpdateName(normalizedName);
		setIsEditNameOverlayOpen(false);
	}

	function triggerNameStepSubmit() {
		const container = contentContainerRef.current;
		if (!container) {
			return;
		}

		const submitButton = container.querySelector<HTMLButtonElement>('[data-checkout-name-submit="true"]');
		submitButton?.click();
	}

	function renderStepContent(stepKeyOverride?: string) {
		if (currentStep === 0 && !stepKeyOverride) {
			return <NameTabForm defaultName={checkout?.name ?? ''} isPending={isPending} onSubmitName={handleNameSubmit} />;
		}

		if (!checkout) {
			return null;
		}

		const stepKey = stepKeyOverride ?? currentStepConfig?.key;

		switch (stepKey) {
			case 'template':
				return <TemplatesTab checkout={checkout} merchantId={merchantId} templates={templates} onRefresh={onRefresh} />;
			case 'payments':
				return (
					<PaymentsTab
						checkout={checkout}
						onSave={() => saveStepConfig('payments')}
						isSaving={savingStepKey === 'payments'}
						onFormChange={setOnboardingFormValues}
						onDraftChange={setPaymentsDraft}
					/>
				);
			case 'customer':
				return (
					<CustomerTab
						checkout={checkout}
						onSave={() => saveStepConfig('customer')}
						isSaving={savingStepKey === 'customer'}
						onFormChange={setOnboardingFormValues}
						onDraftChange={setCustomerDraft}
					/>
				);
			case 'messages':
				return (
					<MessagesTab
						checkout={checkout}
						merchantId={merchantId}
						onRefresh={onRefresh}
						onDraftChange={setMessagesDraft}
					/>
				);
			case 'features':
				return (
					<FeaturesTab
						checkout={checkout}
						onSave={() => saveStepConfig('features')}
						isSaving={savingStepKey === 'features'}
						onFormChange={setOnboardingFormValues}
						isOnboarding
						onDraftChange={setFeaturesDraft}
					/>
				);
			case 'tracking': {
				return (
					<TrackingTab
						checkout={checkout}
						merchantId={merchantId}
						onRefresh={onRefresh}
						onDraftChange={setTrackingDraft}
					/>
				);
			}
			case 'products':
				return (
					<ProductsTab
						checkout={checkout}
						merchantId={merchantId}
						onRefresh={onRefresh}
						onDraftChange={setProductsDraft}
					/>
				);
			case 'coupons': {
				return <CouponsTab checkout={checkout} merchantId={merchantId} onRefresh={onRefresh} />;
			}
			case 'urls':
				return (
					<UrlsTab
						checkout={checkout}
						onSave={() => saveStepConfig('urls')}
						isSaving={savingStepKey === 'urls'}
						onFormChange={setOnboardingFormValues}
						onDraftChange={setUrlsDraft}
					/>
				);
			case 'seo':
				return (
					<SeoTab
						checkout={checkout}
						merchantId={merchantId}
						onRefresh={onRefresh}
						onDraftChange={setSeoDraft}
					/>
				);
			case 'visual':
				return (
					<VisualTab
						checkout={checkout}
						merchantId={merchantId}
						onSave={() => saveStepConfig('visual')}
						isSaving={savingStepKey === 'visual'}
						onFormChange={setOnboardingFormValues}
						onDraftChange={setVisualDraft}
					/>
				);
			case 'review':
				return (
					<ReviewTab
						checkout={checkout}
						merchantId={merchantId}
						onRefresh={onRefresh}
						reviewDraft={{
							payments: paymentsDraft,
							customer: customerDraft,
							products: productsDraft,
							features: featuresDraft,
							urls: urlsDraft,
							contact: contactDraft,
							messages: messagesDraft,
							tracking: trackingDraft,
							seo: seoDraft,
							visual: visualDraft,
						}}
					/>
				);
			default:
				return null;
		}
	}

	return (
		<FormProvider {...onboardingForm}>
		<div className="flex flex-col gap-4">
			<div
				className={
					isFinalizingActivationTransition
						? 'flex flex-col gap-4 transition-all duration-300 opacity-70'
						: 'flex flex-col gap-4 transition-all duration-300 opacity-100'
				}
			>
			<FormPageHeader
				icon={<Icon icon={ShoppingCart01Icon} size={24} className="text-accent" />}
				title={
					<div className="inline-flex items-center gap-2">
						<span>{checkout?.name ?? 'Novo Checkout'}</span>
						{checkout?.status === 'Active' && (
							<Button isIconOnly variant="tertiary" size="sm" onPress={handleOpenEditNameOverlay}>
								<Icon icon={PencilEdit01Icon} className="icon-sm" />
							</Button>
						)}
					</div>
				}
				description={isOnboardingCompleted ? 'Edite e gerencie seu checkout' : 'Configure seu checkout passo a passo'}
				backLabel="Voltar"
				onBack={handleGoToListing}
				updatedAt={checkout?.updatedAt ?? undefined}
				meta={
					statusParse ? (
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm">
							{statusParse.label}
						</Chip>
					) : undefined
				}
				actions={
					checkout ? (
						<div className="flex items-center gap-2">
							{livePreviewUrl && (
								<Button variant="primary" onPress={() => setIsPreviewModalOpen(true)}>
									<Icon icon={ViewIcon} className="icon-sm" />
									Abrir preview
								</Button>
							)}
							{checkout.status === 'Active' && checkout.checkoutUrl && (
								<>
									<Button variant="secondary" onPress={handleOpenCheckoutLink}>
										<Icon icon={Link01Icon} className="icon-sm" />
										Abrir link
									</Button>
								</>
							)}
							<Dropdown>
								<Button variant="tertiary" aria-label="Ações do checkout">
									<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
									Ações
								</Button>
								<Dropdown.Popover className="min-w-48">
									<Dropdown.Menu aria-label="Ações do checkout">
										{checkout.checkoutUrl && (
											<Dropdown.Item id="open-link" textValue="Abrir checkout" onPress={handleOpenCheckoutLink}>
												<Icon icon={Link01Icon} className="icon-xs" />
												Abrir checkout
											</Dropdown.Item>
										)}
										{checkout.checkoutUrl && (
											<Dropdown.Item
												id="share-link"
												textValue="Compartilhar checkout"
												onPress={handleShareCheckoutLink}
											>
												<Icon icon={Share08Icon} className="icon-xs" />
												Compartilhar
											</Dropdown.Item>
										)}
										{checkout.environment === PaymentEnvironment.Sandbox && (
											<Dropdown.Item
												id="transfer-to-production"
												textValue="Transferir para produção"
												onPress={() => setIsTransferModalOpen(true)}
											>
												<Icon icon={ArrowUpRight01Icon} className="icon-xs" />
												Transferir para Produção
											</Dropdown.Item>
										)}
										<Dropdown.Item
											id="delete-checkout"
											textValue="Excluir checkout"
											className="text-danger"
											onPress={() => setIsDeleteModalOpen(true)}
										>
											<Icon icon={Delete02Icon} className="icon-xs text-danger" />
											Excluir checkout
										</Dropdown.Item>
									</Dropdown.Menu>
								</Dropdown.Popover>
							</Dropdown>
						</div>
					) : undefined
				}
			/>

			{checkout?.status === 'Active' && checkout.checkoutUrl && (
				<div className="flex flex-col gap-2 rounded-xl border border-divider bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0 flex-1">
						<p className="text-xs text-muted">Link do checkout ativo</p>
						<p className="truncate text-sm font-medium text-foreground">{checkout.checkoutUrl}</p>
					</div>
					<Button variant="tertiary" onPress={handleCopyLink}>
						<Icon icon={Copy01Icon} className="icon-sm" />
						Copiar link
					</Button>
				</div>
			)}

			{checkout?.status === 'Active' && (
				<UnsavedChangesAlert
					hasChanges={hasActiveUnsavedChanges}
					message={'Você tem alterações não salvas. Clique em "Salvar" para aplicar as mudanças.'}
					onSave={triggerActiveStepSave}
					isSaving={isActiveStepSaving}
				/>
			)}

			{useInternalTabs ? (
				<InternalTabs
					ariaLabel="Etapas do checkout"
					items={stepTabItems}
					selectedKey={currentStepKey}
					onSelectionChange={(key) => {
						const nextStepIndex = visibleWizardSteps.findIndex((step) => step.key === key);
						if (nextStepIndex < 0) return;
						const step = visibleWizardSteps[nextStepIndex];
						if (!step) return;
						const fullIndex = CHECKOUT_ONBOARDING_STEPS.findIndex((item) => item.key === step.key);
						if (fullIndex < 0) return;
						if (!checkout && fullIndex > 0) return;
						handleStepClick(fullIndex);
					}}
				/>
			) : (
				<WizardStepper
					steps={visibleWizardSteps}
					currentStep={Math.max(0, currentVisibleStepIndex)}
					mode={isOnboardingCompleted ? 'editor' : 'wizard'}
					isDisabled={isNavigationBlocked}
					onStepClick={(stepIndex) => {
						const targetStep = visibleWizardSteps[stepIndex];
						if (!targetStep) {
							return;
						}

						handleStepClick(targetStep.fullIndex);
					}}
					isStepClickDisabled={(stepIndex) => {
						const targetStep = visibleWizardSteps[stepIndex];
						if (!targetStep) {
							return true;
						}

						return !checkout && targetStep.fullIndex > 0;
					}}
				/>
			)}

			{isReviewStep && reviewIssues.length > 0 && (
				<ReviewIssuesAlert issues={reviewIssues} title="Pendências para publicação" />
			)}

			{checkout && shouldShowUpdateHint && (
				<Alert status="accent">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Atualização do checkout após salvar</Alert.Title>
						<Alert.Description>
							Após salvar, o checkout é atualizado com as mudanças. Você pode validar o resultado no link público do checkout ou no preview.
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<div
				ref={contentContainerRef}
				className="flex min-w-0 flex-col gap-4 **:data-[unsaved-changes-alert=true]:hidden"
			>
				{!useInternalTabs && activeStep === 0
					? renderStepContent()
					: visibleContentSteps.map((step) => (
							<div
								key={step.key}
								data-checkout-step-wrapper="true"
								data-active-step={currentStepConfig?.key === step.key ? 'true' : 'false'}
								className={currentStepConfig?.key === step.key ? 'block' : 'hidden'}
							>
								{renderStepContent(step.key)}
							</div>
						))}
			</div>

			{!useInternalTabs && (
				<div className="rounded-xl border border-divider bg-surface p-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
						<Button
							variant="secondary"
							onPress={isNameStepActive ? handleGoToListing : handleBack}
							isDisabled={isNavigationBlocked}
							className="sm:mr-auto"
						>
							<Icon icon={ArrowLeft01Icon} className="icon-sm" />
							Voltar
						</Button>

						{isNameStepActive ? (
							<Button
								variant="primary"
								onPress={triggerNameStepSubmit}
								isDisabled={isNavigationBlocked}
								className="w-full sm:w-auto"
							>
								Próximo
								<Icon icon={ArrowRight01Icon} className="icon-sm" />
							</Button>
						) : !isLastVisibleStep ? (
							<Button
								variant="primary"
								onPress={handleNext}
								isDisabled={isNavigationBlocked}
								className="w-full sm:w-auto"
							>
								Próximo
								<Icon icon={ArrowRight01Icon} className="icon-sm" />
							</Button>
						) : (
							<AsyncButton
								variant="primary"
								onPress={handleFinishOnboarding}
								isPending={isStatusPending || isFinalizingActivationTransition}
								isDisabled={reviewIssues.length > 0 || isNavigationBlocked}
								className="w-full sm:w-auto"
							>
								<Icon icon={Tick01Icon} className="icon-sm" />
								Salvar e finalizar
							</AsyncButton>
						)}
					</div>
				</div>
			)}
			</div>

			{isFinalizingActivationTransition && (
				<div className="fixed inset-0 z-110 flex items-center justify-center bg-background/72 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border border-divider bg-surface p-5 shadow-2xl">
						<div className="flex items-center gap-3">
							<Spinner size="sm" />
							<div className="flex flex-col gap-1">
								<p className="text-sm font-semibold text-foreground">Ativando checkout</p>
								<p className="text-xs text-muted">
									Estamos salvando as configurações e preparando o modo de edição ativa.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{livePreviewUrl && isPreviewModalOpen && (
				<div className="fixed inset-0 z-120 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
					<div className="flex h-[78vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-divider bg-background shadow-2xl">
						<div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3">
							<div className="flex min-w-0 items-center gap-2">
								<Icon icon={ViewIcon} className="icon-sm text-accent" />
								<div className="flex min-w-0 flex-col">
									<p className="truncate font-medium">Preview ao vivo</p>
									<p className="truncate text-xs text-muted">Alterações visuais aplicadas em tempo real.</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button variant="secondary" onPress={handleOpenCheckoutLink}>
									<Icon icon={Link01Icon} className="icon-sm" />
									Abrir em nova aba
								</Button>
								<Button variant="tertiary" onPress={() => setIsPreviewModalOpen(false)}>
									<Icon icon={Cancel01Icon} className="icon-sm" />
									Fechar
								</Button>
							</div>
						</div>
						<div className="flex-1 bg-content1 p-3">
							<iframe
								title="Preview em tempo real do checkout"
								src={livePreviewUrl}
								className="h-full w-full rounded-lg border border-divider bg-background"
							/>
						</div>
					</div>
				</div>
			)}

			{checkout?.status === 'Active' && (
				<Modal.Backdrop isOpen={isActivationGuideModalOpen} onOpenChange={(open) => !open && closeActivationGuideModal()}>
					<Modal.Container size="lg" placement="center" scroll="outside">
						<Modal.Dialog className="max-w-2xl">
							<Modal.CloseTrigger />
							<Modal.Header>
								<Modal.Icon className="bg-success text-success-foreground">
									<Icon icon={Tick01Icon} className="icon-sm" />
								</Modal.Icon>
								<Modal.Heading>Checkout criado com sucesso</Modal.Heading>
								<p className="text-sm text-muted">
									Seu checkout agora está ativo. Você pode continuar configurando e evoluindo tudo por aqui.
								</p>
							</Modal.Header>
							<Modal.Body>
								<div className="space-y-3 text-sm text-foreground">
									<p>
										A partir de agora, sempre que você salvar uma alteração, o checkout público é atualizado automaticamente.
									</p>
									<div className="rounded-lg border border-divider bg-content1 p-3">
										<p className="mb-2 font-medium">O que você pode configurar agora:</p>
										<ul className="list-disc space-y-1 pl-5 text-muted">
											<li>Nome interno, template e aparência visual completa</li>
											<li>Métodos de pagamento, expiração PIX e tempo de reserva</li>
											<li>Regras de dados obrigatórios do cliente</li>
											<li>Produtos, ordenação de vitrine e gestão de cupons</li>
											<li>Mensagens do checkout e canais de contato</li>
											<li>Recursos extras como timer, frete e prova social</li>
											<li>Integrações de tracking e pixels compatíveis com o template</li>
											<li>URLs de sucesso, cancelamento e callback</li>
											<li>Configurações completas de SEO e compartilhamento</li>
										</ul>
									</div>
									<p className="rounded-lg bg-warning-soft px-3 py-2 text-warning-soft-foreground">
										Não existe opção de desativar checkout. Se precisar encerrar, a ação disponível é excluir.
									</p>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button variant="primary" onPress={closeActivationGuideModal}>
									Entendi, continuar edição
								</Button>
							</Modal.Footer>
						</Modal.Dialog>
					</Modal.Container>
				</Modal.Backdrop>
			)}

			{checkout?.status === 'Active' && (
				<Modal.Backdrop isOpen={isEditNameOverlayOpen} onOpenChange={setIsEditNameOverlayOpen}>
					<Modal.Container size="md" placement="center" scroll="outside">
						<Modal.Dialog className="max-w-xl">
							<Modal.CloseTrigger />
							<Modal.Header>
								<Modal.Icon className="bg-accent text-accent-foreground">
									<Icon icon={PencilEdit01Icon} className="icon-sm" />
								</Modal.Icon>
								<Modal.Heading>Editar nome do checkout</Modal.Heading>
								<p className="text-sm text-muted">Atualize o nome interno usado para identificar este checkout.</p>
							</Modal.Header>
							<Modal.Body>
								<TextField variant="secondary" isRequired>
									<Label>Novo nome</Label>
									<Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} autoFocus />
								</TextField>
							</Modal.Body>
							<Modal.Footer>
								<Button variant="tertiary" onPress={() => setIsEditNameOverlayOpen(false)}>
									Cancelar
								</Button>
								<Button variant="primary" onPress={handleSubmitNameFromHeader} isDisabled={!nameDraft.trim() || isPending}>
									<Icon icon={Tick02Icon} className="icon-sm" />
									Salvar nome
								</Button>
							</Modal.Footer>
						</Modal.Dialog>
					</Modal.Container>
				</Modal.Backdrop>
			)}

			<ConfirmationModal
				isOpen={isTransferModalOpen}
				onOpenChange={(open) => !open && setIsTransferModalOpen(false)}
				title="Transferir para Produção"
				description={
					'Uma nova cópia deste checkout será criada em Produção com template e configurações gerais. Produtos e cupons devem ser configurados no checkout de produção.'
				}
				confirmLabel="Transferir"
				status="warning"
				onConfirm={handleTransferCheckoutToProduction}
				isPending={isTransferringCheckout}
			/>

			<ConfirmationModal
				isOpen={isDeleteModalOpen}
				onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}
				title="Excluir Checkout"
				description={`Tem certeza que deseja excluir o checkout "${checkout?.name ?? ''}"? Se houver pagamentos vinculados, o checkout sera arquivado.`}
				confirmLabel="Excluir"
				status="danger"
				onConfirm={handleDeleteCheckout}
				isPending={isDeletingCheckout}
			/>
		</div>
		</FormProvider>
	);
}
