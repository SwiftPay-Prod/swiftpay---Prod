import Image from 'next/image';

export default function PanelLoading() {
	return (
		<div className="flex-1 flex items-center justify-center min-h-96">
			<div className="animate-pulse">
				<Image
					src="/logos/swiftpay-icon-logo.png"
					alt="Carregando..."
					width={64}
					height={64}
					priority
				/>
			</div>
		</div>
	);
}

