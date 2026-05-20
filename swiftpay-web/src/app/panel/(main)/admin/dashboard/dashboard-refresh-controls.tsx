'use client';

import { Spinner, Tooltip } from '@heroui/react';
import { ArrowReloadHorizontalIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { formatRelativeTime } from '@/utils/datetime';
import type { AdminDashboardCacheInfo } from '@/types/admin/dashboard';

export function DashboardRefreshControls({
	cacheInfo,
	isRefreshing,
	onRefresh,
}: {
	cacheInfo: AdminDashboardCacheInfo;
	isRefreshing: boolean;
	onRefresh: () => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			{cacheInfo.isProcessing && (
				<div className="flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1">
					<Spinner size="sm" color="warning" />
					<span className="text-xs font-medium text-warning">Atualizando estatisticas...</span>
				</div>
			)}
			{cacheInfo.lastUpdatedAt && (
				<div className="flex items-center gap-1.5">
					<span className="text-xs text-muted">Atualizado {formatRelativeTime(cacheInfo.lastUpdatedAt)}</span>
					<Tooltip>
						<Tooltip.Trigger>
							<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
						</Tooltip.Trigger>
						<Tooltip.Content className="max-w-72">
							<Tooltip.Arrow />
							<span className="font-medium">Como funciona a atualizacao?</span>
							<br />
							{cacheInfo.cacheDurationMinutes > 0 ? (
								<span className="text-xs">
									As estatisticas do dashboard sao atualizadas a cada {cacheInfo.cacheDurationMinutes} minutos para
									melhor performance.
								</span>
							) : (
								<span className="text-xs">
									As estatisticas estao sendo calculadas em tempo real para o periodo selecionado.
								</span>
							)}
						</Tooltip.Content>
					</Tooltip>
				</div>
			)}
			{!cacheInfo.lastUpdatedAt && !cacheInfo.isProcessing && (
				<span className="text-xs text-muted">Aguardando primeiro processamento...</span>
			)}
			<AsyncButton variant="secondary" size="sm" onPress={onRefresh} isPending={isRefreshing}>
				<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
				Atualizar
			</AsyncButton>
		</div>
	);
}

