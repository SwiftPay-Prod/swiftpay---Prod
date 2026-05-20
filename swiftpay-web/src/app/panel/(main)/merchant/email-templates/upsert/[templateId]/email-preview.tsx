'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@heroui/react';
import { Copy01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { EmailBlock, EmailBlockColumn } from '@/types/merchant/email-templates';
import { EmailBlockType, EmailTextAlignment, MerchantEmailTemplateType } from '@/types/enums';

interface EmailPreviewProps {
	blocks: EmailBlock[];
	subject: string;
	templateType: MerchantEmailTemplateType;
	primaryColor: string;
	backgroundColor: string;
	containerBackgroundColor?: string;
	textColorMode?: 'dark' | 'light';
	merchantName?: string | null;
	logoUrl?: string | null;
	selectedBlockId: string | null;
	onBlockSelect: (blockId: string | null) => void;
	onBlockDelete: (blockId: string) => void;
	onBlockDuplicate: (blockId: string) => void;
}

interface EmailRenderConfig {
	primaryColor: string;
	backgroundColor: string;
	containerBackgroundColor: string;
	cardBackgroundColor: string;
	borderColor: string;
	textColor: string;
	mutedColor: string;
	logoUrl?: string | null;
	merchantName: string;
}

const DEFAULT_CONFIG = {
	textColor: '#111827',
	mutedColor: '#6b7280',
};

function adjustColorBrightness(hex: string, percent: number): string {
	const num = parseInt(hex.replace('#', ''), 16);
	const r = Math.max(0, Math.min(255, (num >> 16) + Math.round(2.55 * percent)));
	const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent)));
	const b = Math.max(0, Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent)));
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function EmailPreview({
	blocks,
	subject,
	templateType,
	primaryColor,
	backgroundColor,
	containerBackgroundColor = '#ffffff',
	textColorMode = 'dark',
	merchantName,
	logoUrl,
	selectedBlockId,
	onBlockSelect,
	onBlockDelete,
	onBlockDuplicate,
}: EmailPreviewProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: 'canvas-drop-zone',
	});

	const textColor = textColorMode === 'light' ? '#ffffff' : DEFAULT_CONFIG.textColor;
	const mutedColor = textColorMode === 'light' ? 'rgba(255,255,255,0.7)' : DEFAULT_CONFIG.mutedColor;
	const cardBgColor = adjustColorBrightness(containerBackgroundColor, -3);
	const borderColor = adjustColorBrightness(containerBackgroundColor, -10);

	const config: EmailRenderConfig = {
		primaryColor: primaryColor || '#6366f1',
		backgroundColor: backgroundColor || '#f4f4f5',
		containerBackgroundColor,
		cardBackgroundColor: cardBgColor,
		borderColor,
		textColor,
		mutedColor,
		logoUrl,
		merchantName: merchantName || 'Minha Loja',
	};

	const variables = getPreviewVariables(templateType);
	const sortedBlocks = blocks;

	return (
		<div className="overflow-hidden rounded-lg border border-border bg-surface">
			<div className="border-b border-border bg-muted/5 px-4 py-3">
				<p className="text-xs text-muted">Assunto: {subject || 'Atualização do seu pedido'}</p>
			</div>
			<div
				ref={setNodeRef}
				className={`min-h-96 transition-colors ${isOver ? 'bg-accent/5' : 'bg-transparent'}`}
				style={{ backgroundColor: config.backgroundColor }}
			>
				{sortedBlocks.length === 0 ? (
					<div className="flex min-h-96 flex-col items-center justify-center gap-2 text-center text-muted">
						<div className="text-4xl">📧</div>
						<p className="text-sm font-medium">Arraste blocos aqui</p>
						<p className="text-xs">Construa seu email arrastando blocos da paleta</p>
					</div>
				) : (
					<div className="p-6">
						<table
							role="presentation"
							width="100%"
							cellSpacing={0}
							cellPadding={0}
							style={{ backgroundColor: config.backgroundColor }}
						>
							<tbody>
								<tr>
									<td align="center" style={{ padding: '40px 20px' }}>
										<table
											role="presentation"
											width="600"
											cellSpacing={0}
											cellPadding={0}
											style={{
												maxWidth: '600px',
												width: '100%',
												backgroundColor: containerBackgroundColor,
												borderRadius: '8px',
												boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
											}}
										>
											<tbody>
												<tr>
													<td style={{ padding: 0 }}>
														<SortableContext items={sortedBlocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
															<div className="flex flex-col gap-2">
																{sortedBlocks.map((block) => (
																	<SortablePreviewBlock
																		key={block.id}
																		block={block}
																		isSelected={selectedBlockId === block.id}
																		onSelect={() => onBlockSelect(block.id)}
																		onDelete={() => onBlockDelete(block.id)}
																		onDuplicate={() => onBlockDuplicate(block.id)}
																		variables={variables}
																		config={config}
																	/>
																))}
															</div>
														</SortableContext>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

interface SortablePreviewBlockProps {
	block: EmailBlock;
	isSelected: boolean;
	onSelect: () => void;
	onDelete: () => void;
	onDuplicate: () => void;
	variables: Record<string, string>;
	config: EmailRenderConfig;
}

function SortablePreviewBlock({
	block,
	isSelected,
	onSelect,
	onDelete,
	onDuplicate,
	variables,
	config,
}: SortablePreviewBlockProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: block.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	};

	const html = renderBlockHtml(block, variables, config);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`group relative rounded-md ring-1 ring-inset transition-shadow ${
				isSelected ? 'ring-accent' : 'ring-transparent hover:ring-border'
			}`}
		>
			<div
				{...attributes}
				{...listeners}
				onClick={onSelect}
				className="cursor-grab active:cursor-grabbing"
			>
				<div dangerouslySetInnerHTML={{ __html: html }} />
			</div>
			<div
				className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
				onPointerDown={(event) => event.stopPropagation()}
				onClick={(event) => event.stopPropagation()}
			>
				<Button isIconOnly size="sm" variant="tertiary" onPress={onDuplicate}>
					<Icon icon={Copy01Icon} className="icon-xs" />
				</Button>
				<Button isIconOnly size="sm" variant="tertiary" className="text-dange" onPress={onDelete}>
					<Icon icon={Delete02Icon} className="icon-xs" />
				</Button>
			</div>
		</div>
	);
}

function renderBlockHtml(block: EmailBlock, variables: Record<string, string>, config: EmailRenderConfig): string {
	const html = renderBlock(block, config);
	return replaceVariables(html, variables);
}

function renderBlock(block: EmailBlock, config: EmailRenderConfig): string {
	switch (block.type) {
		case EmailBlockType.Header:
			return renderHeaderBlock(block, config);
		case EmailBlockType.Text:
			return renderTextBlock(block, config);
		case EmailBlockType.Button:
			return renderButtonBlock(block, config);
		case EmailBlockType.Image:
			return renderImageBlock(block);
		case EmailBlockType.ProductList:
			return renderProductListBlock(config);
		case EmailBlockType.DigitalItemsList:
			return renderDigitalItemsListBlock(config);
		case EmailBlockType.TrackingInfo:
			return renderTrackingInfoBlock(block, config);
		case EmailBlockType.Divider:
			return renderDividerBlock(block, config);
		case EmailBlockType.Spacer:
			return renderSpacerBlock(block);
		case EmailBlockType.Footer:
			return renderFooterBlock(block, config);
		case EmailBlockType.Columns:
			return renderColumnsBlock(block, config);
		case EmailBlockType.OrderSummary:
			return renderOrderSummaryBlock(config);
		case EmailBlockType.Banner:
			return renderBannerBlock(block);
		default:
			return '';
	}
}

function renderHeaderBlock(block: EmailBlock, config: EmailRenderConfig): string {
	const settings = block.settings ?? {};
	const textColor = settings.textColor ?? config.textColor;
	const fontSize = settings.fontSize ?? 24;
	const textAlign = getTextAlign(settings.textAlign);
	const content = block.content ?? '';
	const fontWeight = settings.bold ? '700' : '600';
	const fontStyle = settings.italic ? 'italic' : 'normal';
	const logoHtml = config.logoUrl
		? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 30px 40px 20px 40px;">
                    <img src="${escapeHtml(config.logoUrl)}" alt="${escapeHtml(config.merchantName)}" style="max-width: 180px; max-height: 60px; height: auto;">
                </td>
            </tr>
        </table>`
		: '';

	return `${logoHtml}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td align="${textAlign}" style="padding: 20px 40px;">
            <h1 style="margin: 0; color: ${textColor}; font-size: ${fontSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; line-height: 1.3;">
                ${escapeHtml(content)}
            </h1>
        </td>
    </tr>
</table>`;
}

function renderTextBlock(block: EmailBlock, config: EmailRenderConfig): string {
	const settings = block.settings ?? {};
	const textColor = settings.textColor ?? config.mutedColor;
	const fontSize = settings.fontSize ?? 16;
	const textAlign = getTextAlign(settings.textAlign);
	const content = escapeHtml(block.content ?? '').replace(/\n/g, '<br>');
	const fontWeight = settings.bold ? '700' : '400';
	const fontStyle = settings.italic ? 'italic' : 'normal';

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td align="${textAlign}" style="padding: 10px 40px;">
            <p style="margin: 0; color: ${textColor}; font-size: ${fontSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; line-height: 1.6;">
                ${content}
            </p>
        </td>
    </tr>
</table>`;
}

function renderButtonBlock(block: EmailBlock, config: EmailRenderConfig): string {
	const settings = block.settings ?? {};
	const buttonUrl = settings.buttonUrl ?? '#';
	const buttonColor = settings.buttonBackgroundColor ?? config.primaryColor;
	const buttonTextColor = settings.buttonTextColor ?? '#ffffff';
	const content = block.content ?? 'Clique aqui';
	const textAlign = getTextAlign(settings.textAlign);

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td align="${textAlign}" style="padding: 20px 40px;">
            <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="border-radius: 6px; background-color: ${buttonColor};">
                        <a href="${escapeHtml(buttonUrl)}" target="_blank" style="display: inline-block; padding: 14px 28px; color: ${buttonTextColor}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                            ${escapeHtml(content)}
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`;
}

function renderImageBlock(block: EmailBlock): string {
	const settings = block.settings ?? {};
	const imageUrl = settings.imageUrl ?? block.content ?? '';
	const imageAlt = settings.imageAlt ?? 'Imagem';
	const imageWidth = settings.imageWidth ?? '100%';
	const textAlign = getTextAlign(settings.textAlign);

	if (!imageUrl) {
		return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td align="${textAlign}" style="padding: 20px 40px;">
            <div style="width: 100%; min-height: 120px; background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 14px; text-align: center; padding: 40px 20px;">📷 Adicione uma URL de imagem nas configurações</p>
            </div>
        </td>
    </tr>
</table>`;
	}

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td align="${textAlign}" style="padding: 20px 40px;">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" style="max-width: ${imageWidth}; height: auto; border-radius: 8px;">
        </td>
    </tr>
</table>`;
}

function renderBannerBlock(block: EmailBlock): string {
	const settings = block.settings ?? {};
	const imageUrl = settings.imageUrl ?? block.content ?? '';
	const imageAlt = settings.imageAlt ?? 'Banner';

	if (!imageUrl) {
		return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 0;">
            <div style="width: 100%; min-height: 120px; background-color: #f3f4f6; border: 2px dashed #d1d5db; display: flex; align-items: center; justify-content: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 14px; text-align: center; padding: 40px 20px;">🖼️ Adicione uma URL de banner nas configurações</p>
            </div>
        </td>
    </tr>
</table>`;
	}

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 0;">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" style="display: block; width: 100%; height: auto;">
        </td>
    </tr>
</table>`;
}

function renderProductListBlock(config: EmailRenderConfig): string {
	const previewItems = getPreviewProductListHtml(config);

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 20px 40px;">
			<div style="background-color: ${config.cardBackgroundColor}; border-radius: 8px; padding: 20px; border: 1px solid ${config.borderColor}; color: ${config.textColor};">
                <p style="color: ${config.primaryColor}; font-weight: 600; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    Itens do Pedido
                </p>
				${previewItems}
            </div>
        </td>
    </tr>
</table>`;
}

function renderDigitalItemsListBlock(config: EmailRenderConfig): string {
	const previewItems = getPreviewDigitalItemsHtml(config);

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 20px 40px;">
			<div style="background-color: ${config.cardBackgroundColor}; border-radius: 8px; padding: 20px; border: 1px solid ${config.borderColor}; color: ${config.textColor};">
                <p style="color: ${config.primaryColor}; font-weight: 600; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    Seus Itens Digitais
                </p>
				${previewItems}
            </div>
        </td>
    </tr>
</table>`;
}

function renderTrackingInfoBlock(block: EmailBlock, config: EmailRenderConfig): string {
	const title = block.content ?? 'Informações de Rastreio';

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 20px 40px;">
			<div style="background-color: ${config.primaryColor}10; border: 2px solid ${config.primaryColor}30; border-radius: 8px; padding: 20px; color: ${config.textColor};">
				<p style="color: ${config.primaryColor}; font-weight: 600; font-size: 14px; margin: 0 0 6px 0;">
                    ${escapeHtml(title)}
                </p>
				<span style="display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: 600; color: #a16207; background-color: #fef3c7; border-radius: 999px; margin: 0 0 12px 0;">
					Em breve
				</span>
                <p style="color: ${config.textColor}; font-size: 14px; margin: 0 0 5px 0;">
                    <strong>Transportadora:</strong> [[carrier_name]]
                </p>
                <p style="color: ${config.textColor}; font-size: 14px; margin: 0 0 15px 0;">
                    <strong>Código:</strong> <code style="background-color: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">[[tracking_code]]</code>
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="border-radius: 6px; background-color: ${config.primaryColor};">
                            <a href="[[tracking_url]]" target="_blank" style="display: inline-block; padding: 10px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                                Rastrear Pedido
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
        </td>
    </tr>
</table>`;
}

function renderDividerBlock(block: EmailBlock, config: EmailRenderConfig): string {
	const settings = block.settings ?? {};
	const dividerColor = settings.dividerColor ?? config.borderColor;
	const dividerThickness = settings.dividerThickness ?? 1;

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 20px 40px;">
            <hr style="border: none; border-top: ${dividerThickness}px solid ${dividerColor}; margin: 0;">
        </td>
    </tr>
</table>`;
}

function renderSpacerBlock(block: EmailBlock): string {
	const settings = block.settings ?? {};
	const spacerHeight = settings.spacerHeight ?? 20;

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="height: ${spacerHeight}px; font-size: 1px; line-height: 1px;">&nbsp;</td>
    </tr>
</table>`;
}

function renderFooterBlock(block: EmailBlock, config: EmailRenderConfig): string {
	const settings = block.settings ?? {};
	const content = block.content ?? `© ${new Date().getFullYear()} ${config.merchantName}. Todos os direitos reservados.`;
	const textColor = settings.textColor ?? config.mutedColor;
	const textAlign = getTextAlign(settings.textAlign ?? EmailTextAlignment.Center);

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 30px 40px; border-top: 1px solid ${config.borderColor};">
            <p style="margin: 0; color: ${textColor}; font-size: 13px; text-align: ${textAlign}; line-height: 1.5;">
                ${escapeHtml(content)}
            </p>
        </td>
    </tr>
</table>`;
}

function renderColumnsBlock(block: EmailBlock, config: EmailRenderConfig): string {
	const settings = block.settings ?? {};
	const columns = settings.columns ?? [];

	if (columns.length === 0) return '';

	const columnWidth = Math.floor(100 / columns.length);
	const columnHtml = columns
		.map((column) => renderColumn(column, config, columnWidth))
		.join('');

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 20px 40px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    ${columnHtml}
                </tr>
            </table>
        </td>
    </tr>
</table>`;
}

function renderColumn(column: EmailBlockColumn, config: EmailRenderConfig, defaultWidth: number): string {
	const width = defaultWidth;
	const columnBlocks = column.blocks
		.map((child) => stripOuterPadding(renderBlock(child, config)))
		.join('');

	return `
<td style="width: ${width}%; vertical-align: top; padding: 0 10px;">
    ${columnBlocks}
</td>`;
}

function renderOrderSummaryBlock(config: EmailRenderConfig): string {
	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="padding: 20px 40px;">
            <div style="background-color: ${config.cardBackgroundColor}; border-radius: 8px; padding: 20px; border: 1px solid ${config.borderColor};">
                <p style="color: ${config.textColor}; font-weight: 600; font-size: 16px; margin: 0 0 15px 0;">
                    Resumo do Pedido
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding: 8px 0; color: ${config.mutedColor}; font-size: 14px;">Subtotal</td>
                        <td align="right" style="padding: 8px 0; color: ${config.textColor}; font-size: 14px;">[[order_subtotal]]</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: ${config.mutedColor}; font-size: 14px;">Frete</td>
                        <td align="right" style="padding: 8px 0; color: ${config.textColor}; font-size: 14px;">[[order_shipping]]</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: ${config.mutedColor}; font-size: 14px;">Desconto</td>
                        <td align="right" style="padding: 8px 0; color: #10b981; font-size: 14px;">-[[order_discount]]</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 10px 0 0 0;">
                            <hr style="border: none; border-top: 1px solid ${config.borderColor}; margin: 0;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0 0 0; color: ${config.textColor}; font-size: 16px; font-weight: 700;">Total</td>
                        <td align="right" style="padding: 10px 0 0 0; color: ${config.textColor}; font-size: 16px; font-weight: 700;">[[order_total]]</td>
                    </tr>
                </table>
            </div>
        </td>
    </tr>
</table>`;
}

function getPreviewProductListHtml(config: EmailRenderConfig): string {
	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
	<tr>
		<td style="padding: 12px 0; border-bottom: 1px solid ${config.borderColor};">
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
				<tr>
					<td style="width: 64px; padding-right: 12px;">
						<div style="width: 56px; height: 56px; border-radius: 8px; background-color: ${config.borderColor}; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">
							Foto
						</div>
					</td>
					<td style="vertical-align: top;">
						<p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: ${config.textColor};">Camiseta Premium</p>
						<p style="margin: 0; font-size: 12px; color: ${config.mutedColor};">Tamanho M • Cor Preta</p>
						<p style="margin: 6px 0 0 0; font-size: 12px; color: ${config.mutedColor};">Quantidade: 1</p>
					</td>
					<td align="right" style="vertical-align: top;">
						<p style="margin: 0; font-size: 14px; font-weight: 600; color: ${config.textColor};">R$ 89,90</p>
					</td>
				</tr>
			</table>
		</td>
	</tr>
	<tr>
		<td style="padding: 12px 0;">
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
				<tr>
					<td style="width: 64px; padding-right: 12px;">
						<div style="width: 56px; height: 56px; border-radius: 8px; background-color: ${config.borderColor}; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">
							Foto
						</div>
					</td>
					<td style="vertical-align: top;">
						<p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: ${config.textColor};">Tênis Runner</p>
						<p style="margin: 0; font-size: 12px; color: ${config.mutedColor};">Tamanho 42</p>
						<p style="margin: 6px 0 0 0; font-size: 12px; color: ${config.mutedColor};">Quantidade: 2</p>
					</td>
					<td align="right" style="vertical-align: top;">
						<p style="margin: 0; font-size: 14px; font-weight: 600; color: ${config.textColor};">R$ 209,90</p>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>`;
}

function getPreviewDigitalItemsHtml(config: EmailRenderConfig): string {
	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
	<tr>
		<td style="padding: 12px 0; border-bottom: 1px solid ${config.borderColor};">
			<p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: ${config.textColor};">Curso Completo de Marketing</p>
			<p style="margin: 0 0 8px 0; font-size: 12px; color: ${config.mutedColor};">Acesso imediato ao portal do curso.</p>
			<p style="margin: 0; font-size: 12px; color: ${config.textColor};">
				<strong>Link:</strong> <span style="color: ${config.primaryColor};">https://minhaloja.com/acesso/abc123</span>
			</p>
		</td>
	</tr>
	<tr>
		<td style="padding: 12px 0;">
			<p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: ${config.textColor};">Chave de Ativacao</p>
			<p style="margin: 0 0 8px 0; font-size: 12px; color: ${config.mutedColor};">Use a chave abaixo para liberar o produto.</p>
			<p style="margin: 0; font-size: 13px; font-family: monospace; background-color: ${config.containerBackgroundColor}; padding: 8px 10px; border-radius: 6px; border: 1px solid ${config.borderColor}; display: inline-block;">
				KEY-9F3J-82LK-PP21
			</p>
		</td>
	</tr>
</table>`;
}

function getTextAlign(alignment?: EmailTextAlignment | null): string {
	switch (alignment) {
		case EmailTextAlignment.Center:
			return 'center';
		case EmailTextAlignment.Right:
			return 'right';
		default:
			return 'left';
	}
}

function replaceVariables(html: string, variables: Record<string, string>): string {
	let updated = html;
	Object.entries(variables).forEach(([key, value]) => {
		updated = updated.replaceAll(`[[${key}]]`, escapeHtml(value));
	});
	return updated;
}

function stripOuterPadding(html: string): string {
	return html
		.replace('padding: 20px 40px;', 'padding: 10px 0;')
		.replace('padding: 10px 40px;', 'padding: 5px 0;')
		.replace('padding: 30px 40px;', 'padding: 15px 0;');
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function getPreviewVariables(templateType: MerchantEmailTemplateType): Record<string, string> {
	const common: Record<string, string> = {
		customer_name: 'João Silva',
		customer_email: 'joao.silva@exemplo.com',
		merchant_name: 'Minha Loja',
		merchant_logo: 'https://placehold.co/180x60?text=Logo',
		order_number: '#12345',
		order_date: new Date().toLocaleString('pt-BR'),
		order_total: 'R$ 199,90',
		order_subtotal: 'R$ 179,90',
		order_shipping: 'R$ 25,00',
		order_discount: 'R$ 5,00',
		payment_method: 'PIX',
		support_email: 'suporte@minhaloja.com',
		support_phone: '(11) 99999-9999',
		store_url: 'https://minhaloja.com',
		product_list: 'Os itens do pedido serao exibidos aqui.',
		digital_items_list: 'Os itens digitais serao exibidos aqui.',
	};

	const templateSpecific: Record<string, Record<string, string>> = {
		[MerchantEmailTemplateType.DigitalDelivery]: {
			digital_items_list: 'Links de download e chaves serao exibidos aqui.',
		},
		[MerchantEmailTemplateType.OrderShipped]: {
			carrier_name: 'Correios - SEDEX',
			tracking_code: 'BR123456789BR',
			tracking_url: 'https://rastreamento.correios.com.br/app/index.php',
			estimated_delivery: '25/01/2026',
		},
		[MerchantEmailTemplateType.OrderDelivered]: {
			delivery_date: new Date().toLocaleString('pt-BR'),
		},
		[MerchantEmailTemplateType.Welcome]: {
			registration_date: new Date().toLocaleDateString('pt-BR'),
		},
		[MerchantEmailTemplateType.AbandonedCart]: {
			cart_items: 'Os itens do carrinho serao exibidos aqui.',
			cart_total: 'R$ 299,90',
			cart_items_count: '3',
			checkout_url: 'https://minhaloja.com/checkout/abc123',
		},
	};

	return {
		...common,
		...(templateSpecific[templateType] ?? {}),
	};
}
