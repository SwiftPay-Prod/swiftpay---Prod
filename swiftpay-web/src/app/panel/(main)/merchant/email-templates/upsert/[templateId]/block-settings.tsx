'use client';

import {
	TextField,
	Input,
	Label,
	Select,
	ListBox,
	NumberField,
	TextArea,
	Switch,
	Chip,
	ColorPicker,
	ColorArea,
	ColorSlider,
	ColorSwatch,
	ColorField,
	parseColor,
} from '@heroui/react';
import { emailBlockTypeParse } from '@/parse/email-block';
import type { EmailBlock } from '@/types/merchant/email-templates';
import { EmailBlockType, EmailTextAlignment } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import { AlignLeftIcon, AlignCenter, AlignRightIcon } from '@hugeicons/core-free-icons';
import { mapParseColorToChipColor } from '@/parse';

interface BlockSettingsProps {
	block: EmailBlock;
	onUpdate: (blockId: string, updates: Partial<EmailBlock>) => void;
	primaryColor?: string;
}

export function BlockSettings({ block, onUpdate, primaryColor = '#6366F1' }: BlockSettingsProps) {
	const parse = emailBlockTypeParse[block.type];

	function handleContentChange(content: string) {
		onUpdate(block.id, { content });
	}

	function handleSettingsChange(key: string, value: unknown) {
		onUpdate(block.id, {
			settings: {
				...block.settings,
				[key]: value,
			},
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3 border-b border-border pb-4">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
					{parse.icon}
				</div>
				<div>
					<h3 className="font-semibold">{parse.label}</h3>
					<p className="text-xs text-muted">{parse.description}</p>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				{renderBlockSettings(block, handleContentChange, handleSettingsChange, primaryColor)}
			</div>
		</div>
	);
}

function renderBlockSettings(
	block: EmailBlock,
	onContentChange: (content: string) => void,
	onSettingsChange: (key: string, value: unknown) => void,
	primaryColor: string
) {
	switch (block.type) {
		case EmailBlockType.Header:
			return (
				<>
					<TextField variant="secondary">
						<Label>Título do Cabeçalho</Label>
						<Input variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="Nome da empresa ou título"
						/>
					</TextField>
					<AlignmentSelect value={block.settings?.textAlign ?? EmailTextAlignment.Center} onChange={(v) => onSettingsChange('textAlign', v)} />
				</>
			);

		case EmailBlockType.Text:
			return (
				<>
					<TextField variant="secondary">
						<Label>Conteúdo do Texto</Label>
						<TextArea variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="Digite o texto..."
						/>
					</TextField>
					<AlignmentSelect value={block.settings?.textAlign ?? EmailTextAlignment.Left} onChange={(v) => onSettingsChange('textAlign', v)} />
				</>
			);

		case EmailBlockType.Button:
			return (
				<>
					<TextField variant="secondary">
						<Label>Texto do Botão</Label>
						<Input variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="Clique aqui"
						/>
					</TextField>
					<TextField variant="secondary">
						<Label>URL do Botão</Label>
						<Input variant="secondary"
							value={block.settings?.buttonUrl ?? ''}
							onChange={(e) => onSettingsChange('buttonUrl', e.target.value)}
							placeholder="https://..."
						/>
					</TextField>
					<ColorPickerField
						label="Cor do Botão"
						value={block.settings?.buttonBackgroundColor ?? primaryColor}
						onChange={(value) => onSettingsChange('buttonBackgroundColor', value)}
					/>
					<AlignmentSelect value={block.settings?.textAlign ?? EmailTextAlignment.Center} onChange={(v) => onSettingsChange('textAlign', v)} />
				</>
			);

		case EmailBlockType.Image:
			return (
				<>
					<TextField variant="secondary">
						<Label>URL da Imagem</Label>
						<Input variant="secondary"
							value={block.settings?.imageUrl ?? ''}
							onChange={(e) => onSettingsChange('imageUrl', e.target.value)}
							placeholder="https://..."
						/>
					</TextField>
					<TextField variant="secondary">
						<Label>Texto Alternativo</Label>
						<Input variant="secondary"
							value={block.settings?.imageAlt ?? ''}
							onChange={(e) => onSettingsChange('imageAlt', e.target.value)}
							placeholder="Descrição da imagem"
						/>
					</TextField>
					<AlignmentSelect value={block.settings?.textAlign ?? EmailTextAlignment.Center} onChange={(v) => onSettingsChange('textAlign', v)} />
				</>
			);

		case EmailBlockType.Banner:
			return (
				<>
					<TextField variant="secondary">
						<Label>URL da Imagem</Label>
						<Input variant="secondary"
							value={block.settings?.imageUrl ?? ''}
							onChange={(e) => onSettingsChange('imageUrl', e.target.value)}
							placeholder="https://..."
						/>
					</TextField>
					<TextField variant="secondary">
						<Label>Texto Alternativo</Label>
						<Input variant="secondary"
							value={block.settings?.imageAlt ?? ''}
							onChange={(e) => onSettingsChange('imageAlt', e.target.value)}
							placeholder="Descrição do banner"
						/>
					</TextField>
					<p className="text-xs text-muted">
						O banner ocupará a largura completa do email, sem margens laterais.
					</p>
				</>
			);

		case EmailBlockType.ProductList:
			return (
				<>
					<TextField variant="secondary">
						<Label>Título da Seção</Label>
						<Input variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="Produtos do Pedido"
						/>
					</TextField>
					<Switch isSelected={block.settings?.showPrices ?? true} onChange={(v) => onSettingsChange('showPrices', v)}>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Label className="text-sm">Mostrar preços</Label>
					</Switch>
					<Switch isSelected={block.settings?.showQuantity ?? true} onChange={(v) => onSettingsChange('showQuantity', v)}>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Label className="text-sm">Mostrar quantidade</Label>
					</Switch>
				</>
			);

		case EmailBlockType.DigitalItemsList:
			return (
				<>
					<TextField variant="secondary">
						<Label>Título da Seção</Label>
						<Input variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="Seus Itens Digitais"
						/>
					</TextField>
					<p className="text-xs text-muted">
						Este bloco exibirá automaticamente os itens digitais do pedido com links de download.
					</p>
				</>
			);

		case EmailBlockType.TrackingInfo:
			return (
				<>
					<TextField variant="secondary">
						<Label>Título da Seção</Label>
						<Input variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="Rastreamento do Pedido"
						/>
					</TextField>
					<div className="flex items-center gap-2">
						<Chip variant="soft" color="warning" className="opacity-70">
							Em breve
						</Chip>
						<p className="text-xs text-muted">Rastreamento ainda não está disponível.</p>
					</div>
				</>
			);

		case EmailBlockType.Divider:
			return (
				<>
					<ColorPickerField
						label="Cor do Divisor"
						value={block.settings?.dividerColor ?? '#E5E7EB'}
						onChange={(value) => onSettingsChange('dividerColor', value)}
					/>
					<NumberField variant="secondary"
						minValue={1}
						maxValue={10}
						value={block.settings?.dividerThickness ?? 1}
						onChange={(value) => onSettingsChange('dividerThickness', value)}
					>
						<Label>Altura (px)</Label>
						<Input variant="secondary" />
					</NumberField>
				</>
			);

		case EmailBlockType.Spacer:
			return (
				<NumberField variant="secondary"
					minValue={8}
					maxValue={100}
					value={block.settings?.spacerHeight ?? 24}
					onChange={(value) => onSettingsChange('spacerHeight', value)}
				>
					<Label>Altura (px)</Label>
					<Input variant="secondary" />
				</NumberField>
			);

		case EmailBlockType.Footer:
			return (
				<>
					<TextField variant="secondary">
						<Label>Texto do Rodapé</Label>
						<TextArea variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="© 2025 Sua Empresa..."
						/>
					</TextField>
					<AlignmentSelect value={block.settings?.textAlign ?? EmailTextAlignment.Center} onChange={(v) => onSettingsChange('textAlign', v)} />
				</>
			);

		case EmailBlockType.Columns:
			return (
				<p className="text-xs text-muted">
					Layout de colunas em breve. Por enquanto, use blocos em sequência vertical.
				</p>
			);

		case EmailBlockType.OrderSummary:
			return (
				<>
					<TextField variant="secondary">
						<Label>Título da Seção</Label>
						<Input variant="secondary"
							value={block.content ?? ''}
							onChange={(e) => onContentChange(e.target.value)}
							placeholder="Resumo do Pedido"
						/>
					</TextField>
					<p className="text-xs text-muted">
						Este bloco exibirá automaticamente subtotal, descontos e total do pedido.
					</p>
				</>
			);

		default:
			return (
				<p className="text-xs text-muted">
					Configurações não disponíveis para este tipo de bloco.
				</p>
			);
	}
}

interface ColorPickerFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
	return (
		<div className="flex flex-col gap-2">
			<Label>{label}</Label>
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

interface AlignmentOption {
	value: EmailTextAlignment;
	label: string;
	color: 'default' | 'accent' | 'secondary';
	icon: React.ReactNode;
}

const ALIGNMENT_OPTIONS: AlignmentOption[] = [
	{
		value: EmailTextAlignment.Left,
		label: 'Esquerda',
		color: 'default',
		icon: <Icon icon={AlignLeftIcon} className="icon-xs" />,
	},
	{
		value: EmailTextAlignment.Center,
		label: 'Centro',
		color: 'accent',
		icon: <Icon icon={AlignCenter} className="icon-xs" />,
	},
	{
		value: EmailTextAlignment.Right,
		label: 'Direita',
		color: 'secondary',
		icon: <Icon icon={AlignRightIcon} className="icon-xs" />,
	},
];

interface AlignmentSelectProps {
	value: EmailTextAlignment;
	onChange: (value: EmailTextAlignment) => void;
}

function AlignmentSelect({ value, onChange }: AlignmentSelectProps) {
	return (
		<Select variant="secondary" aria-label="Alinhamento" value={value} onChange={(key) => key && onChange(key as EmailTextAlignment)}>
			<Label>Alinhamento</Label>
			<Select.Trigger>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox>
					{ALIGNMENT_OPTIONS.map((option) => (
						<ListBox.Item id={option.value} key={option.value} textValue={option.label}>
							<Chip variant="soft" color={mapParseColorToChipColor(option.color)}>
								{option.icon}
								{option.label}
							</Chip>
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
