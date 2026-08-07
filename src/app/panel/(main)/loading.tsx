import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';

export default function PanelLoading() {
	return (
		<div className="flex-1 flex items-center justify-center min-h-96">
			<div className="animate-pulse">
				<SwiftPayBrandLogo iconSize={48} textClassName="text-2xl" priority />
			</div>
		</div>
	);
}

