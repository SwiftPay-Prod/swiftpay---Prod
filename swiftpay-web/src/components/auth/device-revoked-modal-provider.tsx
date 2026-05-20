'use client';

import { useEffect, useState, useTransition } from 'react';
import { DeviceRevokedModal } from '@/components/auth/device-revoked-modal';
import { clearDeviceRevokedModalAction, getDeviceRevokedModalDataAction, shouldShowDeviceRevokedModalAction } from '@/app/actions/auth';

export function DeviceRevokedModalProvider() {
	const [showModal, setShowModal] = useState(false);
	const [modalData, setModalData] = useState<{ deviceName: string; reason: string } | null>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		async function checkModal() {
			const shouldShow = await shouldShowDeviceRevokedModalAction();
			if (shouldShow) {
				const data = await getDeviceRevokedModalDataAction();
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
			await clearDeviceRevokedModalAction();
			setShowModal(false);
			setModalData(null);
		});
	}

	if (!modalData) return null;

	return (
		<DeviceRevokedModal
			isOpen={showModal}
			deviceName={modalData.deviceName}
			reason={modalData.reason}
			onConfirm={handleConfirm}
			isPending={isPending}
		/>
	);
}

