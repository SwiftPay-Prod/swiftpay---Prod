'use client';

import { useState, Suspense } from 'react';
import { Popover } from '@heroui/react';
import { ProfilePopoverContent, ProfilePopoverSkeleton } from './profile-popover';
import { EmblemDetailModal } from './emblem-detail-modal';
import { getPublicProfile } from '@/app/actions/user';
import type { ApiResponse } from '@/types/common';
import type { UserPublicProfile, PublicProfileEmblem } from '@/types/user';

type PublicProfilePromise = Promise<ApiResponse<UserPublicProfile>>;
type PopoverPlacement = React.ComponentProps<typeof Popover.Content>['placement'];

type UserProfilePopoverProps = {
	userId?: string;
	userPublicProfile?: UserPublicProfile | null;
	placement?: PopoverPlacement;
	children: React.ReactNode;
};

export function UserProfilePopover({
	userId,
	userPublicProfile,
	placement = 'top',
	children,
}: UserProfilePopoverProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [profilePromise, setProfilePromise] = useState<PublicProfilePromise | null>(null);
	const [selectedEmblem, setSelectedEmblem] = useState<PublicProfileEmblem | null>(null);
	const [isEmblemModalOpen, setIsEmblemModalOpen] = useState(false);

	function handleOpenChange(open: boolean) {
		setIsOpen(open);
		if (open && !profilePromise) {
			if (userPublicProfile) {
				setProfilePromise(
					Promise.resolve({
						data: userPublicProfile,
						message: null,
						error: null,
					})
				);
				return;
			}

			if (userId) {
				setProfilePromise(getPublicProfile(userId));
			}
		}
	}

	function handleEmblemClick(emblem: PublicProfileEmblem) {
		setIsOpen(false);
		setSelectedEmblem(emblem);
		setIsEmblemModalOpen(true);
	}

	return (
		<>
			<Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
				<Popover.Trigger>{children}</Popover.Trigger>
				<Popover.Content placement={placement} className="p-0">
					<Popover.Dialog>
						{profilePromise ? (
							<Suspense fallback={<ProfilePopoverSkeleton />}>
								<ProfilePopoverContent profilePromise={profilePromise} onEmblemClick={handleEmblemClick} />
							</Suspense>
						) : (
							<ProfilePopoverSkeleton />
						)}
					</Popover.Dialog>
				</Popover.Content>
			</Popover>
			<EmblemDetailModal emblem={selectedEmblem} isOpen={isEmblemModalOpen} onOpenChange={setIsEmblemModalOpen} />
		</>
	);
}
