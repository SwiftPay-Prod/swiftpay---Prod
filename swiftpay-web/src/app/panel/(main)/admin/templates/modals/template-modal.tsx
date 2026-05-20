'use client';

import { Suspense, use, useState } from 'react';
import { Modal, Button, Chip, Skeleton } from '@heroui/react';
import {
	Calendar03Icon,
	PaintBoardIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import {
	checkoutTemplateTypeParse,
	templateFreeParse,
	templateActiveStatusParse,
	mapParseColorToChipColor,
} from '@/parse';
import { FormattedDate } from '@/components/ui/formatted-date';
import type { AdminTemplateData } from '@/types/admin/templates';
import type { ApiResponse } from '@/types/common';
import { TemplateGeneralTab } from './tabs/template-general-tab';
import { TemplateContentTab } from './tabs/template-content-tab';
import { TemplateResourcesTab } from './tabs/template-resources-tab';
import { TemplateKpisTab } from './tabs/template-kpis-tab';
import { formatTemplateFee } from './tabs/template-tab-shared';

export type TemplatePromise = Promise<ApiResponse<AdminTemplateData>>;

interface TemplateModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	templatePromise: TemplatePromise | null;
}

const TEMPLATE_TAB_ITEMS: InternalTabItem[] = [
	{ id: 'general', label: 'Geral' },
	{ id: 'content', label: 'Conteúdo' },
	{ id: 'resources', label: 'Recursos' },
	{ id: 'kpis', label: 'KPIs' },
];

function ContentSkeleton() {
	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={PaintBoardIcon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Detalhes do Template</Modal.Heading>
				<p className="text-sm text-muted">Carregando informações do template.</p>
			</Modal.Header>
			<Modal.Body>
				<div className="flex flex-col gap-4">
					<Skeleton className="h-8 w-full rounded-lg" />
					<Skeleton className="h-24 rounded-lg" />
					<Skeleton className="h-16 rounded-lg" />
					<Skeleton className="h-16 rounded-lg" />
					<Skeleton className="h-32 rounded-lg" />
				</div>
			</Modal.Body>
		</>
	);
}

interface ViewContentProps {
	templatePromise: TemplatePromise;
	onClose: () => void;
}

function ViewContent({ templatePromise, onClose }: ViewContentProps) {
	const response = use(templatePromise);
	const template = response?.data;
	const [selectedTab, setSelectedTab] = useState('general');

	if (!template) {
		return (
			<>
				<Modal.Header>
					<Modal.Icon className="bg-accent text-accent-foreground">
						<Icon icon={PaintBoardIcon} className="icon-md" />
					</Modal.Icon>
					<Modal.Heading>Detalhes do Template</Modal.Heading>
					<p className="text-sm text-muted">Não foi possível carregar os detalhes.</p>
				</Modal.Header>
				<Modal.Body>
					<div className="rounded-xl border border-danger-soft-hover bg-danger-soft p-3 text-sm text-danger">
						{response?.error?.message || 'Template não encontrado'}
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="tertiary" onPress={onClose}>
						Fechar
					</Button>
				</Modal.Footer>
			</>
		);
	}

	const typeParsed = checkoutTemplateTypeParse[template.type];
	const freeParsed = templateFreeParse[template.feeMode === null ? 'free' : 'paid'];
	const statusParsed = templateActiveStatusParse[template.isActive ? 'active' : 'inactive'];
	const formattedFee = formatTemplateFee(template);

	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={PaintBoardIcon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>{template.name}</Modal.Heading>
				<p className="text-sm text-muted">Visão completa, recursos e desempenho do template.</p>
			</Modal.Header>
			<Modal.Body>
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<Chip variant="soft" color={mapParseColorToChipColor(typeParsed.color)} size="sm" className="gap-1">
							{typeParsed.icon}
							{typeParsed.label}
						</Chip>
						<Chip variant="soft" color={mapParseColorToChipColor(freeParsed.color)} size="sm" className="gap-1">
							{freeParsed.icon}
							{freeParsed.label}
						</Chip>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
							{statusParsed.icon}
							{statusParsed.label}
						</Chip>
						<Chip variant="soft" color="default" size="sm" className="gap-1">
							<Icon icon={Calendar03Icon} className="icon-xs" />
							Criado em <FormattedDate date={template.createdAt} />
						</Chip>
					</div>

					<InternalTabs
						ariaLabel="Abas de detalhes do template"
						items={TEMPLATE_TAB_ITEMS}
						selectedKey={selectedTab}
						onSelectionChange={(key) => setSelectedTab(key as string)}
					/>

					{selectedTab === 'general' ? <TemplateGeneralTab template={template} formattedFee={formattedFee} /> : null}

					{selectedTab === 'content' ? <TemplateContentTab template={template} /> : null}

					{selectedTab === 'resources' ? <TemplateResourcesTab template={template} /> : null}

					{selectedTab === 'kpis' ? <TemplateKpisTab template={template} formattedFee={formattedFee} /> : null}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={onClose}>
					Fechar
				</Button>
			</Modal.Footer>
		</>
	);
}

export function TemplateModal({ isOpen, onOpenChange, templatePromise }: TemplateModalProps) {
	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl">
					<Modal.CloseTrigger />

					{templatePromise && (
						<Suspense fallback={<ContentSkeleton />}>
							<ViewContent templatePromise={templatePromise} onClose={handleClose} />
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
