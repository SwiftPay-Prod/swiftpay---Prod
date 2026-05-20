'use client';

import { useState, useEffect } from 'react';
import { Card, Chip, Skeleton } from '@heroui/react';
import {
	CheckmarkCircle02Icon,
	Settings02Icon,
	InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { adminGetAcquirerPixNominalHistory } from '@/app/actions/admin/acquirers';
import type { AdminAcquirerPixNominalHistoryItem } from '@/types/admin/acquirers';

interface PixNominalHistoryTabProps {
	acquirerId: string;
}

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(new Date(iso));
}

function HistorySkeleton() {
	return (
		<div className="flex flex-col gap-2 p-4">
			{[...Array(5)].map((_, i) => (
				<Skeleton key={i} className="h-14 rounded-lg" />
			))}
		</div>
	);
}

export function PixNominalHistoryTab({ acquirerId }: PixNominalHistoryTabProps) {
	const [history, setHistory] = useState<AdminAcquirerPixNominalHistoryItem[] | null>(null);

	const isLoading = history === null;

	useEffect(() => {
		let cancelled = false;
		adminGetAcquirerPixNominalHistory(acquirerId).then((response) => {
			if (!cancelled) {
				setHistory(response?.data ?? []);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [acquirerId]);

	if (isLoading) {
		return (
			<Card>
				<HistorySkeleton />
			</Card>
		);
	}

	if (!history || history.length === 0) {
		return (
			<Card>
				<div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
					<div className="flex size-12 items-center justify-center rounded-full bg-surface">
						<Icon icon={InformationCircleIcon} className="icon-md text-muted" />
					</div>
					<div className="flex flex-col gap-1">
						<p className="font-medium">Nenhum histórico encontrado</p>
						<p className="text-sm text-muted">
							As alterações da nominal PIX desta processadora serão registradas aqui automaticamente ou
							ao editar manualmente.
						</p>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border text-left">
							<th className="px-4 py-3 font-medium text-muted">Data / Hora</th>
							<th className="px-4 py-3 font-medium text-muted">Nominal antiga</th>
							<th className="px-4 py-3 font-medium text-muted">Nominal nova</th>
							<th className="px-4 py-3 font-medium text-muted">Origem</th>
							<th className="px-4 py-3 font-medium text-muted">Referência</th>
						</tr>
					</thead>
					<tbody>
						{history.map((item) => (
							<tr key={item.id} className="border-b border-border/50 last:border-b-0">
								<td className="px-4 py-3 text-nowrap text-muted">
									{formatDate(item.createdAt)}
								</td>
								<td className="px-4 py-3">
									{item.previousNominal ? (
										<span className="font-mono text-xs text-foreground">{item.previousNominal}</span>
									) : (
										<span className="text-muted/50">—</span>
									)}
								</td>
								<td className="px-4 py-3">
									<span className="font-mono text-xs font-medium">{item.newNominal}</span>
								</td>
								<td className="px-4 py-3">
									{item.source === 'Automatic' ? (
										<Chip size="sm" variant="soft" color="success" className="gap-1">
											<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
											Automático
										</Chip>
									) : (
										<Chip size="sm" variant="soft" color="accent" className="gap-1">
											<Icon icon={Settings02Icon} className="icon-xs" />
											Manual
										</Chip>
									)}
								</td>
								<td className="px-4 py-3">
									{item.source === 'Manual' && item.changedByUserName ? (
										<span className="text-xs text-muted">{item.changedByUserName}</span>
									) : item.detectedFromPaymentId ? (
										<span className="font-mono text-xs text-muted">
											{item.detectedFromPaymentId.slice(0, 8)}…
										</span>
									) : (
										<span className="text-muted/50">—</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
