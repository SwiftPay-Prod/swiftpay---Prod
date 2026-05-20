'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, setHours, setMinutes, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, Label, Input, NumberField, Button } from '@heroui/react';
import { Icon } from './icon';
import { Calendar03Icon, Clock01Icon, ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/utils/utils';

export interface DateTimePickerProps {
	value: Date | null;
	onChange: (date: Date | null) => void;
	minDate?: Date;
	placeholder?: string;
	isDisabled?: boolean;
	className?: string;
	label?: ReactNode;
	description?: ReactNode;
}

export function DateTimePicker({
	value,
	onChange,
	minDate,
	placeholder = 'Selecione data e hora',
	isDisabled = false,
	className,
	label,
	description,
}: DateTimePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const selectedDate = value ?? undefined;
	const hours = value ? value.getHours() : 12;
	const minutes = value ? value.getMinutes() : 0;

	const handleDateSelect = useCallback(
		(date: Date | undefined) => {
			if (!date) return;
			const currentHours = value ? value.getHours() : 12;
			const currentMinutes = value ? value.getMinutes() : 0;
			const newDate = setMinutes(setHours(date, currentHours), currentMinutes);
			onChange(newDate);
		},
		[value, onChange]
	);

	const handleTimeChange = useCallback(
		(newHours: number, newMinutes: number) => {
			if (value) {
				const newDate = setMinutes(setHours(value, newHours), newMinutes);
				onChange(newDate);
			}
		},
		[value, onChange]
	);

	const disabledDays = minDate ? { before: startOfDay(minDate) } : undefined;

	const formattedValue = value ? format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '';

	return (
		<div className={cn('flex flex-col gap-1.5', className)}>
			{label && <Label>{label}</Label>}
			<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
				<Popover.Trigger>
					<Button
						type="button"
                        isDisabled={isDisabled}
						className={cn(
							'flex h-10 w-full items-center gap-2 rounded-lg border border-outline bg-surface px-3 text-sm transition-colors',
							'hover:border-outline-hover focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
							'disabled:cursor-not-allowed disabled:opacity-50 bg-default',
							!value && 'text-muted'
						)}
					>
						<Icon icon={Calendar03Icon} className="icon-sm shrink-0 text-muted" />
						<span className="flex-1 truncate text-left">{formattedValue || placeholder}</span>
					</Button>
				</Popover.Trigger>
				<Popover.Content className="w-auto overflow-hidden p-0">
					<div className="flex flex-col">
						<DayPicker
							mode="single"
							selected={selectedDate}
							onSelect={handleDateSelect}
							disabled={disabledDays}
							locale={ptBR}
							showOutsideDays
							className="p-3"
							components={{
								Chevron: ({ orientation }) =>
									orientation === 'left' ? (
										<Icon icon={ArrowLeft01Icon} className="icon-sm" />
									) : (
										<Icon icon={ArrowRight01Icon} className="icon-sm" />
									),
							}}
							classNames={{
								months: 'flex flex-col gap-2',
								month: 'flex flex-col gap-3',
								month_caption: 'flex justify-center relative items-center h-7',
								caption_label: 'text-sm font-medium',
								nav: 'absolute inset-x-0 flex items-center justify-between',
								button_previous: cn(
									'inline-flex size-7 items-center justify-center rounded-md',
									'text-muted hover:bg-content2 hover:text-foreground',
									'focus:outline-none focus:ring-1 focus:ring-accent',
									'disabled:pointer-events-none disabled:opacity-50'
								),
								button_next: cn(
									'inline-flex size-7 items-center justify-center rounded-md',
									'text-muted hover:bg-content2 hover:text-foreground',
									'focus:outline-none focus:ring-1 focus:ring-accent',
									'disabled:pointer-events-none disabled:opacity-50'
								),
								month_grid: 'w-full border-collapse',
								weekdays: 'flex',
								weekday: 'w-9 text-center text-xs font-medium text-muted',
								week: 'mt-1 flex',
								day: 'relative p-0 text-center text-sm',
								day_button: cn(
									'inline-flex size-9 items-center justify-center rounded-md font-normal',
									'hover:bg-content2 focus:outline-none focus:ring-1 focus:ring-accent',
									'aria-selected:bg-accent aria-selected:text-accent-foreground aria-selected:hover:bg-accent'
								),
								selected: '',
								today: 'bg-content2',
								outside: 'text-muted/50',
								disabled: 'text-muted/30 pointer-events-none',
								hidden: 'invisible',
							}}
						/>
						<div className="border-t border-outline bg-content1 px-3 py-2.5">
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-1.5 text-muted">
									<Icon icon={Clock01Icon} className="icon-sm" />
									<span className="text-sm">Horário</span>
								</div>
								<div className="flex items-center gap-1">
									<NumberField variant="secondary"
										aria-label="Horas"
										value={hours}
										onChange={(v) => handleTimeChange(v, minutes)}
										minValue={0}
										maxValue={23}
										formatOptions={{ minimumIntegerDigits: 2 }}
										className="w-14"
									>
										<Input variant="secondary" className="text-center tabular-nums" />
									</NumberField>
									<span className="text-muted">:</span>
									<NumberField variant="secondary"
										aria-label="Minutos"
										value={minutes}
										onChange={(v) => handleTimeChange(hours, v)}
										minValue={0}
										maxValue={59}
										formatOptions={{ minimumIntegerDigits: 2 }}
										className="w-14"
									>
										<Input variant="secondary" className="text-center tabular-nums" />
									</NumberField>
								</div>
							</div>
						</div>
					</div>
				</Popover.Content>
			</Popover>
			{description && <span className="text-xs text-muted">{description}</span>}
		</div>
	);
}

