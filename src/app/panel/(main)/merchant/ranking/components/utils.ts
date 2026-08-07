import type { UserSocialLinks } from '@/types/user';

export function parseSocialLinks(raw: string | null | undefined): UserSocialLinks {
	if (!raw) return {};
	try {
		return JSON.parse(raw) as UserSocialLinks;
	} catch {
		return {};
	}
}

export function formatReferralCountLabel(totalReferrals: number): string {
	return totalReferrals === 1 ? '1 indicação' : `${totalReferrals} indicações`;
}
