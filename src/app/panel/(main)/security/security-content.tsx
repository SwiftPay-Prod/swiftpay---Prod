'use client';

import { useState, useTransition } from 'react';
import { Button, Card, Chip, Description, Tooltip } from '@heroui/react';
import { AsyncButton } from '@/components/ui/async-button';
import { Icon } from '@/components/ui/icon';
import {
	ArrowReloadHorizontalIcon,
	Calendar03Icon,
	CheckmarkCircle02Icon,
	ComputerIcon,
	GlobalIcon,
	Key01Icon,
	LaptopIcon,
	LogoutCircle01Icon,
	MapPinIcon,
	SecurityLockIcon,
	Shield01Icon,
	SmartPhone01Icon,
	Time01Icon,
} from '@hugeicons/core-free-icons';
import type { TrustedDeviceData } from '@/types/auth';
import { revokeDevice, revokeAllDevices } from '@/app/actions/auth';
import { RelativeTime } from '@/components/ui/relative-time';
import { FormattedDate } from '@/components/ui/formatted-date';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { ChangePasswordModal } from './change-password-modal';
import { toast } from '@heroui/react';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';

interface SecurityContentProps {
	devices: TrustedDeviceData[];
	onRefresh?: () => void;
	isRefreshing?: boolean;
}

export function SecurityContent({ devices, onRefresh, isRefreshing }: SecurityContentProps) {
	const [isPending, startTransition] = useTransition();
	const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean; device: TrustedDeviceData | null }>({
		isOpen: false,
		device: null,
	});
	const [revokeAllModal, setRevokeAllModal] = useState(false);
	const [changePasswordModal, setChangePasswordModal] = useState(false);

	const otherDevices = devices.filter((d) => !d.isCurrent);

	function getDeviceIcon(device: TrustedDeviceData) {
		const os = device.operatingSystem?.toLowerCase() ?? '';
		const browser = device.browser?.toLowerCase() ?? '';

		if (os.includes('android') || os.includes('ios') || browser.includes('mobile')) {
			return <Icon icon={SmartPhone01Icon} className="icon-md text-accent" />;
		}
		if (os.includes('mac') || os.includes('windows') || os.includes('linux')) {
			return <Icon icon={LaptopIcon} className="icon-md text-accent" />;
		}
		return <Icon icon={ComputerIcon} className="icon-md text-accent" />;
	}

	function renderMobileDeviceCard(device: TrustedDeviceData, _index: number, openActions?: () => void) {
		return (
			<div
				className={`rounded-xl border border-border bg-surface p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
				onClick={openActions}
				role={openActions ? 'button' : undefined}
				tabIndex={openActions ? 0 : undefined}
				onKeyDown={
					openActions
						? (event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									openActions();
								}
							}
						: undefined
				}
			>
				<div className="flex flex-col gap-2">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2">
							{getDeviceIcon(device)}
							<span className="text-sm font-medium">{device.deviceName}</span>
						</div>
						{device.isCurrent ? (
							<Chip variant="soft" color="success" className="text-xs shrink-0">
								<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
								Este dispositivo
							</Chip>
						) : (
							<Chip variant="soft" color="default" className="text-xs shrink-0">
								Ativo
							</Chip>
						)}
					</div>
					{(device.browser || device.operatingSystem) && (
						<span className="text-xs text-muted">
							{device.browser}
							{device.browser && device.operatingSystem && ' • '}
							{device.operatingSystem}
						</span>
					)}
					{device.lastIpAddress && (
						<div className="flex items-center gap-1.5">
							<Icon icon={GlobalIcon} className="icon-xs text-muted shrink-0" />
							<span className="text-xs text-muted font-mono">{device.lastIpAddress}</span>
						</div>
					)}
					{device.lastLocation && (
						<div className="flex items-center gap-1.5">
							<Icon icon={MapPinIcon} className="icon-xs text-muted shrink-0" />
							<span className="text-xs text-muted">{device.lastLocation}</span>
						</div>
					)}
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-1.5">
							<Icon icon={Time01Icon} className="icon-xs text-muted shrink-0" />
							<span className="text-xs text-muted">
								Último acesso: <RelativeTime date={device.lastUsedAt} />
							</span>
						</div>
						<FormattedDate date={device.lastUsedAt} className="text-xs text-muted pl-5" />
					</div>
					<div className="flex items-center gap-1.5">
						<Icon icon={Calendar03Icon} className="icon-xs text-muted shrink-0" />
						<FormattedDate date={device.createdAt} className="text-xs text-muted" />
					</div>
				</div>
			</div>
		);
	}

	const columns: DataTableColumn<TrustedDeviceData>[] = [
		{
			key: 'deviceName',
			header: 'Dispositivo',
			render: (device) => (
				<div className="flex items-center gap-3">
					{getDeviceIcon(device)}
					<span className="font-medium text-foreground">{device.deviceName}</span>
				</div>
			),
		},
		{
			key: 'browser',
			header: 'Navegador / SO',
			render: (device) => (
				<div className="flex flex-col gap-0.5">
					<span className="text-sm text-foreground">{device.browser || '—'}</span>
					<span className="text-xs text-muted">{device.operatingSystem || '—'}</span>
				</div>
			),
		},
		{
			key: 'lastIpAddress',
			header: 'Endereço IP',
			render: (device) => (
				<div className="flex items-center gap-2">
					<Icon icon={GlobalIcon} className="icon-sm text-muted" />
					<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
						{device.lastIpAddress || '—'}
					</code>
				</div>
			),
		},
		{
			key: 'lastLocation',
			header: 'Localização',
			render: (device) =>
				device.lastLocation ? (
					<div className="flex items-center gap-2">
							<Icon icon={MapPinIcon} className="icon-sm text-muted" />
						<span className="text-sm text-foreground">{device.lastLocation}</span>
					</div>
				) : (
					<span className="text-sm text-muted">—</span>
				),
		},
		{
			key: 'lastUsedAt',
			header: 'Último Acesso',
			render: (device) => (
				<div className="flex items-center gap-2">
					<Icon icon={Time01Icon} className="icon-sm text-muted" />
					<div className="flex flex-col gap-0.5">
						<RelativeTime date={device.lastUsedAt} className="text-sm text-foreground" />
						<FormattedDate date={device.lastUsedAt} className="text-xs text-muted" />
					</div>
				</div>
			),
		},
		{
			key: 'createdAt',
			header: 'Cadastrado em',
			render: (device) => (
				<div className="flex items-center gap-2">
					<Icon icon={Calendar03Icon} className="icon-sm text-muted" />
					<FormattedDate date={device.createdAt} className="text-sm text-muted" />
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (device) =>
				device.isCurrent ? (
					<Chip variant="soft" color="success" size="sm" className="gap-1">
						<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
						Este dispositivo
					</Chip>
				) : (
					<Chip variant="soft" color="default" size="sm">
						Ativo
					</Chip>
				),
		},
		{
			key: 'actions',
			header: 'Ações',
			render: (device) =>
				device.isCurrent ? (
					<span className="text-sm text-muted">—</span>
				) : (
					<Tooltip>
						<Button
							isIconOnly
							variant="danger-soft"
							size="sm"
							onPress={() => setRevokeModal({ isOpen: true, device })}
						>
							<Icon icon={LogoutCircle01Icon} className="icon-sm" />
							<Tooltip.Content>Desconectar dispositivo</Tooltip.Content>
						</Button>
					</Tooltip>
				),
		},
	];

	async function handleRevokeDevice() {
		if (!revokeModal.device) return;

		startTransition(async () => {
			const response = await revokeDevice(revokeModal.device!.deviceId);

			if (response.error) {
				toast('Erro ao remover dispositivo', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				toast('Dispositivo removido', {
					description: 'O dispositivo foi desconectado com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				onRefresh?.();
			}

			setRevokeModal({ isOpen: false, device: null });
		});
	}

	async function handleRevokeAllDevices() {
		startTransition(async () => {
			const response = await revokeAllDevices(true);

			if (response.error) {
				toast('Erro ao remover dispositivos', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				toast('Dispositivos removidos', {
					description: `${response.data?.revokedCount ?? 0} dispositivo(s) removido(s) com sucesso.`,
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				onRefresh?.();
			}

			setRevokeAllModal(false);
		});
	}

	return (
		<div className="flex flex-col gap-4">
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
							<Card.Title>Alterar Senha</Card.Title>
							<Description>Altere sua senha de acesso à plataforma</Description>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<p className="text-sm text-muted">
							Para sua segurança, você precisará informar a senha atual antes de definir uma nova.
						</p>
						<Button
							variant="secondary"
							className="w-fit shrink-0"
							onPress={() => setChangePasswordModal(true)}
						>
							<Icon icon={SecurityLockIcon} className="icon-sm" />
							Alterar Senha
						</Button>
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
							<p className="text-sm text-muted">
								{devices.length === 1
									? '1 dispositivo conectado'
									: `${devices.length} dispositivos conectados`}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{onRefresh && (
							<Tooltip>
								<AsyncButton isIconOnly variant="secondary" onPress={onRefresh} isPending={isRefreshing}>
									<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
									<Tooltip.Content>Atualizar lista</Tooltip.Content>
								</AsyncButton>
							</Tooltip>
						)}
						{otherDevices.length > 0 && (
							<Button variant="danger" onPress={() => setRevokeAllModal(true)}>
								<Icon icon={LogoutCircle01Icon} className="icon-sm" />
								Desconectar Outros ({otherDevices.length})
							</Button>
						)}
					</div>
				</div>

				<DataTable
					columns={columns}
					data={devices}
					keyExtractor={(device) => device.id}
					isLoading={isRefreshing}
					skeletonRows={3}
					emptyMessage="Nenhum dispositivo encontrado"
					minWidth="min-w-200"
					renderMobileCard={renderMobileDeviceCard}
					rowClassName={(device) => (device.isCurrent ? 'bg-success/5' : '')}
				/>

				{devices.length === 1 && devices[0]?.isCurrent && (
					<div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success-soft-hover">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft-hover">
							<Icon icon={CheckmarkCircle02Icon} className="icon-md text-success" />
						</div>
						<div>
							<p className="font-medium text-foreground">Tudo certo!</p>
							<p className="text-sm text-muted">Este é o único dispositivo conectado à sua conta.</p>
						</div>
					</div>
				)}
			</div>

			<ConfirmationModal
				isOpen={revokeModal.isOpen}
				onOpenChange={(isOpen) => setRevokeModal({ isOpen, device: isOpen ? revokeModal.device : null })}
				title="Desconectar Dispositivo"
				description={`Tem certeza que deseja desconectar "${revokeModal.device?.deviceName}"? Este dispositivo precisará verificar novamente ao fazer login.`}
				status="danger"
				confirmLabel="Desconectar"
				isPending={isPending}
				onConfirm={handleRevokeDevice}
			/>

			<ConfirmationModal
				isOpen={revokeAllModal}
				onOpenChange={setRevokeAllModal}
				title="Desconectar Todos os Dispositivos"
				description={`Tem certeza que deseja desconectar ${otherDevices.length} dispositivo(s)? O dispositivo atual será mantido. Todos os outros dispositivos precisarão verificar novamente.`}
				status="danger"
				confirmLabel="Desconectar Todos"
				isPending={isPending}
				onConfirm={handleRevokeAllDevices}
			/>

			<ChangePasswordModal
				isOpen={changePasswordModal}
				onOpenChange={setChangePasswordModal}
			/>
		</div>
	);
}

