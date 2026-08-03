'use client';

import { use, useState, useTransition } from 'react';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AchievementCard } from '../achievements/components/achievement-card';
import { AchievementModal } from '../achievements/components/achievement-modal';
import { selectEmblem } from '@/app/actions/user/achievements';
import type { MerchantAchievementsData, MerchantAchievementItem } from '@/types/merchant/achievements';
import type { ApiResponse } from '@/types/common';

type AchievementsPromise = Promise<ApiResponse<MerchantAchievementsData>>;

interface ProfileEmblemsTabProps {
	achievementsPromise: AchievementsPromise;
}

export function ProfileEmblemsTab({ achievementsPromise }: ProfileEmblemsTabProps) {
	const response = use(achievementsPromise);
	const data = response?.data;

	const [selectedEmblemIds, setSelectedEmblemIds] = useState<string[]>(data?.selectedEmblemIds ?? []);
	const [selectedAchievement, setSelectedAchievement] = useState<MerchantAchievementItem | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [emblemPending, startEmblemTransition] = useTransition();

	if (!data || response?.error) {
		return (
			<p className="text-sm text-muted text-center py-8">
				{response?.error?.message ?? 'Não foi possível carregar os emblemas.'}
			</p>
		);
	}

	const { achievements } = data;

	function handleOpenAchievement(achievement: MerchantAchievementItem) {
		setSelectedAchievement(achievement);
		setIsModalOpen(true);
	}

	function handleSelectEmblem(id: string) {
		const isRemoving = selectedEmblemIds.includes(id);
		const prev = selectedEmblemIds;
		setSelectedEmblemIds(isRemoving ? prev.filter((eid) => eid !== id) : [...prev, id]);
		setIsModalOpen(false);

		startEmblemTransition(async () => {
			const res = await selectEmblem(id);
			if (res?.error) {
				setSelectedEmblemIds(prev);
				toast('Erro ao selecionar emblema', {
					description: res.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				toast(isRemoving ? 'Emblema removido' : 'Emblema adicionado!', {
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	return (
		<>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{achievements.map((achievement) => (
					<AchievementCard
						key={achievement.id}
						achievement={achievement}
						isSelectedEmblem={selectedEmblemIds.includes(achievement.id)}
						onSelect={handleOpenAchievement}
					/>
				))}
			</div>

			<AchievementModal
				achievement={selectedAchievement}
				isOpen={isModalOpen}
				isSelectedEmblem={selectedAchievement ? selectedEmblemIds.includes(selectedAchievement.id) : false}
				onOpenChange={setIsModalOpen}
				onSelectEmblem={handleSelectEmblem}
				isPending={emblemPending}
			/>
		</>
	);
}
