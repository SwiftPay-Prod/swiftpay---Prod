'use client';

import { useTransition } from 'react';
import { toast } from '@heroui/react';
import { Link01Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { generateMyReferralLink } from '@/app/actions/user';
import { AsyncButton } from '@/components/ui/async-button';

export function GenerateReferralLinkButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleGenerate() {
		startTransition(async () => {
			const response = await generateMyReferralLink();

			if (response?.error) {
				toast('Não foi possível gerar o link', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			toast('Link gerado com sucesso', {
				description: 'Seu link permanente de indicação já está disponível.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});

			router.refresh();
		});
	}

	return (
		<AsyncButton variant="primary" onPress={handleGenerate} isPending={isPending}>
			<Icon icon={Link01Icon} className="icon-sm" />
			Gerar link permanente
		</AsyncButton>
	);
}
