'use client';

import { Card, Skeleton } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ComputerIcon, Key01Icon, Shield01Icon } from '@hugeicons/core-free-icons';

export function SecuritySkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-3 rounded-xl bg-surface p-4">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
					<Icon icon={Shield01Icon} className="icon-md text-accent-foreground" />
				</div>
				<div>
					<h1 className="text-lg font-semibold text-foreground">Segurança</h1>
					<p className="text-sm text-muted">Gerencie a segurança da sua conta</p>
				</div>
			</div>

			<Card variant="secondary">
				<Card.Header>
					<div className="flex items-center gap-3">
						<Icon icon={Key01Icon} className="icon-md text-accent" />
						<div className="flex flex-col gap-1">
							<Skeleton className="h-5 w-32 rounded-lg" />
							<Skeleton className="h-4 w-56 rounded-lg" />
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<Skeleton className="h-4 w-80 rounded-lg" />
						<Skeleton className="h-10 w-36 rounded-lg" />
					</div>
				</Card.Content>
			</Card>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
							<Icon icon={ComputerIcon} className="icon-md text-accent-foreground" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-foreground">Dispositivos Conectados</h2>
							<Skeleton className="h-4 w-40 rounded-lg mt-1" />
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-border bg-surface overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full min-w-200">
							<thead>
								<tr className="border-b border-border bg-surface-secondary">
									{['Dispositivo', 'Navegador / SO', 'Endereço IP', 'Localização', 'Último Acesso', 'Cadastrado em', 'Status', 'Ações'].map((header) => (
										<th key={header} className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
											{header}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: 3 }).map((_, index) => (
									<tr key={index} className="border-b border-border last:border-b-0">
										{Array.from({ length: 8 }).map((_, cellIndex) => (
											<td key={cellIndex} className="px-4 py-4">
												<Skeleton className="h-5 w-full max-w-24 rounded-lg" />
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

