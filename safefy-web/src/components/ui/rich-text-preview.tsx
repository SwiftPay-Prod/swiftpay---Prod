'use client';

import 'react-quill-new/dist/quill.snow.css';

interface RichTextPreviewProps {
	content: string;
	className?: string;
}

export function RichTextPreview({ content, className }: RichTextPreviewProps) {
	return (
		<div className={`rich-text-preview ${className ?? ''}`}>
			<div className="ql-snow">
				<div className="ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
			</div>
			<style>{`
				.rich-text-preview .ql-editor {
					padding: 0;
					font-size: 0.875rem;
					line-height: 1.6;
				}
				.rich-text-preview .ql-editor h1 {
					font-size: 1.5rem;
					font-weight: 600;
					margin-bottom: 0.5rem;
				}
				.rich-text-preview .ql-editor h2 {
					font-size: 1.25rem;
					font-weight: 600;
					margin-bottom: 0.5rem;
				}
				.rich-text-preview .ql-editor h3 {
					font-size: 1.125rem;
					font-weight: 600;
					margin-bottom: 0.5rem;
				}
				.rich-text-preview .ql-editor p {
					margin-bottom: 0.5rem;
				}
				.rich-text-preview .ql-editor a {
					color: var(--color-accent);
					text-decoration: underline;
				}
				.rich-text-preview .ql-editor a:hover {
					opacity: 0.8;
				}
				.rich-text-preview .ql-editor img {
					max-width: 100%;
					height: auto;
					border-radius: 0.5rem;
					margin: 0.5rem 0;
				}
				.rich-text-preview .ql-editor ul,
				.rich-text-preview .ql-editor ol {
					padding-left: 1.5rem;
					margin-bottom: 0.5rem;
				}
				.rich-text-preview .ql-editor li {
					margin-bottom: 0.25rem;
				}
				.rich-text-preview .ql-editor strong {
					font-weight: 600;
				}
				.rich-text-preview .ql-editor em {
					font-style: italic;
				}
				.rich-text-preview .ql-editor u {
					text-decoration: underline;
				}
				.rich-text-preview .ql-editor s {
					text-decoration: line-through;
				}
			`}</style>
		</div>
	);
}

