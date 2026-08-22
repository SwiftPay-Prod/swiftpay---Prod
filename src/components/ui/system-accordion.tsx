'use client';

import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Accordion } from '@heroui/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

type IconName = ComponentProps<typeof Icon>['icon'];

const ACCORDION_COLOR_MAP: Record<string, string> = {
	accent: '#4f55f1',
	blue: '#60a5fa',
	sky: '#38bdf8',
	cyan: '#22d3ee',
	success: '#00a87e',
	emerald: '#00a87e',
	teal: '#00a87e',
	green: '#00a87e',
	warning: '#fbbf24',
	amber: '#f59e0b',
	orange: '#fb923c',
	secondary: '#c084fc',
	violet: '#a78bfa',
	indigo: '#818cf8',
	danger: '#f87171',
	rose: '#fb7185',
	red: '#f87171',
	fuchsia: '#e879f9',
	mauve: '#e2e8f0',
	slate: '#cbd5e1',
	default: '#e2e8f0',
	muted: '#94a3b8',
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

		return <div className={props.className ?? 'flex flex-col gap-3'}>{props.children}</div>;
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
		itemClassName = 'rounded-xl border border-divider bg-surface',
		triggerClassName = 'flex w-full items-center justify-between px-4 py-3',
		iconContainerClassName = 'flex size-10 items-center justify-center rounded-lg',
		iconClassName = 'icon-md',
		summaryClassName = 'text-xs',
		bodyClassName = 'flex flex-col gap-4 p-4',
		indicatorIcon = ArrowDown01Icon,
		indicatorClassName = 'icon-sm transition-transform duration-200',
	} = props;

	const resolvedColor = resolveAccordionColor(color);
	const iconContainerStyle: CSSProperties | undefined = resolvedColor
		? {
			backgroundColor: buildColorMix(resolvedColor, 14),
			border: `1px solid ${buildColorMix(resolvedColor, 24)}`,
		}
		: undefined;
	const coloredTextStyle: CSSProperties | undefined = resolvedColor ? { color: resolvedColor } : undefined;
	const indicatorStyle: CSSProperties | undefined = resolvedColor ? { color: resolvedColor, opacity: 0.72 } : undefined;
	const finalIconContainerClassName = resolvedColor
		? iconContainerClassName
		: `${iconContainerClassName} bg-accent/10`;
	const finalIconClassName = resolvedColor ? iconClassName : `${iconClassName} text-accent`;
	const finalSummaryClassName = `${summaryClassName} text-muted-foreground font-normal`;
	const finalIndicatorClassName = resolvedColor ? indicatorClassName : `${indicatorClassName} text-muted`;

	return (
		<Accordion
			key={id}
			className={accordionClassName}
			defaultExpandedKeys={defaultExpanded ? [id] : undefined}
		>
			<Accordion.Item id={id} className={itemClassName}>
				<Accordion.Heading>
					{endContent ? (
						<div className="flex items-center gap-2">
							<Accordion.Trigger className={`${triggerClassName} min-w-0 flex-1`}>
								<div className="flex items-center gap-3">
									{!hideIcon && (
										<div className={finalIconContainerClassName} style={iconContainerStyle}>
											{iconNode ?? (icon ? <Icon icon={icon} className={finalIconClassName} style={coloredTextStyle} /> : null)}
										</div>
									)}
									<div className="flex flex-col items-start">
										<span className="font-medium" style={coloredTextStyle}>
											{title}
										</span>
										{summary && (
											<span className={finalSummaryClassName}>
												{summary}
											</span>
										)}
									</div>
								</div>
								<Accordion.Indicator>
									<Icon icon={indicatorIcon} className={finalIndicatorClassName} style={indicatorStyle} />
								</Accordion.Indicator>
							</Accordion.Trigger>
							<div
								className="pr-4"
								onClick={(event) => event.stopPropagation()}
								onMouseDown={(event) => event.stopPropagation()}
							>
								{endContent}
							</div>
						</div>
					) : (
						<Accordion.Trigger className={triggerClassName}>
							<div className="flex items-center gap-3">
								{!hideIcon && (
									<div className={finalIconContainerClassName} style={iconContainerStyle}>
										{iconNode ?? (icon ? <Icon icon={icon} className={finalIconClassName} style={coloredTextStyle} /> : null)}
									</div>
								)}
								<div className="flex flex-col items-start">
									<span className="font-medium" style={coloredTextStyle}>
										{title}
									</span>
									{summary && (
										<span className={finalSummaryClassName}>
											{summary}
										</span>
									)}
								</div>
							</div>
							<Accordion.Indicator>
								<Icon icon={indicatorIcon} className={finalIndicatorClassName} style={indicatorStyle} />
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
