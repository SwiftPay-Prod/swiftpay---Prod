import { PanelLayout } from "@/components/panel/panel-layout";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<PanelLayout>{children}</PanelLayout>
	);
}

