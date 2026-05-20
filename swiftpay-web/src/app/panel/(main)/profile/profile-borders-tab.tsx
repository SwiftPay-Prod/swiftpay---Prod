'use client';

import { use, useState, useTransition } from 'react';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AvatarUser } from '@/components/ui/avatar-user';
import { BorderCard } from '../achievements/components/border-card';
import { BorderModal } from '../achievements/components/border-modal';
import { selectBorder } from '@/app/actions/user/achievements';
import { useUser } from '@/contexts/user-context';
import type { MerchantAchievementsData, MerchantLevel } from '@/types/merchant/achievements';
import type { ApiResponse } from '@/types/common';

type AchievementsPromise = Promise<ApiResponse<MerchantAchievementsData>>;

const LEVELS_ORDER: MerchantLevel[] = [
	'Iron', 'Bronze', 'Silver', 'GoldStart', 'GoldPro',
	'Diamond', 'PlatinumStart', 'PlatinumPro', 'Titanium', 'Black', 'Legend',
];

interface ProfileBordersTabProps {
	achievementsPromise: AchievementsPromise;
	name?: string | null;
	profileImageUrl?: string | null;
}

export function ProfileBordersTab({ achievementsPromise, name, profileImageUrl }: ProfileBordersTabProps) {
	const response = use(achievementsPromise);
	const data = response?.data;

	const { updateUser } = useUser();
	const [selectedBorderLevel, setSelectedBorderLevel] = useState<MerchantLevel | null>(
		data?.selectedBorderLevel ?? null
	);
	const [borderPending, startBorderTransition] = useTransition();
	const [selectedBorderForModal, setSelectedBorderForModal] = useState<{ level: MerchantLevel; borderImageUrl: string | null } | null>(null);
	const [isBorderModalOpen, setIsBorderModalOpen] = useState(false);

	if (!data || response?.error) {
		return (
			<p className="text-sm text-muted text-center py-8">
				{response?.error?.message ?? 'Não foi possível carregar as dinastias.'}
			</p>
		);
	}

	const { levelBorders, levelInfo } = data;
	const currentLevelIndex = LEVELS_ORDER.indexOf(levelInfo.current as MerchantLevel);
	const currentBorderImageUrl = selectedBorderLevel
		? (levelBorders.find(b => b.level === selectedBorderLevel)?.borderImageUrl ?? null)
		: null;

	function handleOpenBorderModal(level: MerchantLevel, borderImageUrl: string | null) {
		setSelectedBorderForModal({ level, borderImageUrl });
		setIsBorderModalOpen(true);
	}

	function handleSelectBorder(level: MerchantLevel | null) {
		setIsBorderModalOpen(false);
		const prev = selectedBorderLevel;
		setSelectedBorderLevel(level);

		startBorderTransition(async () => {
			const res = await selectBorder(level);
			if (res?.error) {
				setSelectedBorderLevel(prev);
				toast('Erro ao selecionar dinastia', {
					description: res.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				const borderUrl = level
					? (levelBorders.find(b => b.level === level)?.borderImageUrl ?? null)
					: null;
				updateUser({ selectedBorderImageUrl: borderUrl });
				toast(level ? 'Dinastia selecionada!' : 'Dinastia removida', {
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	return (
		<>
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<AvatarUser
					name={name}
					profileImageUrl={profileImageUrl}
					borderImageUrl={currentBorderImageUrl}
					size="md"
				/>
				<div className="flex flex-col gap-0.5">
					<span className="text-sm font-medium">Preview</span>
					<p className="text-xs text-muted">{currentBorderImageUrl ? 'Dinastia selecionada' : 'Sem dinastia selecionada'}</p>
				</div>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
			{levelBorders.map((border) => {
				const borderIndex = LEVELS_ORDER.indexOf(border.level as MerchantLevel);
				const isUnlocked = borderIndex <= currentLevelIndex;
				return (
					<BorderCard
						key={border.level}
						level={border.level as MerchantLevel}
						borderImageUrl={border.borderImageUrl ?? ''}
						isUnlocked={isUnlocked}
						isSelected={selectedBorderLevel === border.level}
						onSelect={() => handleOpenBorderModal(border.level as MerchantLevel, border.borderImageUrl ?? null)}
					/>
				);
			})}
			</div>
		</div>

		<BorderModal
			level={selectedBorderForModal?.level ?? null}
			borderImageUrl={selectedBorderForModal?.borderImageUrl ?? null}
			isUnlocked={
				selectedBorderForModal
					? LEVELS_ORDER.indexOf(selectedBorderForModal.level) <= currentLevelIndex
					: false
			}
			isSelected={selectedBorderForModal?.level === selectedBorderLevel}
			isOpen={isBorderModalOpen}
			onOpenChange={setIsBorderModalOpen}
			onSelect={handleSelectBorder}
			isPending={borderPending}
		/>		</>	);
}
