interface CheckoutSectionPreviewProps {
	src: string;
	title: string;
	description?: string;
}

export function CheckoutSectionPreview({ src, title, description }: CheckoutSectionPreviewProps) {
	return (
		<div className="flex flex-col gap-2 rounded-xl border border-divider bg-surface-secondary p-3">
			<div className="flex flex-col">
				<span className="text-xs font-semibold text-foreground">{title}</span>
				{description && <span className="text-xs text-muted-foreground">{description}</span>}
			</div>
			<div className="relative overflow-hidden rounded-lg border border-divider shadow-sm">
				<img
					src={src}
					alt={title}
					className="w-full object-cover aspect-[16/9]"
				/>
			</div>
		</div>
	);
}
