'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getUnreadBulletins, markBulletinAsRead } from '@/app/actions/user';
import type { UnreadBulletin } from '@/types/user/bulletins';
import { BulletinModal } from '@/components/modals/bulletin-modal';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';

interface BulletinContextValue {
	bulletins: UnreadBulletin[];
	currentBulletin: UnreadBulletin | null;
	isLoading: boolean;
	markAsRead: () => Promise<void>;
}

const BulletinContext = createContext<BulletinContextValue | null>(null);

export function useBulletins() {
	const context = useContext(BulletinContext);
	if (!context) {
		throw new Error('useBulletins must be used within a BulletinProvider');
	}
	return context;
}

interface BulletinProviderProps {
	children: ReactNode;
}

export function BulletinProvider({ children }: BulletinProviderProps) {
	const [bulletins, setBulletins] = useState<UnreadBulletin[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isMarking, setIsMarking] = useState(false);

	const currentBulletin = bulletins[currentIndex] ?? null;

	useEffect(() => {
		const fetchBulletins = async () => {
			try {
				const response = await getUnreadBulletins();
				if (response?.data) {
					setBulletins(response.data);
				}
			} catch {
				// Silently fail
			} finally {
				setIsLoading(false);
			}
		};

		fetchBulletins();
	}, []);

	const markAsRead = useCallback(async () => {
		if (!currentBulletin || isMarking) return;

		setIsMarking(true);
		try {
			const response = await markBulletinAsRead(currentBulletin.id);
			if (response?.error) {
				toast('Erro ao marcar como lido', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			if (currentIndex < bulletins.length - 1) {
				setCurrentIndex((prev) => prev + 1);
			} else {
				setBulletins([]);
				setCurrentIndex(0);
			}
		} catch {
			toast('Erro ao marcar como lido', {
				description: 'Não foi possível marcar o comunicado como lido.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		} finally {
			setIsMarking(false);
		}
	}, [currentBulletin, currentIndex, bulletins.length, isMarking]);

	return (
		<BulletinContext value={{ bulletins, currentBulletin, isLoading, markAsRead }}>
			{children}
			<BulletinModal
				bulletin={currentBulletin}
				isMarking={isMarking}
				onMarkAsRead={markAsRead}
				totalBulletins={bulletins.length}
				currentIndex={currentIndex}
			/>
		</BulletinContext>
	);
}

