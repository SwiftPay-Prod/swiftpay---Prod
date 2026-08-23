'use client';

import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/utils/utils';

interface JsonEditorInputProps {
	value: string;
	onChange: (value: string) => void;
	rows?: number;
	placeholder?: string;
	ariaLabel?: string;
	onBlurFormat?: boolean;
	className?: string;
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

export function JsonEditorInput({
	value,
	onChange,
	rows = 8,
	placeholder,
	ariaLabel,
	onBlurFormat = true,
	className,
}: JsonEditorInputProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const highlighted = useMemo(() => highlightJson(value || ''), [value]);

	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) {
			return;
		}

		if (document.activeElement === editor) {
			return;
		}

		const currentText = editor.innerText.replace(/\r\n/g, '\n');
		if (currentText === value) {
			return;
		}

		editor.innerHTML = highlighted || '';
	}, [value, highlighted]);

	function handleBlur() {
		if (!onBlurFormat || !value.trim()) {
			return;
		}

		try {
			const parsed = JSON.parse(value);
			onChange(JSON.stringify(parsed, null, 2));
		} catch {
			// Keep original content when JSON is invalid.
		}
	}

	function handleInput() {
		const editor = editorRef.current;
		if (!editor) {
			return;
		}

		const nextValue = editor.innerText.replace(/\r\n/g, '\n');
		onChange(nextValue);
	}

	return (
		<div className={cn('rounded-xl border border-border bg-zinc-900', className)}>
			<div
				ref={editorRef}
				role="textbox"
				contentEditable
				suppressContentEditableWarning
				aria-label={ariaLabel}
				aria-placeholder={placeholder}
				onInput={handleInput}
				onBlur={handleBlur}
				className="min-h-0 overflow-auto p-3 font-mono text-xs leading-5 whitespace-pre outline-none"
				style={{ minHeight: `${rows * 20}px` }}
			/>
		</div>
	);
}
