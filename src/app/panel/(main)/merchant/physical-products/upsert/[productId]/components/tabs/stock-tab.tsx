'use client';

import { TextField, Label, Input, Description, Switch, Button } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { PackageIcon, ArrowDownIcon, ArrowUpIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { SectionAccordion } from '@/components/ui/system-accordion';
import type { StockTabProps } from './types';

export function StockTab({
	isEditMode,
	isUnlimitedStock,
	setIsUnlimitedStock,
	stockQuantity,
	setStockQuantity,
	showMainStock,
	showVariantStock,
	variants,
	onOpenMainAdjustment,
	onOpenVariantAdjustment,
	disabled,
}: StockTabProps) {
	return (
		<div className="flex flex-col gap-6">
			<SectionAccordion
				id="stock-config"
				title="Configuração de Estoque"
				summary="Defina como o estoque será controlado"
				defaultExpanded
			>
				<div className="flex flex-col gap-6">
					<Switch
						isSelected={!isUnlimitedStock}
						onChange={(isSelected) => {
							setIsUnlimitedStock(!isSelected);
							if (!isSelected) {
								setStockQuantity(undefined);
							}
						}}
						isDisabled={disabled}
					>
						<div className="flex gap-3">
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<div className="flex flex-col gap-0.5">
								<Label className="text-sm">Controlar estoque</Label>
								<Description>Ative para limitar vendas pela quantidade disponível</Description>
							</div>
						</div>
					</Switch>
				</div>
			</SectionAccordion>

			{!isUnlimitedStock && showMainStock && (
				<SectionAccordion
					id="stock-main"
					title={isEditMode ? 'Estoque do Produto' : 'Quantidade Inicial'}
					summary={isEditMode ? 'Quantidade atual em estoque' : 'Defina a quantidade inicial disponível'}
					defaultExpanded
				>
					<div className="flex flex-col gap-6">
						{isEditMode && !disabled ? (
							<div className="flex justify-end">
								<Button variant="secondary" size="sm" onPress={onOpenMainAdjustment}>
									<Icon icon={ArrowDownIcon} className="icon-xs text-success" />
									<Icon icon={ArrowUpIcon} className="icon-xs text-danger -ml-1" />
									Ajustar
								</Button>
							</div>
						) : null}

						{isEditMode ? (
							<div className="flex items-center justify-between rounded-lg bg-surface-deep p-4">
								<span className="text-sm text-muted">Quantidade disponível</span>
								<span className="text-2xl font-bold">{stockQuantity ?? 0}</span>
							</div>
						) : (
							<TextField variant="secondary" isDisabled={disabled}>
								<Label>Quantidade em Estoque</Label>
								<NumericFormat
									customInput={Input}
									placeholder="Informe a quantidade disponível"
									value={stockQuantity}
									onValueChange={(values) => setStockQuantity(values.floatValue)}
									allowNegative={false}
									decimalScale={0}
									disabled={disabled}
								/>
							</TextField>
						)}
					</div>
				</SectionAccordion>
			)}

			{!isUnlimitedStock && showVariantStock && isEditMode && (
				<SectionAccordion
					id="stock-variants"
					title="Estoque por Variante"
					summary="Gerencie o estoque de cada variante"
					defaultExpanded
				>
					<div className="flex flex-col gap-3">
						{variants.map((variant) => (
							<div
								key={variant.id}
								className="flex items-center justify-between rounded-lg border border-default p-4"
							>
								<div className="flex items-center gap-3">
									<div className="flex flex-col">
										<span className="font-medium">{variant.name}</span>
										{variant.sku && <span className="text-sm text-muted">SKU: {variant.sku}</span>}
									</div>
								</div>
								<div className="flex items-center gap-4">
									<span className="text-lg font-semibold">{variant.stockQuantity ?? 0}</span>
									{!disabled && (
										<Button variant="secondary" size="sm" onPress={() => onOpenVariantAdjustment(variant)}>
											Ajustar
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
				</SectionAccordion>
			)}

			{isUnlimitedStock && (
				<SectionAccordion
					id="stock-unlimited"
					title="Estoque ilimitado"
					summary="Controle de estoque desativado"
					defaultExpanded
				>
					<div className="flex items-center gap-4 rounded-lg bg-success/10 p-4">
						<Icon icon={PackageIcon} className="icon-lg text-success" />
						<div>
							<p className="font-medium text-success">Estoque ilimitado ativo</p>
							<p className="text-sm text-muted">
								Este produto não terá limite de quantidade para vendas até você ativar o controle de estoque.
							</p>
						</div>
					</div>
				</SectionAccordion>
			)}
		</div>
	);
}
