'use client';

import { useEffect, useState, useTransition } from 'react';
import { UserStatusModal } from '@/components/auth/user-status-modal';
import { clearStatusModalAction, getStatusModalDataAction, shouldShowStatusModalAction } from '@/app/actions/auth';
import { UserStatus } from '@/types/enums';

export function StatusModalProvider() {
	const [showModal, setShowModal] = useState(false);
	const [modalData, setModalData] = useState<{ status: UserStatus; reason?: string | null } | null>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		async function checkModal() {
			const shouldShow = await shouldShowStatusModalAction();
			if (shouldShow) {
				const data = await getStatusModalDataAction();
				if (data) {
					setModalData(data);
					setShowModal(true);
				}
			}
		}
		checkModal();
	}, []);

	function handleConfirm() {
		startTransition(async () => {
			await clearStatusModalAction();
			setShowModal(false);
			setModalData(null);
		});
	}

	if (!modalData) return null;

	return (
		<UserStatusModal
			isOpen={showModal}
			status={modalData.status}
			reason={modalData.reason}
			onConfirm={handleConfirm}
			isPending={isPending}
		/>
	);
}
