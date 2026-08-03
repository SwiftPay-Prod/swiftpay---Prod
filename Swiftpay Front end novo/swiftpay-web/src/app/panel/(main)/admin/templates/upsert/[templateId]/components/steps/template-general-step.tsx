import {
	Chip,
	Input,
	Label,
	ListBox,
	Select,
	TextArea,
	TextField,
} from '@heroui/react';
import { File01Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import {
	checkoutTemplateTypeOptions,
	checkoutTemplateTypeParse,
	mapParseColorToChipColor,
} from '@/parse';
import { CheckoutTemplateType } from '@/types/enums';

interface TemplateGeneralStepProps {
	isEditMode: boolean;
	code: string;
	onCodeChange: (value: string) => void;
	name: string;
	onNameChange: (value: string) => void;
	selectedType: CheckoutTemplateType | null;
	onSelectedTypeChange: (value: CheckoutTemplateType | null) => void;
	isActive: boolean;
	onIsActiveChange: (value: boolean) => void;
	shortDescription: string;
	onShortDescriptionChange: (value: string) => void;
	fullDescription: string;
	onFullDescriptionChange: (value: string) => void;
	bestFor: string;
	onBestForChange: (value: string) => void;
	features: string;
	onFeaturesChange: (value: string) => void;
	defaultExpanded: boolean;
}

export function TemplateGeneralStep({
	isEditMode,
	code,
	onCodeChange,
	name,
	onNameChange,
	selectedType,
	onSelectedTypeChange,
	isActive,
	onIsActiveChange,
	shortDescription,
	onShortDescriptionChange,
	fullDescription,
	onFullDescriptionChange,
	bestFor,
	onBestForChange,
	features,
	onFeaturesChange,
	defaultExpanded,
}: TemplateGeneralStepProps) {
	return (
		<div className="flex flex-col gap-4">
			<SystemAccordion
				id="template-basic-information"
				icon={File01Icon}
				color="accent"
				title="Informações básicas"
				summary="Dados principais do template"
				defaultExpanded={defaultExpanded}
			>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField variant="secondary" aria-label="Código" isRequired={!isEditMode}>
						<Label>Código</Label>
						<Input
							variant="secondary"
							placeholder="modern-checkout"
							value={code}
							onChange={(event) => onCodeChange(event.target.value)}
						/>
						<p className="mt-1 text-xs text-muted">Apenas letras minúsculas, números e hífens</p>
					</TextField>

					<TextField variant="secondary" aria-label="Nome" isRequired>
						<Label>Nome</Label>
						<Input
							variant="secondary"
							placeholder="Nome do template..."
							value={name}
							onChange={(event) => onNameChange(event.target.value)}
						/>
					</TextField>
				</div>

				<div className="flex flex-col gap-2">
					<Label isRequired>Tipo do template</Label>
					<Select
						variant="secondary"
						aria-label="Tipo"
						placeholder="Selecione o tipo"
						value={selectedType}
						onChange={(key) => onSelectedTypeChange(key as CheckoutTemplateType)}
					>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{checkoutTemplateTypeOptions.map((option) => {
									const typeParse = checkoutTemplateTypeParse[option.value];

									return (
										<ListBox.Item key={option.value} id={option.value} textValue={option.label}>
											<div className="flex flex-col gap-1">
												<Chip
													size="sm"
													variant="soft"
													color={mapParseColorToChipColor(typeParse.color)}
													className="gap-1"
												>
													{typeParse.icon}
													{option.label}
												</Chip>
												<span className="text-xs text-muted">{typeParse.description}</span>
											</div>
											<ListBox.ItemIndicator />
										</ListBox.Item>
									);
								})}
							</ListBox>
						</Select.Popover>
					</Select>

					{selectedType && (
						<p className="rounded-lg bg-content1 p-3 text-xs text-muted">
							{selectedType === CheckoutTemplateType.SingleOrder && (
								<>
									O tipo <strong>Pedido Único</strong> tem expiração e os produtos já vêm pré-definidos no checkout.
									Ideal para vendas únicas e links temporários.
								</>
							)}
							{selectedType === CheckoutTemplateType.Catalog && (
								<>
									O tipo <strong>Catálogo</strong> é um link fixo onde o cliente escolhe os produtos antes de
									prosseguir para o pagamento. Funciona como uma mini loja.
								</>
							)}
							{selectedType === CheckoutTemplateType.Transparent && (
								<>
									O tipo <strong>Transparente</strong> é controlado via API pelo merchant.
								</>
							)}
						</p>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<Label>Status do template</Label>
					<Select
						variant="secondary"
						aria-label="Status"
						placeholder="Selecione o status"
						value={isActive ? 'active' : 'inactive'}
						onChange={(key) => onIsActiveChange(key === 'active')}
					>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item key="active" id="active" textValue="Ativo">
									<Chip size="sm" variant="soft" color="success">
										Ativo
									</Chip>
									<ListBox.ItemIndicator />
								</ListBox.Item>
								<ListBox.Item key="inactive" id="inactive" textValue="Inativo">
									<Chip size="sm" variant="soft" color="default">
										Inativo
									</Chip>
									<ListBox.ItemIndicator />
								</ListBox.Item>
							</ListBox>
						</Select.Popover>
					</Select>
					<p className="text-xs text-muted">Templates inativos não aparecem para seleção</p>
				</div>
			</SystemAccordion>

			<SystemAccordion
				id="template-basic-descriptions"
				icon={File01Icon}
				color="blue"
				title="Descrições e apresentação"
				summary="Textos exibidos para o merchant"
				defaultExpanded={defaultExpanded}
			>
				<TextField variant="secondary" aria-label="Descrição curta">
					<Label>Descrição curta (até 200 caracteres)</Label>
					<Input
						variant="secondary"
						placeholder="Uma descrição breve do template..."
						maxLength={200}
						value={shortDescription}
						onChange={(event) => onShortDescriptionChange(event.target.value)}
					/>
				</TextField>

				<TextField variant="secondary" aria-label="Descrição completa">
					<Label>Descrição completa (opcional)</Label>
					<TextArea
						variant="secondary"
						placeholder="Descrição detalhada do template..."
						rows={4}
						value={fullDescription}
						onChange={(event) => onFullDescriptionChange(event.target.value)}
					/>
				</TextField>

				<TextField variant="secondary" aria-label="Indicado para">
					<Label>Indicado para (opcional)</Label>
					<Input
						variant="secondary"
						placeholder="Lojas que vendem produtos físicos..."
						value={bestFor}
						onChange={(event) => onBestForChange(event.target.value)}
					/>
				</TextField>

				<TextField variant="secondary" aria-label="Recursos">
					<Label>Lista de recursos (um por linha)</Label>
					<TextArea
						variant="secondary"
						placeholder={'Design moderno\nResponsivo\nCarregamento rápido'}
						rows={4}
						value={features}
						onChange={(event) => onFeaturesChange(event.target.value)}
					/>
				</TextField>
			</SystemAccordion>
		</div>
	);
}
