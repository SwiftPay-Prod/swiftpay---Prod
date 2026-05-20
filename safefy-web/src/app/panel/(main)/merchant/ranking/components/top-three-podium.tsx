import { PodiumSlot } from './podium-slot';
import type { RankingEntry, RankingType } from '@/types/ranking';

interface TopThreePodiumProps {
	entries: RankingEntry[];
	currentUserId: string | null;
	type: RankingType;
}

export function TopThreePodium({ entries, currentUserId, type }: TopThreePodiumProps) {
	const first = entries.find((e) => e.position === 1);
	const second = entries.find((e) => e.position === 2);
	const third = entries.find((e) => e.position === 3);

	if (!first) return null;

	return (
		<div className="rounded-xl border border-divider bg-surface/40 px-3 py-4 mb-1">
			<div className="flex items-end justify-center gap-3 md:gap-5">
				{second && (
					<PodiumSlot
						entry={second}
						type={type}
						size="small"
						isCurrentUser={currentUserId !== null && second.userId === currentUserId}
						animationDelay="0ms"
					/>
				)}
				<PodiumSlot
					entry={first}
					type={type}
					size="large"
					isCurrentUser={currentUserId !== null && first.userId === currentUserId}
					animationDelay="120ms"
				/>
				{third && (
					<PodiumSlot
						entry={third}
						type={type}
						size="small"
						isCurrentUser={currentUserId !== null && third.userId === currentUserId}
						animationDelay="240ms"
					/>
				)}
			</div>
		</div>
	);
}
