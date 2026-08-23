'use client';

import { use, useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
	DndContext,
	DragOverlay,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragStartEvent,
	type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import {
	Card,
	TextField,
	Input,
	Label,
	Switch,
	Button,
	Modal,
	FieldError,
	ColorPicker,
	ColorArea,
	ColorSlider,
	ColorSwatch,
	ColorField,
	parseColor,
} from '@heroui/react';
import { Mail02Icon, SaveAll, MailSend01Icon, InformationCircleIcon, CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { BlocksPalette } from './blocks-palette';
import { BlockSettings } from './block-settings';
import { Routes } from '@/router/routes';
import type { EmailBlock, EmailBlockSettings, EmailTemplateData } from '@/types/merchant/email-templates';
import { EmailBlockType, EmailTextAlignment, MerchantEmailTemplateType, PaymentEnvironment } from '@/types/enums';
import { EmailPreview } from './email-preview';
import { AsyncButton } from '@/components/ui/async-button';
import { upsertMerchantEmailTemplate, sendTestEmail } from '@/app/actions/merchant/email-templates';
import type { ApiResponse } from '@/types/common';
import { toast } from '@heroui/react';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { merchantEmailTemplateTypeParse } from '@/parse';
import { VariablesReferenceModal } from './variables-reference-modal';

interface EmailTemplateEditorProps {
	templatePromise: Promise<ApiResponse<EmailTemplateData | null>>;
	merchantId: string;
	templateType: MerchantEmailTemplateType;
}

interface TemplateSnapshot {
	name: string;
	subject: string;
	enabled: boolean;
	primaryColor: string;
	backgroundColor: string;
	containerBackgroundColor: string;
	textColorMode: 'dark' | 'light';
	blocks: EmailBlock[];
}

interface ColorPickerFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label className="text-sm">{label}</Label>
			<ColorPicker value={parseColor(value)} onChange={(color) => onChange(color.toString('hex').toUpperCase())}>
				<ColorPicker.Trigger className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
					<ColorSwatch size="md" className="rounded-lg" />
					<span className="text-sm font-medium font-mono">{value.toUpperCase()}</span>
				</ColorPicker.Trigger>
				<ColorPicker.Popover className="gap-3 p-3">
					<ColorArea aria-label={label} colorSpace="hsb" xChannel="saturation" yChannel="brightness">
						<ColorArea.Thumb />
					</ColorArea>
					<ColorSlider channel="hue" colorSpace="hsb" className="gap-1 px-1">
						<Label>Hue</Label>
						<ColorSlider.Output className="text-muted" />
						<ColorSlider.Track>
							<ColorSlider.Thumb />
						</ColorSlider.Track>
					</ColorSlider>
					<ColorField aria-label={`${label} Hex`}>
						<ColorField.Input />
					</ColorField>
				</ColorPicker.Popover>
			</ColorPicker>
		</div>
	);
}

function generateBlockId(): string {
	return `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createDefaultBlock(type: EmailBlockType): EmailBlock {
	const id = generateBlockId();
	const defaultSettings: EmailBlockSettings = {};

	switch (type) {
		case EmailBlockType.Header:
			return { id, type, content: '[[merchant_name]]', settings: { textAlign: EmailTextAlignment.Center } };
		case EmailBlockType.Text:
			return { id, type, content: 'Digite seu texto aqui...', settings: { textAlign: EmailTextAlignment.Left } };
		case EmailBlockType.Button:
			return {
				id,
				type,
				content: 'Clique aqui',
				settings: { buttonUrl: '#', textAlign: EmailTextAlignment.Center },
			};
		case EmailBlockType.Image:
			return { id, type, settings: { imageUrl: '', imageAlt: 'Imagem', textAlign: EmailTextAlignment.Center } };
		case EmailBlockType.Banner:
			return { id, type, settings: { imageUrl: '', imageAlt: 'Banner' } };
		case EmailBlockType.ProductList:
			return { id, type, content: 'Itens do Pedido', settings: { showPrices: true, showQuantity: true } };
		case EmailBlockType.DigitalItemsList:
			return { id, type, content: 'Seus Itens Digitais', settings: {} };
		case EmailBlockType.TrackingInfo:
			return { id, type, content: 'Informações de Rastreio', settings: {} };
		case EmailBlockType.Divider:
			return { id, type, settings: { dividerColor: '#E5E7EB', dividerThickness: 1 } };
		case EmailBlockType.Spacer:
			return { id, type, settings: { spacerHeight: 24 } };
		case EmailBlockType.Footer:
			return {
				id,
				type,
				content: 'Obrigado por comprar conosco!\n\nEste email foi enviado automaticamente por [[merchant_name]].',
				settings: { textAlign: EmailTextAlignment.Center },
			};
		case EmailBlockType.Columns:
			return { id, type, settings: { columns: [] } };
		case EmailBlockType.OrderSummary:
			return { id, type, content: 'Resumo do Pedido', settings: {} };
		default:
			return { id, type, content: '', settings: defaultSettings };
	}
}

function createDefaultTemplate(type: MerchantEmailTemplateType): EmailTemplateData {
	const baseBlocks: EmailBlock[] = [
		createDefaultBlock(EmailBlockType.Header),
		{
			id: generateBlockId(),
			type: EmailBlockType.Text,
			content: 'Olá, [[customer_name]]!',
			settings: { fontSize: 20, bold: true, textAlign: EmailTextAlignment.Left, marginBottom: 16 },
		},
	];

	switch (type) {
		case MerchantEmailTemplateType.PaymentConfirmation:
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Seu pagamento foi confirmado! Pedido #[[order_number]]',
				settings: { fontSize: 16, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.ProductList,
				settings: { showProductImages: true, showPrices: true, showQuantity: true },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.OrderSummary,
				settings: {},
			});
			break;
		case MerchantEmailTemplateType.DigitalDelivery:
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Seus itens digitais estão prontos! 🎉',
				settings: { fontSize: 16, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.DigitalItemsList,
				settings: { showProductImages: true, backgroundColor: '#F9FAFB', padding: 16 },
			});
			break;
		case MerchantEmailTemplateType.OrderShipped:
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Ótimas notícias! Seu pedido #[[order_number]] foi enviado.',
				settings: { fontSize: 16, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.TrackingInfo,
				settings: {},
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Button,
				content: 'Rastrear Pedido',
				settings: {
					buttonUrl: '[[tracking_url]]',
					buttonTextColor: '#FFFFFF',
					buttonBorderRadius: 8,
					textAlign: EmailTextAlignment.Center,
				},
			});
			break;
		case MerchantEmailTemplateType.OrderDelivered:
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Seu pedido #[[order_number]] foi entregue em [[delivery_date]]! 🎉',
				settings: { fontSize: 16, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.ProductList,
				settings: { showProductImages: true, showPrices: false },
			});
			break;
		case MerchantEmailTemplateType.Welcome:
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Seja bem-vindo(a) à nossa loja! Estamos muito felizes em ter você conosco.',
				settings: { fontSize: 16, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Explore nossos produtos e aproveite ofertas exclusivas para novos clientes.',
				settings: { fontSize: 14, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Button,
				content: 'Explorar Produtos',
				settings: {
					buttonUrl: '[[store_url]]',
					buttonTextColor: '#FFFFFF',
					buttonBorderRadius: 8,
					textAlign: EmailTextAlignment.Center,
				},
			});
			break;
		case MerchantEmailTemplateType.AbandonedCart:
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Você esqueceu alguns itens no seu carrinho! 🛒',
				settings: { fontSize: 16, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.ProductList,
				settings: { showProductImages: true, showPrices: true },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Text,
				content: 'Complete sua compra antes que os itens acabem!',
				settings: { fontSize: 14, marginBottom: 24 },
			});
			baseBlocks.push({
				id: generateBlockId(),
				type: EmailBlockType.Button,
				content: 'Finalizar Compra',
				settings: {
					buttonUrl: '[[checkout_url]]',
					buttonTextColor: '#FFFFFF',
					buttonBorderRadius: 8,
					textAlign: EmailTextAlignment.Center,
				},
			});
			break;
	}

	baseBlocks.push({
		id: generateBlockId(),
		type: EmailBlockType.Spacer,
		settings: { spacerHeight: 32 },
	});
	baseBlocks.push({
		id: generateBlockId(),
		type: EmailBlockType.Divider,
		settings: { dividerColor: '#E5E7EB', dividerThickness: 1 },
	});
	baseBlocks.push({
		id: generateBlockId(),
		type: EmailBlockType.Footer,
		content: 'Obrigado por comprar conosco!\n\nEste email foi enviado automaticamente por [[merchant_name]].',
		settings: { fontSize: 12, textColor: '#6B7280', textAlign: EmailTextAlignment.Center, marginTop: 16 },
	});

	return {
		id: 'default',
		merchantId: 'default',
		type,
		environment: PaymentEnvironment.Sandbox,
		name: 'Template padrão',
		enabled: true,
		subject: 'Atualização do seu pedido',
		blocks: baseBlocks,
		primaryColor: '#171717',
		backgroundColor: '#F3F4F6',
		containerBackgroundColor: '#FFFFFF',
		textColorMode: 'dark',
		isDefault: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

function buildSnapshot(template: TemplateSnapshot): TemplateSnapshot {
	return {
		name: template.name,
		subject: template.subject,
		enabled: template.enabled,
		primaryColor: template.primaryColor,
		backgroundColor: template.backgroundColor,
		containerBackgroundColor: template.containerBackgroundColor,
		textColorMode: template.textColorMode,
		blocks: template.blocks,
	};
}

function normalizeBlocks(blocks: EmailBlock[]): EmailBlock[] {
	return blocks.map((block, index) => ({
		...block,
		order: index,
		settings: block.settings ?? {},
	}));
}

export function EmailTemplateEditor({ templatePromise, merchantId, templateType }: EmailTemplateEditorProps) {
	const router = useRouter();
	const response = use(templatePromise);
	const template = response?.data ?? createDefaultTemplate(templateType);

	const [name, setName] = useState(template.name ?? 'Template padrão');
	const [subject, setSubject] = useState(template.subject ?? 'Atualização do seu pedido');
	const [enabled, setEnabled] = useState(template.enabled ?? true);
	const [primaryColor, setPrimaryColor] = useState(template.primaryColor ?? '#171717');
	const [backgroundColor, setBackgroundColor] = useState(template.backgroundColor ?? '#F3F4F6');
	const [containerBackgroundColor, setContainerBackgroundColor] = useState(template.containerBackgroundColor ?? '#ffffff');
	const [textColorMode, setTextColorMode] = useState<'dark' | 'light'>((template.textColorMode as 'dark' | 'light') ?? 'dark');
	const [blocks, setBlocks] = useState<EmailBlock[]>(template.blocks ?? []);
	const [updatedAt, setUpdatedAt] = useState(template.updatedAt ?? null);
	const [initialSnapshot, setInitialSnapshot] = useState(() =>
		buildSnapshot({
			name: template.name ?? 'Template padrão',
			subject: template.subject ?? 'Atualização do seu pedido',
			enabled: template.enabled ?? true,
			primaryColor: template.primaryColor ?? '#171717',
			backgroundColor: template.backgroundColor ?? '#F3F4F6',
			containerBackgroundColor: template.containerBackgroundColor ?? '#ffffff',
			textColorMode: (template.textColorMode as 'dark' | 'light') ?? 'dark',
			blocks: template.blocks ?? [],
		})
	);

	const currentSnapshot = buildSnapshot({
		name,
		subject,
		enabled,
		primaryColor,
		backgroundColor,
		containerBackgroundColor,
		textColorMode,
		blocks,
	});

	const hasChanges = useUnsavedChanges(currentSnapshot, initialSnapshot, true);

	const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
	const [_activeId, setActiveId] = useState<string | null>(null);
	const [activePaletteType, setActivePaletteType] = useState<EmailBlockType | null>(null);
	const [isPending, startTransition] = useTransition();
	const [isTestModalOpen, setIsTestModalOpen] = useState(false);
	const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
	const [testEmail, setTestEmail] = useState('');
	const [testEmailError, setTestEmailError] = useState<string | null>(null);
	const [isSendingTest, setIsSendingTest] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

	function handleDragStart(event: DragStartEvent) {
		const { active } = event;
		const idStr = String(active.id);

		if (idStr.startsWith('palette-')) {
			const type = idStr.replace('palette-', '') as EmailBlockType;
			setActivePaletteType(type);
			setActiveId(null);
		} else {
			setActiveId(idStr);
			setActivePaletteType(null);
		}
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		setActiveId(null);
		setActivePaletteType(null);

		if (!over) return;

		const activeIdStr = String(active.id);
		const overIdStr = String(over.id);

		if (activeIdStr.startsWith('palette-')) {
			const type = activeIdStr.replace('palette-', '') as EmailBlockType;
			const newBlock = createDefaultBlock(type);

			if (overIdStr === 'canvas-drop-zone') {
				setBlocks((prev) => [...prev, newBlock]);
			} else {
				const overIndex = blocks.findIndex((b) => b.id === overIdStr);
				if (overIndex !== -1) {
					setBlocks((prev) => {
						const newBlocks = [...prev];
						newBlocks.splice(overIndex, 0, newBlock);
						return newBlocks;
					});
				} else {
					setBlocks((prev) => [...prev, newBlock]);
				}
			}

			setSelectedBlockId(newBlock.id);
		} else {
			if (activeIdStr !== overIdStr && overIdStr !== 'canvas-drop-zone') {
				setBlocks((prev) => {
					const oldIndex = prev.findIndex((b) => b.id === activeIdStr);
					const newIndex = prev.findIndex((b) => b.id === overIdStr);

					if (oldIndex !== -1 && newIndex !== -1) {
						return arrayMove(prev, oldIndex, newIndex);
					}
					return prev;
				});
			}
		}
	}

	const handleBlockSelect = useCallback((blockId: string | null) => {
		setSelectedBlockId(blockId);
	}, []);

	const handleBlockUpdate = useCallback((blockId: string, updates: Partial<EmailBlock>) => {
		setBlocks((prev) =>
			prev.map((block) =>
				block.id === blockId
					? {
							...block,
							...updates,
							settings: updates.settings ? { ...block.settings, ...updates.settings } : block.settings,
						}
					: block
			)
		);
	}, []);

	const handleBlockDelete = useCallback((blockId: string) => {
		setBlocks((prev) => prev.filter((b) => b.id !== blockId));
		setSelectedBlockId((prev) => (prev === blockId ? null : prev));
	}, []);

	const handleBlockDuplicate = useCallback((blockId: string) => {
		setBlocks((prev) => {
			const index = prev.findIndex((b) => b.id === blockId);
			if (index === -1) return prev;

			const block = prev[index];
			if (!block) return prev;

			const newBlock: EmailBlock = {
				id: generateBlockId(),
				type: block.type,
				content: block.content,
				settings: block.settings ? { ...block.settings } : undefined,
			};

			const newBlocks = [...prev];
			newBlocks.splice(index + 1, 0, newBlock);
			return newBlocks;
		});
	}, []);

	function handleSave() {
		startTransition(async () => {
			const result = await upsertMerchantEmailTemplate(merchantId, templateType, {
				name: name.trim() || null,
				subject: subject.trim() || null,
				enabled,
				primaryColor,
				backgroundColor,
				containerBackgroundColor,
				textColorMode,
				blocks: normalizeBlocks(blocks),
			});

			if (result?.error) {
				toast('Erro ao salvar template', {
					description: result.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const saved = result?.data;
			if (saved) {
				setName(saved.name);
				setSubject(saved.subject);
				setEnabled(saved.enabled);
				setPrimaryColor(saved.primaryColor);
				setBackgroundColor(saved.backgroundColor);
				setContainerBackgroundColor(saved.containerBackgroundColor ?? '#ffffff');
				setTextColorMode((saved.textColorMode as 'dark' | 'light') ?? 'dark');
				setBlocks(saved.blocks ?? []);
				setUpdatedAt(saved.updatedAt ?? null);
				setInitialSnapshot(
					buildSnapshot({
						name: saved.name,
						subject: saved.subject,
						enabled: saved.enabled,
						primaryColor: saved.primaryColor,
						backgroundColor: saved.backgroundColor,
						containerBackgroundColor: saved.containerBackgroundColor ?? '#ffffff',
						textColorMode: (saved.textColorMode as 'dark' | 'light') ?? 'dark',
						blocks: saved.blocks ?? [],
					})
				);
			}

			toast('Template salvo', {
				description: result?.message || 'O template foi salvo com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
		});
	}

	async function handleSendTest() {
		if (!testEmail.trim()) {
			setTestEmailError('Email é obrigatório');
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(testEmail.trim())) {
			setTestEmailError('Email inválido');
			return;
		}

		setTestEmailError(null);
		setIsSendingTest(true);

		const textColor = textColorMode === 'light' ? '#f9fafb' : '#111827';
		const mutedColor = textColorMode === 'light' ? '#d1d5db' : '#6b7280';

		const result = await sendTestEmail(merchantId, templateType, {
			email: testEmail.trim(),
			subject: subject.trim() || 'Teste de Template',
			blocks: normalizeBlocks(blocks),
			primaryColor,
			backgroundColor,
			containerBackgroundColor,
			textColor,
			mutedColor,
		});

		setIsSendingTest(false);

		if (result?.error) {
			toast('Erro ao enviar email', {
				description: result.error.message,
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		toast('Email de teste enviado', {
			description: result?.message || 'O email foi enviado com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
		setIsTestModalOpen(false);
		setTestEmail('');
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="flex h-full flex-col">
				<FormPageHeader
					icon={<Icon icon={Mail02Icon} className="icon-md text-accent" />}
					title={`Editar Template: ${merchantEmailTemplateTypeParse[templateType].label}`}
					description="Arraste blocos da paleta para construir seu email"
					updatedAt={updatedAt}
					backLabel="Voltar"
					onBack={() => router.push(Routes.panel.merchant.emailTemplates)}
					actions={
						<div className="flex flex-wrap items-center gap-3">
							<Switch isSelected={enabled} onChange={setEnabled}>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label className="text-sm">Habilitar envio</Label>
							</Switch>
							<Button variant="tertiary" onPress={() => setIsVariablesModalOpen(true)}>
								<Icon icon={InformationCircleIcon} className="icon-sm" />
								Variáveis
							</Button>
							<Button variant="secondary" onPress={() => setIsTestModalOpen(true)}>
								<Icon icon={MailSend01Icon} className="icon-sm" />
								Enviar Teste
							</Button>
							<AsyncButton variant="primary" isPending={isPending} onPress={handleSave} isDisabled={!hasChanges}>
								<Icon icon={SaveAll} className="icon-sm" />
								Salvar Template
							</AsyncButton>
						</div>
					}
				/>

				<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
					<UnsavedChangesAlert hasChanges={hasChanges} />

					<div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[16rem_1fr_22rem]">
						<div className="xl:sticky xl:top-0 xl:self-start">
							<BlocksPalette />
						</div>

						<div className="flex min-h-0 flex-col gap-4">
							<EmailPreview
								subject={subject}
								blocks={blocks}
								templateType={templateType}
								primaryColor={primaryColor}
								backgroundColor={backgroundColor}
								containerBackgroundColor={containerBackgroundColor}
								textColorMode={textColorMode}
								selectedBlockId={selectedBlockId}
								onBlockSelect={handleBlockSelect}
								onBlockDelete={handleBlockDelete}
								onBlockDuplicate={handleBlockDuplicate}
							/>
						</div>

						<div className="flex flex-col gap-4 xl:sticky xl:top-0 xl:self-start">
							<Card className="p-4">
								<div className="flex flex-col gap-4">
									<TextField variant="secondary">
										<Label>Nome do Template</Label>
										<Input variant="secondary" value={name} onChange={(e) => setName(e.target.value)} placeholder="Template padrão" />
									</TextField>
									<TextField variant="secondary">
										<Label>Assunto do Email</Label>
										<Input variant="secondary"
											value={subject}
											onChange={(e) => setSubject(e.target.value)}
											placeholder="Atualização do seu pedido"
										/>
									</TextField>
									<div className="grid grid-cols-2 gap-3">
										<ColorPickerField label="Cor Principal" value={primaryColor} onChange={setPrimaryColor} />
										<ColorPickerField label="Cor de Fundo" value={backgroundColor} onChange={setBackgroundColor} />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<ColorPickerField
											label="Fundo do Container"
											value={containerBackgroundColor}
											onChange={setContainerBackgroundColor}
										/>
										<div className="flex flex-col gap-1.5">
											<Label className="text-sm">Cor do Texto</Label>
											<div className="flex h-10 items-center gap-2">
												<Switch
													isSelected={textColorMode === 'light'}
													onChange={(value) => setTextColorMode(value ? 'light' : 'dark')}
												>
													<Switch.Control>
														<Switch.Thumb />
													</Switch.Control>
													<Label className="text-sm">{textColorMode === 'light' ? 'Claro' : 'Escuro'}</Label>
												</Switch>
											</div>
										</div>
									</div>
								</div>
							</Card>

							<Card className="p-4">
								{selectedBlock ? (
										<BlockSettings block={selectedBlock} onUpdate={handleBlockUpdate} primaryColor={primaryColor} />
								) : (
									<div className="flex h-48 flex-col items-center justify-center text-center text-muted">
										<p className="text-sm">Selecione um bloco para editar suas configurações</p>
									</div>
								)}
							</Card>
						</div>
					</div>
				</div>
			</div>

			<DragOverlay>
				{activePaletteType && (
					<div className="rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accentlg">
						Soltar para adicionar bloco
					</div>
				)}
			</DragOverlay>

			<Modal.Backdrop isOpen={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
				<Modal.Container size="md" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={MailSend01Icon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Enviar Email de Teste</Modal.Heading>
							<p className="text-sm text-muted">O email será enviado com o conteúdo atual do template</p>
						</Modal.Header>
						<Modal.Body>
							<TextField variant="secondary" isInvalid={!!testEmailError}>
								<Label>Email de destino</Label>
								<Input variant="secondary"
									type="email"
									value={testEmail}
									onChange={(e) => {
										setTestEmail(e.target.value);
										setTestEmailError(null);
									}}
									placeholder="seu@email.com"
								/>
								{testEmailError && <FieldError>{testEmailError}</FieldError>}
							</TextField>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={() => setIsTestModalOpen(false)} isDisabled={isSendingTest}>
								Cancelar
							</Button>
							<AsyncButton variant="primary" isPending={isSendingTest} onPress={handleSendTest}>
								<Icon icon={MailSend01Icon} className="icon-sm" />
								Enviar Teste
							</AsyncButton>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>

			<VariablesReferenceModal
				isOpen={isVariablesModalOpen}
				onOpenChange={setIsVariablesModalOpen}
				templateType={templateType}
			/>
		</DndContext>
	);
}
