'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
	ssr: false,
	loading: () => <div className="h-32 animate-pulse rounded-lg border border-default bg-surface" />,
});

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
	const modules = useMemo(
		() => ({
			toolbar: [
				[{ header: [1, 2, 3, false] }],
				['bold', 'italic', 'underline', 'strike'],
				[{ color: [] }, { background: [] }],
				[{ list: 'ordered' }, { list: 'bullet' }],
				['link', 'image'],
				['clean'],
			],
		}),
		[]
	);

	const formats = useMemo(
		() => ['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'link', 'image'],
		[]
	);

	return (
		<div className={`quill-wrapper ${className ?? ''}`}>
			<ReactQuill
				theme="snow"
				value={value}
				onChange={onChange}
				modules={modules}
				formats={formats}
				placeholder={placeholder}
			/>
			<style>{`
				.quill-wrapper .ql-toolbar {
					border-color: var(--color-default);
					border-radius: 0.5rem 0.5rem 0 0;
					background: var(--color-surface);
				}
				.quill-wrapper .ql-container {
					border-color: var(--color-default);
					border-radius: 0 0 0.5rem 0.5rem;
					font-size: 0.875rem;
					min-height: 8rem;
				}
				.quill-wrapper .ql-editor {
					min-height: 8rem;
				}
				.quill-wrapper .ql-editor.ql-blank::before {
					color: var(--color-muted);
					font-style: normal;
				}
				.quill-wrapper .ql-snow .ql-stroke {
					stroke: var(--color-foreground);
				}
				.quill-wrapper .ql-snow .ql-fill {
					fill: var(--color-foreground);
				}
				.quill-wrapper .ql-snow .ql-picker {
					color: var(--color-foreground);
				}
				.quill-wrapper .ql-snow .ql-picker-options {
					background: var(--color-overlay);
					border-color: var(--color-default);
				}
				.quill-wrapper .ql-snow .ql-picker-item:hover {
					color: var(--color-accent);
				}
				.quill-wrapper .ql-snow button:hover .ql-stroke {
					stroke: var(--color-accent);
				}
				.quill-wrapper .ql-snow button:hover .ql-fill {
					fill: var(--color-accent);
				}
				.quill-wrapper .ql-snow button.ql-active .ql-stroke {
					stroke: var(--color-accent);
				}
				.quill-wrapper .ql-snow button.ql-active .ql-fill {
					fill: var(--color-accent);
				}
				.quill-wrapper .ql-editor a {
					color: var(--color-accent);
				}
				.quill-wrapper .ql-editor img {
					max-width: 100%;
					height: auto;
					border-radius: 0.5rem;
					margin: 0.5rem 0;
				}
				.quill-wrapper .ql-snow .ql-color-picker .ql-picker-options,
				.quill-wrapper .ql-snow .ql-background .ql-picker-options {
					padding: 0.25rem;
					width: 152px;
				}
				.quill-wrapper .ql-snow .ql-picker.ql-color .ql-picker-label svg,
				.quill-wrapper .ql-snow .ql-picker.ql-background .ql-picker-label svg {
					stroke: var(--color-foreground);
				}
			`}</style>
		</div>
	);
}

