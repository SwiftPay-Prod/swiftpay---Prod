'use client';

import { use, useState, useTransition } from 'react';
import { Card, Tabs, Separator } from '@heroui/react';
import { InternalTabs } from '@/components/ui/internal-tabs';
import { UserProfileProgressCard } from '@/components/user/user-profile-progress-card';
import {
	Medal01Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	StarAward02Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { toast } from '@heroui/react';
import { AchievementCard } from './components/achievement-card';
import { AchievementModal } from './components/achievement-modal';
import { BorderCard } from './components/border-card';
import { BorderModal } from './components/border-modal';
import { selectEmblem, selectBorder } from '@/app/actions/user/achievements';
import type { MerchantAchievementsData, MerchantAchievementItem, MerchantLevel } from '@/types/merchant/achievements';
import type { ApiResponse } from '@/types/common';

type AchievementsPromise = Promise<ApiResponse<MerchantAchievementsData>>;

const ACHIEVEMENT_TAB_ITEMS = [
	{ id: 'achievements', label: 'Conquistas', icon: <Icon icon={StarAward02Icon} className="icon-sm" /> },
	{ id: 'borders', label: 'Dinastias', icon: <Icon icon={Medal01Icon} className="icon-sm" /> },
];

const LEVELS_ORDER: MerchantLevel[] = [
	'Iron',
	'Bronze',
	'Silver',
	'GoldStart',
	'GoldPro',
	'Diamond',
	'PlatinumStart',
	'PlatinumPro',
	'Titanium',
	'Black',
	'Legend',
];

interface AchievementsPageProps {
	fetchPromise: AchievementsPromise;
	merchantId: string;
	userName?: string | null;
	userProfileImageUrl?: string | null;
}

export function AchievementsPage({ fetchPromise, merchantId, userName, userProfileImageUrl }: AchievementsPageProps) {
	const response = use(fetchPromise);
	const data = response?.data;

	const [selectedEmblemIds, setSelectedEmblemIds] = useState<string[]>(data?.selectedEmblemIds ?? []);
	const [selectedBorderLevel, setSelectedBorderLevel] = useState<MerchantLevel | null>(
		data?.selectedBorderLevel ?? null
	);
	const [emblemPending, startEmblemTransition] = useTransition();
	const [borderPending, startBorderTransition] = useTransition();
	const [selectedAchievement, setSelectedAchievement] = useState<MerchantAchievementItem | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedBorderForModal, setSelectedBorderForModal] = useState<{
		level: MerchantLevel;
		borderImageUrl: string | null;
	} | null>(null);
	const [isBorderModalOpen, setIsBorderModalOpen] = useState(false);

	if (!data || response?.error) {
		return (
			<div className="flex flex-col gap-6 text-white">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
					<div>
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
								<Icon icon={StarAward02Icon} className="icon-sm" />
							</div>
							<h1 className="text-xl font-bold tracking-tight text-white">Conquistas</h1>
						</div>
						<p className="text-xs text-white/50 mt-1">Seus emblemas, dinastias e progresso de nível.</p>
					</div>
				</div>
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-8 text-center">
					<p className="text-sm text-white/50">{response?.error?.message ?? 'Não foi possível carregar as conquistas.'}</p>
				</div>
			</div>
		);
	}

	const { levelInfo, achievements, levelBorders } = data;
	const currentLevelIndex = LEVELS_ORDER.indexOf(levelInfo.current as MerchantLevel);

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
				toast(level ? 'Dinastia selecionada!' : 'Dinastia removida', {
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	const earnedCount = achievements.filter((a) => a.isEarned).length;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={StarAward02Icon} className="icon-sm" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Conquistas</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">Seus emblemas, dinastias e progresso de nível.</p>
				</div>
				<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
					<span className="text-xs font-mono text-white/70">{earnedCount} / {achievements.length}</span>
				</div>
			</div>

			{/* User Progress Card */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<UserProfileProgressCard
					name={userName}
					profileImageUrl={userProfileImageUrl}
					borderImageUrl={
						selectedBorderLevel
							? (levelBorders.find((b) => b.level === selectedBorderLevel)?.borderImageUrl ?? null)
							: null
					}
					level={levelInfo.current as MerchantLevel}
					nextLevel={levelInfo.nextLevel as MerchantLevel | null}
					nextLevelLabel={levelInfo.nextLevelDisplayName}
					totalVolume={levelInfo.totalVolume}
					maxThreshold={levelInfo.maxThreshold}
					progress={levelInfo.progress}
					earnedCount={earnedCount}
					totalAchievements={achievements.length}
				/>
			</div>

			<Separator className="bg-white/10" />

			{/* Tabs */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<InternalTabs ariaLabel="Seções de conquistas" items={ACHIEVEMENT_TAB_ITEMS} defaultSelectedKey="achievements">
					<Tabs.Panel id="achievements" className="pt-4">
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
							{achievements.map((achievement) => (
								<AchievementCard
									key={achievement.id}
									achievement={achievement}
									isSelectedEmblem={selectedEmblemIds.includes(achievement.id)}
									onSelect={handleOpenAchievement}
								/>
							))}
						</div>
					</Tabs.Panel>

					<Tabs.Panel id="borders" className="pt-4">
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
					</Tabs.Panel>
				</InternalTabs>
			</div>

			{/* Modals */}
			<AchievementModal
				achievement={selectedAchievement}
				isOpen={isModalOpen}
				isSelectedEmblem={selectedAchievement ? selectedEmblemIds.includes(selectedAchievement.id) : false}
				onOpenChange={setIsModalOpen}
				onSelectEmblem={handleSelectEmblem}
				isPending={emblemPending}
			/>

			<BorderModal
				level={selectedBorderForModal?.level ?? null}
				borderImageUrl={selectedBorderForModal?.borderImageUrl ?? null}
				isUnlocked={
					selectedBorderForModal ? LEVELS_ORDER.indexOf(selectedBorderForModal.level) <= currentLevelIndex : false
				}
				isSelected={selectedBorderForModal ? selectedBorderLevel === selectedBorderForModal.level : false}
				isOpen={isBorderModalOpen}
				onOpenChange={setIsBorderModalOpen}
				onSelect={handleSelectBorder}
				isPending={borderPending}
			/>
		</div>
	);
}
