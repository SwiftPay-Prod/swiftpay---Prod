import type { UserSocialLinks } from '@/types/user';

export function getPodiumColors(rank: number) {
	if (rank === 1)
		return { gradient: 'linear-gradient(135deg,#171717,#17171766)', text: 'text-foreground', stepBg: '#1717171a', stepBorder: '#17171744', avatarBg: '#1717172e', initialsColor: '#171717' };
	if (rank === 2)
		return { gradient: 'linear-gradient(135deg,#a3a3a3,#a3a3a366)', text: 'text-muted', stepBg: '#a3a3a31a', stepBorder: '#a3a3a344', avatarBg: '#a3a3a32e', initialsColor: '#a3a3a3' };
	return { gradient: 'linear-gradient(135deg,#525252,#52525266)', text: 'text-muted', stepBg: '#5252521a', stepBorder: '#52525244', avatarBg: '#5252522e', initialsColor: '#525252' };
}

export function getTierRowClass(position: number): string {
	if (position === 1) return 'ranking-row-gold';
	if (position === 2) return 'ranking-row-silver';
	if (position === 3) return 'ranking-row-bronze';
	return '';
}

export function getTierGradientClass(position: number): string {
	if (position >= 4 && position <= 10) return `ranking-row-tier-${position}`;
	return '';
}

export function getTierStyle(position: number): string {
	if (position === 1) return 'ring-2 ring-foreground ring-offset-1 ring-offset-background animate-pulse';
	if (position === 2) return 'ring-2 ring-muted ring-offset-1 ring-offset-background animate-pulse';
	if (position === 3) return 'ring-2 ring-orange-500/60 ring-offset-1 ring-offset-background animate-pulse';
	if (position <= 10) return 'ring-2 ring-accent/60 ring-offset-1 ring-offset-background';
	return 'ring-1 ring-divider ring-offset-1 ring-offset-background';
}

export function getTierTextClasses(position: number): { name: string; value: string } {
	if (position === 1) return { name: 'text-foreground font-semibold', value: 'text-foreground font-semibold' };
	if (position === 2) return { name: 'text-muted font-semibold', value: 'text-muted font-semibold' };
	if (position === 3) return { name: 'text-orange-500 font-semibold', value: 'text-orange-500 font-semibold' };
	if (position <= 10) return { name: 'text-accent font-medium', value: 'text-accent font-semibold' };
	return { name: 'font-medium', value: 'font-semibold' };
}

export function getInitials(name: string | null | undefined): string {
	if (!name) return '?';
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
}

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
