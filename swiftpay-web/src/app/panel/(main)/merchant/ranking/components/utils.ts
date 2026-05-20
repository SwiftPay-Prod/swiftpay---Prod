import type { UserSocialLinks } from '@/types/user';

export function getPodiumColors(rank: number) {
	if (rank === 1)
		return { gradient: 'linear-gradient(135deg,#f59e0b,#f59e0b66)', text: 'text-yellow-500', stepBg: '#f59e0b1a', stepBorder: '#f59e0b44', avatarBg: '#f59e0b2e', initialsColor: '#f59e0b' };
	if (rank === 2)
		return { gradient: 'linear-gradient(135deg,#94a3b8,#94a3b866)', text: 'text-slate-400', stepBg: '#94a3b81a', stepBorder: '#94a3b844', avatarBg: '#94a3b82e', initialsColor: '#94a3b8' };
	return { gradient: 'linear-gradient(135deg,#f97316,#f9731666)', text: 'text-orange-400', stepBg: '#f973161a', stepBorder: '#f9731644', avatarBg: '#f973162e', initialsColor: '#f97316' };
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
	if (position === 1) return 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-background animate-pulse';
	if (position === 2) return 'ring-2 ring-slate-400 ring-offset-1 ring-offset-background animate-pulse';
	if (position === 3) return 'ring-2 ring-orange-400 ring-offset-1 ring-offset-background animate-pulse';
	if (position <= 10) return 'ring-2 ring-accent/60 ring-offset-1 ring-offset-background';
	return 'ring-1 ring-divider ring-offset-1 ring-offset-background';
}

export function getTierTextClasses(position: number): { name: string; value: string } {
	if (position === 1) return { name: 'text-yellow-500 font-semibold', value: 'text-yellow-500 font-semibold' };
	if (position === 2) return { name: 'text-slate-400 font-semibold', value: 'text-slate-400 font-semibold' };
	if (position === 3) return { name: 'text-orange-400 font-semibold', value: 'text-orange-400 font-semibold' };
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
