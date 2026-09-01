'use client';

import { useState } from 'react';
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { copyToClipboard } from '@/utils/clipboard';

export function CopyableId({ value, label = 'Copiar UUID' }: { value: string; label?: string }) {
	const [copied, setCopied] = useState(false);
	const [failed, setFailed] = useState(false);

	async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		e.stopPropagation();
		const ok = await copyToClipboard(value);
		if (ok) {
			setCopied(true);
			setFailed(false);
			setTimeout(() => setCopied(false), 1500);
		} else {
			setFailed(true);
			setCopied(false);
			setTimeout(() => setFailed(false), 2000);
		}
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label={label}
			title={label}
			data-copied={copied}
			data-failed={failed}
			className="group inline-flex max-w-70 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-white/60 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white data-[copied=true]:border-success/50 data-[copied=true]:bg-success/10 data-[copied=true]:text-success data-[failed=true]:border-danger/50 data-[failed=true]:bg-danger/10 data-[failed=true]:text-danger"
		>
			<span className="truncate">{value}</span>
			{copied ? (
				<Icon icon={Tick02Icon} className="icon-xs shrink-0" />
			) : (
				<Icon icon={Copy01Icon} className="icon-xs shrink-0 opacity-50 group-hover:opacity-100" />
			)}
		</button>
	);
}
