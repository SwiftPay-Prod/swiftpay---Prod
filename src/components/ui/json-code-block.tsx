'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Copy01Icon, Tick01Icon } from '@hugeicons/core-free-icons';
import { Icon } from './icon';
import { cn } from '@/utils/utils';

interface JsonCodeBlockProps {
	value: string | null | undefined;
	className?: string;
	maxHeight?: string;
	label?: string;
}

function formatJson(value: string): { formatted: string; isJson: boolean } {
	if (!value || value.trim() === '') {
		return { formatted: '-', isJson: false };
	}

	try {
		const parsed = JSON.parse(value);
		const formatted = JSON.stringify(parsed, null, 2);
		return { formatted, isJson: true };
	} catch {
		return { formatted: value, isJson: false };
	}
}

function highlightJson(json: string): string {
	return json
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(
			/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
			(match) => {
				let cls = 'text-amber-400';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'text-sky-400';
					} else {
						cls = 'text-emerald-400';
					}
				} else if (/true|false/.test(match)) {
					cls = 'text-violet-400';
				} else if (/null/.test(match)) {
					cls = 'text-rose-400';
				}
				return `<span class="${cls}">${match}</span>`;
			}
		);
}

export function JsonCodeBlock({ value, className, maxHeight = '300px', label }: JsonCodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const { formatted, isJson } = useMemo(() => formatJson(value ?? ''), [value]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(formatted);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// ignore
		}
	}, [formatted]);

	if (formatted === '-') {
		return (
			<div className={cn('flex min-w-0 max-w-full flex-col gap-1 sm:col-span-2', className)}>
				{label && <span className="text-xs text-muted">{label}</span>}
				<div className="rounded-lg bg-card p-3 text-xs text-muted">-</div>
			</div>
		);
	}

	return (
		<div className={cn('flex min-w-0 max-w-full flex-col gap-1 sm:col-span-2', className)}>
			{label && <span className="text-xs text-muted">{label}</span>}
			<div className="group relative min-w-0 max-w-full">
				<div
					className={cn(
						'min-w-0 max-w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs',
						isJson ? 'text-zinc-300' : 'text-muted whitespace-pre-wrap wrap-break-word'
					)}
					style={{ maxHeight }}
				>
					{isJson ? (
						<pre
							className="min-w-0 max-w-full whitespace-pre"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON highlighting
							dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }}
						/>
					) : (
						<pre className="min-w-0 max-w-full whitespace-pre-wrap wrap-break-word">{formatted}</pre>
					)}
				</div>
				<Tooltip>
					<Button
						isIconOnly
						size="sm"
						variant="tertiary"
						onPress={handleCopy}
						className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-zinc-700"
					>
						<Icon icon={copied ? Tick01Icon : Copy01Icon} className="icon-sm" />
					</Button>
					<Tooltip.Content>{copied ? 'Copiado!' : 'Copiar'}</Tooltip.Content>
				</Tooltip>
			</div>
		</div>
	);
}
