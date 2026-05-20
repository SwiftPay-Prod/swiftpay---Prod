'use client';

import { useState } from 'react';
import { Button, Chip, Tooltip, Avatar } from '@heroui/react';
import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	Delete02Icon,
	PackageIcon,
	PencilEdit01Icon,
	Tag01Icon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';

// ============================================================
// DADOS DE EXEMPLO PARA DEMONSTRAÇÃO
// ============================================================

const mockCategories = [
	{ id: '1', name: 'Eletrônicos', status: 'Active', productCount: 12, createdAt: '2025-01-15T10:00:00Z' },
	{ id: '2', name: 'Roupas', status: 'Active', productCount: 8, createdAt: '2025-01-10T14:30:00Z' },
	{ id: '3', name: 'Acessórios', status: 'Inactive', productCount: 3, createdAt: '2025-01-05T09:15:00Z' },
];

const mockVariants = [
	{ id: '1', name: 'P - Azul', sku: 'CAM-P-AZL', price: 8990, stockQuantity: 25, status: 'Active', imageUrl: null },
	{ id: '2', name: 'M - Azul', sku: 'CAM-M-AZL', price: 8990, stockQuantity: 30, status: 'Active', imageUrl: null },
	{ id: '3', name: 'G - Azul', sku: 'CAM-G-AZL', price: 9990, stockQuantity: 0, status: 'OutOfStock', imageUrl: null },
	{ id: '4', name: 'P - Vermelho', sku: 'CAM-P-VRM', price: 8990, stockQuantity: 15, status: 'Active', imageUrl: null },
];

// ============================================================
// OPÇÃO 1: LISTA COM CARDS
// Cards separados com todas as informações visíveis
// ============================================================

function Option1Categories() {
	return (
		<div className="flex flex-col gap-3">
			{mockCategories.map((category) => (
				<div
					key={category.id}
					className="flex items-center justify-between p-4 rounded-xl bg-surface border border-divider hover:border-accent/30 transition-colors"
				>
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent">
							<Icon icon={Tag01Icon} className="icon-sm" />
						</div>
						<div className="flex flex-col">
							<span className="font-semibold text-foreground">{category.name}</span>
							<span className="text-xs text-muted">{category.productCount} produtos • Criado em {formatDate(category.createdAt)}</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Chip
							variant="soft"
							color={category.status === 'Active' ? 'success' : 'default'}
							size="sm"
						>
							{category.status === 'Active' ? 'Ativo' : 'Inativo'}
						</Chip>
						<Tooltip>
							<Button isIconOnly size="sm" variant="tertiary">
								<Icon icon={PencilEdit01Icon} className="icon-xs" />
								<Tooltip.Content>Editar</Tooltip.Content>
							</Button>
						</Tooltip>
						<Tooltip>
							<Button isIconOnly size="sm" variant="tertiary" className="text-danger">
								<Icon icon={Delete02Icon} className="icon-xs" />
								<Tooltip.Content>Excluir</Tooltip.Content>
							</Button>
						</Tooltip>
					</div>
				</div>
			))}
		</div>
	);
}

function Option1Variants() {
	return (
		<div className="flex flex-col gap-3">
			{mockVariants.map((variant) => (
				<div
					key={variant.id}
					className="flex items-center justify-between p-4 rounded-xl bg-surface border border-divider hover:border-accent/30 transition-colors"
				>
					<div className="flex items-center gap-3">
						<Avatar size="md" className="shrink-0">
							{variant.imageUrl ? (
								<Avatar.Image src={variant.imageUrl} alt={variant.name} />
							) : (
								<Avatar.Fallback className="bg-accent/10 text-accent">
									<Icon icon={PackageIcon} className="icon-sm" />
								</Avatar.Fallback>
							)}
						</Avatar>
						<div className="flex flex-col">
							<span className="font-semibold text-foreground">{variant.name}</span>
							<span className="text-xs text-muted">SKU: {variant.sku}</span>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex flex-col items-end">
							<span className="font-semibold text-foreground">{formatCurrency(variant.price)}</span>
							<span className="text-xs text-muted">{variant.stockQuantity} em estoque</span>
						</div>
						<Chip
							variant="soft"
							color={variant.status === 'Active' ? 'success' : variant.status === 'OutOfStock' ? 'danger' : 'default'}
							size="sm"
						>
							{variant.status === 'Active' ? 'Ativo' : variant.status === 'OutOfStock' ? 'Sem estoque' : 'Inativo'}
						</Chip>
						<div className="flex items-center gap-1">
							<Tooltip>
								<Button isIconOnly size="sm" variant="tertiary">
									<Icon icon={ViewIcon} className="icon-xs" />
									<Tooltip.Content>Visualizar</Tooltip.Content>
								</Button>
							</Tooltip>
							<Tooltip>
								<Button isIconOnly size="sm" variant="tertiary">
									<Icon icon={PencilEdit01Icon} className="icon-xs" />
									<Tooltip.Content>Editar</Tooltip.Content>
								</Button>
							</Tooltip>
							<Tooltip>
								<Button isIconOnly size="sm" variant="tertiary" className="text-danger">
									<Icon icon={Delete02Icon} className="icon-xs" />
									<Tooltip.Content>Excluir</Tooltip.Content>
								</Button>
							</Tooltip>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ============================================================
// OPÇÃO 2: LISTA INLINE
// Items mais compactos em linha com ações visíveis
// ============================================================

function Option2Categories() {
	return (
		<div className="flex flex-col divide-y divide-divider rounded-xl border border-divider overflow-hidden">
			{mockCategories.map((category) => (
				<div
					key={category.id}
					className="flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-secondary transition-colors"
				>
					<div className="flex items-center gap-3 min-w-0">
						<Icon icon={Tag01Icon} className="icon-sm text-accent shrink-0" />
						<span className="font-medium text-foreground truncate">{category.name}</span>
						<Chip variant="soft" color={category.status === 'Active' ? 'success' : 'default'} size="sm">
							{category.status === 'Active' ? 'Ativo' : 'Inativo'}
						</Chip>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-sm text-muted whitespace-nowrap">{category.productCount} produtos</span>
						<div className="flex items-center gap-1">
							<Button isIconOnly size="sm" variant="ghost">
								<Icon icon={PencilEdit01Icon} className="icon-xs" />
							</Button>
							<Button isIconOnly size="sm" variant="ghost" className="text-danger">
								<Icon icon={Delete02Icon} className="icon-xs" />
							</Button>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function Option2Variants() {
	return (
		<div className="flex flex-col divide-y divide-divider rounded-xl border border-divider overflow-hidden">
			{mockVariants.map((variant) => (
				<div
					key={variant.id}
					className="flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-secondary transition-colors"
				>
					<div className="flex items-center gap-3 min-w-0">
						<Avatar size="sm" className="shrink-0">
							<Avatar.Fallback className="bg-accent/10 text-accent">
								<Icon icon={PackageIcon} className="icon-xs" />
							</Avatar.Fallback>
						</Avatar>
						<div className="flex flex-col min-w-0">
							<span className="font-medium text-foreground truncate">{variant.name}</span>
							<span className="text-xs text-muted truncate">{variant.sku}</span>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<span className="font-medium text-foreground whitespace-nowrap">{formatCurrency(variant.price)}</span>
						<span className="text-sm text-muted whitespace-nowrap">{variant.stockQuantity} un</span>
						<Chip
							variant="soft"
							color={variant.status === 'Active' ? 'success' : variant.status === 'OutOfStock' ? 'danger' : 'default'}
							size="sm"
						>
							{variant.status === 'Active' ? 'Ativo' : variant.status === 'OutOfStock' ? 'Sem estoque' : 'Inativo'}
						</Chip>
						<div className="flex items-center gap-1">
							<Button isIconOnly size="sm" variant="ghost">
								<Icon icon={ViewIcon} className="icon-xs" />
							</Button>
							<Button isIconOnly size="sm" variant="ghost">
								<Icon icon={PencilEdit01Icon} className="icon-xs" />
							</Button>
							<Button isIconOnly size="sm" variant="ghost" className="text-danger">
								<Icon icon={Delete02Icon} className="icon-xs" />
							</Button>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ============================================================
// OPÇÃO 3: LISTA COMPACTA COM EXPANSÃO
// Items empilhados com expansão para detalhes
// ============================================================

function Option3Categories() {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-2">
			{mockCategories.map((category) => {
				const isExpanded = expandedId === category.id;
				return (
					<div
						key={category.id}
						className="rounded-xl border border-divider overflow-hidden bg-surface"
					>
						<button
							type="button"
							onClick={() => setExpandedId(isExpanded ? null : category.id)}
							className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface-secondary transition-colors text-left"
						>
							<div className="flex items-center gap-3">
								<Icon icon={Tag01Icon} className="icon-sm text-accent" />
								<span className="font-medium text-foreground">{category.name}</span>
								<Chip variant="soft" color={category.status === 'Active' ? 'success' : 'default'} size="sm">
									{category.status === 'Active' ? 'Ativo' : 'Inativo'}
								</Chip>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted">{category.productCount} produtos</span>
								{isExpanded ? (
									<Icon icon={ArrowUp01Icon} className="icon-sm text-muted" />
								) : (
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted" />
								)}
							</div>
						</button>
						{isExpanded && (
							<div className="px-4 py-3 border-t border-divider bg-surface-secondary">
								<div className="flex items-center justify-between">
									<div className="flex flex-col gap-1">
										<span className="text-xs text-muted">Criado em</span>
										<span className="text-sm text-foreground">{formatDate(category.createdAt)}</span>
									</div>
									<div className="flex items-center gap-2">
										<Button size="sm" variant="secondary">
											<Icon icon={PencilEdit01Icon} className="icon-xs" />
											Editar
										</Button>
										<Button size="sm" variant="tertiary" className="text-danger">
											<Icon icon={Delete02Icon} className="icon-xs" />
											Excluir
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

function Option3Variants() {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-2">
			{mockVariants.map((variant) => {
				const isExpanded = expandedId === variant.id;
				return (
					<div
						key={variant.id}
						className="rounded-xl border border-divider overflow-hidden bg-surface"
					>
						<button
							type="button"
							onClick={() => setExpandedId(isExpanded ? null : variant.id)}
							className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface-secondary transition-colors text-left"
						>
							<div className="flex items-center gap-3">
								<Avatar size="sm" className="shrink-0">
									<Avatar.Fallback className="bg-accent/10 text-accent">
										<Icon icon={PackageIcon} className="icon-xs" />
									</Avatar.Fallback>
								</Avatar>
								<span className="font-medium text-foreground">{variant.name}</span>
								<Chip
									variant="soft"
									color={variant.status === 'Active' ? 'success' : variant.status === 'OutOfStock' ? 'danger' : 'default'}
									size="sm"
								>
									{variant.status === 'Active' ? 'Ativo' : variant.status === 'OutOfStock' ? 'Sem estoque' : 'Inativo'}
								</Chip>
							</div>
							<div className="flex items-center gap-2">
								<span className="font-medium text-foreground">{formatCurrency(variant.price)}</span>
								{isExpanded ? (
									<Icon icon={ArrowUp01Icon} className="icon-sm text-muted" />
								) : (
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted" />
								)}
							</div>
						</button>
						{isExpanded && (
							<div className="px-4 py-3 border-t border-divider bg-surface-secondary">
								<div className="flex items-center justify-between">
									<div className="flex gap-6">
										<div className="flex flex-col gap-1">
											<span className="text-xs text-muted">SKU</span>
											<span className="text-sm font-mono text-foreground">{variant.sku}</span>
										</div>
										<div className="flex flex-col gap-1">
											<span className="text-xs text-muted">Estoque</span>
											<span className="text-sm text-foreground">{variant.stockQuantity} unidades</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button size="sm" variant="secondary">
											<Icon icon={ViewIcon} className="icon-xs" />
											Ver
										</Button>
										<Button size="sm" variant="secondary">
											<Icon icon={PencilEdit01Icon} className="icon-xs" />
											Editar
										</Button>
										<Button size="sm" variant="tertiary" className="text-danger">
											<Icon icon={Delete02Icon} className="icon-xs" />
											Excluir
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ============================================================
// COMPONENTE DE DEMONSTRAÇÃO
// ============================================================

export function ListOptionsDemo() {
	const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

	return (
		<div className="flex flex-col gap-8 p-6">
			{/* Tabs para trocar entre opções */}
			<div className="flex items-center gap-2">
				<Button
					variant={activeTab === 1 ? 'primary' : 'secondary'}
					onPress={() => setActiveTab(1)}
				>
					Opção 1: Cards
				</Button>
				<Button
					variant={activeTab === 2 ? 'primary' : 'secondary'}
					onPress={() => setActiveTab(2)}
				>
					Opção 2: Inline
				</Button>
				<Button
					variant={activeTab === 3 ? 'primary' : 'secondary'}
					onPress={() => setActiveTab(3)}
				>
					Opção 3: Compacta
				</Button>
			</div>

			{/* Categorias */}
			<div className="flex flex-col gap-4">
				<h2 className="text-lg font-bold text-foreground">Categorias</h2>
				{activeTab === 1 && <Option1Categories />}
				{activeTab === 2 && <Option2Categories />}
				{activeTab === 3 && <Option3Categories />}
			</div>

			{/* Variantes */}
			<div className="flex flex-col gap-4">
				<h2 className="text-lg font-bold text-foreground">Variantes</h2>
				{activeTab === 1 && <Option1Variants />}
				{activeTab === 2 && <Option2Variants />}
				{activeTab === 3 && <Option3Variants />}
			</div>
		</div>
	);
}

export default ListOptionsDemo;

