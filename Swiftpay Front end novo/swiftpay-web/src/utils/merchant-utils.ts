import { MerchantStatus, MerchantKycStatus, UserRole } from '@/types/enums';

export function isAdminViewingMerchant(userRole: UserRole | null | undefined, merchantOwnerId: string, currentUserId: string | null | undefined): boolean {
  if (!userRole || !currentUserId) return false;
  const isAdmin = userRole === UserRole.God || userRole === UserRole.Admin;
  return isAdmin && merchantOwnerId !== currentUserId;
}

export function canPerformMerchantActions(userRole: UserRole | null | undefined, merchantOwnerId: string, currentUserId: string | null | undefined): boolean {
  if (!currentUserId) return false;
  return merchantOwnerId === currentUserId;
}

export function isMerchantRejected(kycStatus?: MerchantKycStatus | null): boolean {
  return kycStatus === MerchantKycStatus.Rejected;
}

export function isMerchantDraft(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  if (isMerchantRejected(kycStatus)) return false;
  return status === MerchantStatus.Draft || kycStatus === MerchantKycStatus.Draft;
}

export function isMerchantDraftOrComplement(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return isMerchantDraft(status, kycStatus) || isMerchantNeedingComplement(status, kycStatus);
}

export function getMerchantRedirectRoute(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): string {
  if (isMerchantDraft(status, kycStatus)) {
    return '/panel/merchant/new';
  }

  if (canMerchantOperate(status, kycStatus)) {
    return '/panel/merchant/dashboard';
  }

  if (isMerchantSubmitted(status, kycStatus)) {
    return '/panel/merchant/review';
  }

  return '/panel/merchant/dashboard';
}

export function isMerchantPending(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return status === MerchantStatus.Active && kycStatus === MerchantKycStatus.Pending;
}

export function isMerchantUnderReview(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return status === MerchantStatus.Active && kycStatus === MerchantKycStatus.UnderReview;
}

export function isMerchantNeedingComplement(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return status === MerchantStatus.Active && kycStatus === MerchantKycStatus.Complement;
}

export function isMerchantApproved(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return status === MerchantStatus.Active && kycStatus === MerchantKycStatus.Approved;
}

export function isMerchantActive(status?: MerchantStatus | null): boolean {
  return status === MerchantStatus.Active;
}

export function isMerchantSuspended(status?: MerchantStatus | null): boolean {
  return status === MerchantStatus.Suspended;
}

export function isMerchantInactive(status?: MerchantStatus | null): boolean {
  return status === MerchantStatus.Inactive;
}

export function isMerchantSuspendedOrInactive(status?: MerchantStatus | null): boolean {
  return isMerchantSuspended(status) || isMerchantInactive(status);
}

export function isMerchantAwaitingApproval(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return (
    isMerchantUnderReview(status, kycStatus) ||
    isMerchantNeedingComplement(status, kycStatus) ||
    isMerchantRejected(kycStatus)
  );
}

export function canMerchantOperate(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return isMerchantApproved(status, kycStatus);
}

export function isMerchantSubmitted(status?: MerchantStatus | null, kycStatus?: MerchantKycStatus | null): boolean {
  return (
    isMerchantPending(status, kycStatus) ||
    isMerchantUnderReview(status, kycStatus) ||
    isMerchantNeedingComplement(status, kycStatus) ||
    isMerchantRejected(kycStatus) ||
    isMerchantApproved(status, kycStatus) ||
    isMerchantSuspendedOrInactive(status)
  );
}

