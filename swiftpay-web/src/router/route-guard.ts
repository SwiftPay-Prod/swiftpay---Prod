import type { RouteConfig, RouteContext, RouteValidationResult } from '@/types/router';
import { RouteType } from '@/types/router';
import { ROUTES_CONFIG } from './router';
import { Routes } from './routes';

export function findRouteConfig(pathname: string): RouteConfig | null {
  const exactMatch = ROUTES_CONFIG.find((route) => route.path === pathname);
  if (exactMatch) return exactMatch;

  const prefixMatches = ROUTES_CONFIG
    .filter((route) => pathname.startsWith(`${route.path}/`))
    .sort((a, b) => b.path.length - a.path.length);

  return prefixMatches[0] || null;
}

export function isPrivateRoute(pathname: string): boolean {
  const config = findRouteConfig(pathname);
  return config?.type === RouteType.Private;
}

export function isPublicRoute(pathname: string): boolean {
  const config = findRouteConfig(pathname);
  return config?.type === RouteType.Public;
}

export function isOpenRoute(pathname: string): boolean {
  const config = findRouteConfig(pathname);
  return config?.type === RouteType.Open;
}

export function isVerifyEmailRoute(pathname: string): boolean {
  return pathname === Routes.panel.verifyEmail;
}

export function isUserOnboardingRoute(pathname: string): boolean {
  return pathname === Routes.panel.onboarding;
}

export function validateRouteAccess(
  config: RouteConfig | null,
  context: RouteContext
): RouteValidationResult {
  if (!config) {
    return { allowed: true };
  }

  const { access, redirectTo } = config;

  if (!access) {
    return { allowed: true };
  }

  const defaultRedirect = redirectTo || Routes.panel.merchant.dashboard;

  if (access.requiresEmailVerified !== false && !context.emailVerified) {
    return { allowed: false, redirectTo: Routes.panel.verifyEmail };
  }

  if (access.roles && access.roles.length > 0) {
    if (!access.roles.includes(context.userRole)) {
      return { allowed: false, redirectTo: defaultRedirect };
    }
  }

  if (access.requiresMerchant) {
    if (!context.hasMerchant) {
      return { allowed: false, redirectTo: Routes.panel.merchant.new };
    }

    if (access.merchantStatus && access.merchantStatus.length > 0) {
      if (!context.merchantStatus || !access.merchantStatus.includes(context.merchantStatus)) {
        return { allowed: false, redirectTo: defaultRedirect };
      }
    }

    if (access.merchantKycStatus && access.merchantKycStatus.length > 0) {
      if (!context.merchantKycStatus || !access.merchantKycStatus.includes(context.merchantKycStatus)) {
        return { allowed: false, redirectTo: defaultRedirect };
      }
    }
  }

  return { allowed: true };
}

export function canAccessRoute(pathname: string, context: RouteContext): RouteValidationResult {
  const config = findRouteConfig(pathname);
  return validateRouteAccess(config, context);
}

export function shouldShowInMenu(config: RouteConfig, context: Partial<RouteContext>): boolean {
  if (!config.showInMenu) return false;

  const { access } = config;

  if (!access) return true;

  if (access.roles && access.roles.length > 0) {
    if (!context.userRole || !access.roles.includes(context.userRole)) {
      return false;
    }
  }

  if (access.requiresMerchant) {
    if (!context.hasMerchant) return false;

    if (access.merchantStatus && access.merchantStatus.length > 0) {
      if (!context.merchantStatus || !access.merchantStatus.includes(context.merchantStatus)) {
        return false;
      }
    }

    if (access.merchantKycStatus && access.merchantKycStatus.length > 0) {
      if (!context.merchantKycStatus || !access.merchantKycStatus.includes(context.merchantKycStatus)) {
        return false;
      }
    }
  }

  return true;
}

export function getPageTitle(pathname: string): string {
  const config = findRouteConfig(pathname);
  return config?.title || 'Dashboard';
}

