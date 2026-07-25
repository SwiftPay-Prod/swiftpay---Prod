'use client';

import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Accordion } from '@heroui/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

type IconName = ComponentProps<typeof Icon>['icon'];

const ACCORDION_COLOR_MAP: Record<string, string> = {
	accent: '#404040',
	blue: '#404040',
	sky: '#404040',
	cyan: '#404040',
	success: '#525252',
	emerald: '#525252',
	teal: '#525252',
	green: '#525252',
	warning: '#737373',
	amber: '#737373',
	orange: '#737373',
	secondary: '#a3a3a3',
	violet: '#a3a3a3',
	indigo: '#a3a3a3',
	danger: '#a3a3a3',
	rose: '#a3a3a3',
	red: '#a3a3a3',
	fuchsia: '#a3a3a3',
	mauve: '#a3a3a3',
	slate: '#a3a3a3',
	default: '#a3a3a3',
	muted: '#a3a3a3',
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
	const finalSummaryClassName = resolvedColor ? summaryClassName : `${summaryClassName} text-muted`;
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
											<span className={finalSummaryClassName} style={coloredTextStyle}>
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
										<span className={finalSummaryClassName} style={coloredTextStyle}>
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
