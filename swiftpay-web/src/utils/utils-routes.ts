import { ROUTES_CONFIG, MENU_SECTIONS_ORDER } from '@/router/router';
import { findRouteConfig, shouldShowInMenu, getPageTitle } from '@/router/route-guard';
import type { MenuSection, RouteContext } from '@/types/router';
import { UserRole, MerchantStatus, MerchantKycStatus } from '@/types/enums';
import { Routes } from '@/router/routes';

export { findRouteConfig, getPageTitle };

export interface MerchantMenuContext {
	status: MerchantStatus;
	kycStatus: MerchantKycStatus;
}

export function getMenuSections(userRole?: UserRole, merchant?: MerchantMenuContext | null): MenuSection[] {
	const context: Partial<RouteContext> = {
		userRole,
		hasMerchant: !!merchant,
		merchantStatus: merchant?.status,
		merchantKycStatus: merchant?.kycStatus,
	};

	const menuRoutes = ROUTES_CONFIG.filter((route) => shouldShowInMenu(route, context));

	if (
		menuRoutes.find((route) => route.path === Routes.panel.merchant.onboarding) &&
		merchant?.kycStatus === MerchantKycStatus.Complement
	) {
		menuRoutes.splice(
			menuRoutes.findIndex((route) => route.path === Routes.panel.merchant.onboarding),
			1
		);
	}

	const sectionsMap = new Map<string, typeof menuRoutes>();

	menuRoutes.forEach((route) => {
		const section = route.menuSection!;
		if (!sectionsMap.has(section)) {
			sectionsMap.set(section, []);
		}
		sectionsMap.get(section)!.push(route);
	});

	sectionsMap.forEach((items) => {
		items.sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));
	});

	const sections: MenuSection[] = [];

	MENU_SECTIONS_ORDER.forEach((sectionTitle) => {
		const items = sectionsMap.get(sectionTitle);
		if (items && items.length > 0) {
			sections.push({
				title: sectionTitle,
				items,
			});
		}
	});

	return sections;
}

