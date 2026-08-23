'use client';

import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Accordion } from '@heroui/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

type IconName = ComponentProps<typeof Icon>['icon'];

const ACCORDION_COLOR_MAP: Record<string, string> = {
	accent: 'var(--accent)',
	success: 'var(--success)',
	emerald: 'var(--success)',
	teal: 'var(--success)',
	green: 'var(--success)',
	warning: 'var(--warning)',
	danger: 'var(--danger)',
	rose: 'var(--danger)',
	secondary: 'var(--secondary)',
	muted: 'rgba(255,255,255,0.45)',
};

function resolveAccordionColor(color?: string): string | undefined {
	if (!color) {
		return undefined;
	}

	return ACCORDION_COLOR_MAP[color.toLowerCase()] ?? color;
}

function buildColorMix(color: string, strength: number): string {
	return `color-mix(in srgb, ${color} ${strength}%, transparent)`;
}

interface SectionAccordionGroupProps {
	className?: string;
	children: ReactNode;
}

interface SectionAccordionCardProps {
	id: string;
	icon?: IconName;
	iconNode?: ReactNode;
	hideIcon?: boolean;
	title: ReactNode;
	summary?: ReactNode;
	endContent?: ReactNode;
	color?: string;
	defaultExpanded?: boolean;
	children: ReactNode;
	className?: string;
	accordionClassName?: string;
	itemClassName?: string;
	triggerClassName?: string;
	iconContainerClassName?: string;
	iconClassName?: string;
	summaryClassName?: string;
	bodyClassName?: string;
	indicatorIcon?: IconName;
	indicatorClassName?: string;
}

type SectionAccordionRootProps = ComponentProps<typeof Accordion>;

type SectionAccordionProps = SectionAccordionGroupProps | SectionAccordionCardProps | SectionAccordionRootProps;

function isSectionAccordionCardProps(props: SectionAccordionProps): props is SectionAccordionCardProps {
	return 'id' in props && 'title' in props;
}

function isSectionAccordionRootProps(props: SectionAccordionProps): props is SectionAccordionRootProps {
	return 'defaultExpandedKeys' in props || 'expandedKeys' in props || 'onExpandedChange' in props;
}

function SectionAccordionBase(props: SectionAccordionProps) {
	if (!isSectionAccordionCardProps(props)) {
		if (isSectionAccordionRootProps(props)) {
			const { children, ...accordionProps } = props;
			return <Accordion {...accordionProps}>{children}</Accordion>;
		}

		return <div className={props.className ?? 'flex flex-col gap-4'}>{props.children}</div>;
	}

	const {
		id,
		icon,
		iconNode,
		hideIcon = false,
		title,
		summary,
		endContent,
		color,
		defaultExpanded = true,
		children,
		accordionClassName = 'px-0',
		itemClassName = 'rounded-[20px] border border-white/12 bg-card overflow-hidden transition-all duration-200sm',
		triggerClassName = 'flex w-full items-center justify-between p-4 sm:p-5 hover:bg-white/[0.02] transition-colors cursor-pointer group text-left',
		iconContainerClassName = 'flex size-8 shrink-0 items-center justify-center rounded-lg border',
		summaryClassName = 'text-xs font-mono text-white/50 mt-0.5',
		iconClassName = 'icon-sm',
		bodyClassName = 'flex flex-col gap-4 p-4 sm:p-6 border-t border-white/8 bg-surface-deep/40',
		indicatorIcon = ArrowDown01Icon,
		indicatorClassName = 'icon-sm text-white/40 group-hover:text-white transition-transform duration-200',
	} = props;

	const resolvedColor = resolveAccordionColor(color) ?? 'var(--accent)';
	const iconContainerStyle: CSSProperties = {
		backgroundColor: buildColorMix(resolvedColor, 15),
	};
	const iconStyle: CSSProperties = {
		color: resolvedColor,
	};

	return (
		<Accordion
			key={id}
			className={accordionClassName}
			defaultExpandedKeys={defaultExpanded ? [id] : undefined}
		>
			<Accordion.Item id={id} className={itemClassName}>
				<Accordion.Heading>
					{endContent ? (
						<div className="flex items-center justify-between gap-2">
							<Accordion.Trigger className={`${triggerClassName} min-w-0 flex-1`}>
								<div className="flex items-center gap-3 min-w-0">
									{!hideIcon && (
										<div className={iconContainerClassName} style={iconContainerStyle}>
											{iconNode ?? (icon ? <Icon icon={icon} className={iconClassName} style={iconStyle} /> : null)}
										</div>
									)}
									<div className="flex flex-col items-start min-w-0 text-left">
										<span className="text-sm font-bold text-white tracking-tight">
											{title}
										</span>
										{summary && (
											<span className={summaryClassName}>
												{summary}
											</span>
										)}
									</div>
								</div>
								<Accordion.Indicator>
									<Icon icon={indicatorIcon} className={indicatorClassName} />
								</Accordion.Indicator>
							</Accordion.Trigger>
							<div
								className="pr-4 shrink-0"
								onClick={(event) => event.stopPropagation()}
								onMouseDown={(event) => event.stopPropagation()}
							>
								{endContent}
							</div>
						</div>
					) : (
						<Accordion.Trigger className={triggerClassName}>
							<div className="flex items-center gap-3 min-w-0">
								{!hideIcon && (
									<div className={iconContainerClassName} style={iconContainerStyle}>
										{iconNode ?? (icon ? <Icon icon={icon} className={iconClassName} style={iconStyle} /> : null)}
									</div>
								)}
								<div className="flex flex-col items-start min-w-0 text-left">
									<span className="text-sm font-bold text-white tracking-tight">
										{title}
									</span>
									{summary && (
										<span className={summaryClassName}>
											{summary}
										</span>
									)}
								</div>
							</div>
							<Accordion.Indicator>
								<Icon icon={indicatorIcon} className={indicatorClassName} />
							</Accordion.Indicator>
						</Accordion.Trigger>
					)}
				</Accordion.Heading>
				<Accordion.Panel>
					<Accordion.Body className={bodyClassName}>{children}</Accordion.Body>
				</Accordion.Panel>
			</Accordion.Item>
		</Accordion>
	);
}

type SectionAccordionComponent = typeof SectionAccordionBase & {
	Item: typeof Accordion.Item;
	Heading: typeof Accordion.Heading;
	Trigger: typeof Accordion.Trigger;
	Panel: typeof Accordion.Panel;
	Body: typeof Accordion.Body;
	Indicator: typeof Accordion.Indicator;
};

export const SectionAccordion = Object.assign(SectionAccordionBase, {
	Item: Accordion.Item,
	Heading: Accordion.Heading,
	Trigger: Accordion.Trigger,
	Panel: Accordion.Panel,
	Body: Accordion.Body,
	Indicator: Accordion.Indicator,
}) as SectionAccordionComponent;

export const SystemAccordion = SectionAccordion;
