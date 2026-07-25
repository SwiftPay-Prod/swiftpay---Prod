import Image from 'next/image';

export default function PanelLoading() {
	return (
		<div className="flex-1 flex items-center justify-center min-h-96">
			<div className="animate-pulse">
				<Image
					src="/logos/swiftpay-logo.png"
					alt="Carregando..."
					width={96}
					height={99}
					priority
				/>
			</div>
		</div>
	);
}

