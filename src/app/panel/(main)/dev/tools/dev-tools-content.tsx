'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { Card, TextField, Label, Input, TextArea, Button, Separator, ListBox, Chip, Skeleton, Switch, Select } from '@heroui/react';
import {
	Atom01Icon,
	Settings02Icon,
	ArrowReloadHorizontalIcon,
	MagicWand01Icon,
	ServerStack01Icon,
	Key01Icon,
	SourceCodeSquareIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import { Alert01Icon, CancelCircleIcon, CheckmarkCircle02Icon, InformationCircleIcon, Delete02Icon } from '@hugeicons/core-free-icons';
import { listUsersForDevTools, sendNotification, type DevToolsUser } from '@/app/actions/admin/users';
import { useDebounce } from '@/hooks/use-debounce';
import { PageHeader } from '@/components/ui/page-header';
import { BulletinForm } from '@/components/admin/bulletin-form';
import { NotificationType, NotificationStatusType, NotificationPriority } from '@/types/enums';
import { notificationTypeParse, notificationStatusTypeParse, notificationPriorityParse, mapParseColorToChipColor } from '@/parse';

type LogType = 'info' | 'success' | 'error';

function formatLog(logMessage: string, type: LogType): string {
	const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
	const prefix = type === 'success' ? '✓' : type === 'error' ? '✗' : '›';
	return `[${timestamp}] ${prefix} ${logMessage}`;
}

function getLogClassName(log: string): string {
	if (log.includes('✓')) return 'text-success';
	if (log.includes('✗')) return 'text-danger';
	return 'text-foreground';
}

function UserListSkeleton() {
	return (
		<div className="flex flex-col gap-2 rounded-lg border border-default bg-surface p-4">
			<Skeleton className="h-12 rounded-lg" />
			<Skeleton className="h-12 rounded-lg" />
			<Skeleton className="h-12 rounded-lg" />
		</div>
	);
}

export function DevToolsContent() {
	const [isPending, startTransition] = useTransition();
	const [isSearching, startSearchTransition] = useTransition();
	const [title, setTitle] = useState('🧪 Teste de Notificação');
	const [message, setMessage] = useState('Esta é uma notificação push de teste enviada via Dev Tools!');
	const [actionUrl, setActionUrl] = useState('/panel/dashboard');
	const [logs, setLogs] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [users, setUsers] = useState<DevToolsUser[]>([]);
	const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
	const [selectedUsersData, setSelectedUsersData] = useState<Map<string, DevToolsUser>>(new Map());
	const [hasSearched, setHasSearched] = useState(false);
	const [sendPush, setSendPush] = useState(true);
	const [sendInApp, setSendInApp] = useState(true);
	const [sendToAll, setSendToAll] = useState(false);
	const [notificationType, setNotificationType] = useState<NotificationType>(NotificationType.Info);
	const [statusType, setStatusType] = useState<NotificationStatusType | null>(null);
	const [priority, setPriority] = useState<NotificationPriority>(NotificationPriority.Normal);

	const debouncedSearch = useDebounce(searchQuery);
	const lastSearchRef = useRef<string>('');

	useEffect(() => {
		const trimmedSearch = debouncedSearch.trim();

		if (trimmedSearch === lastSearchRef.current) return;
		lastSearchRef.current = trimmedSearch;

		startSearchTransition(async () => {
			if (!trimmedSearch) {
				setUsers([]);
				setHasSearched(false);
				return;
			}

			const response = await listUsersForDevTools(trimmedSearch);
			setUsers(response?.data ?? []);
			setHasSearched(true);
		});
	}, [debouncedSearch]);

	const addLog = useCallback((logMessage: string, type: LogType = 'info') => {
		setLogs((prev) => [...prev, formatLog(logMessage, type)]);
	}, []);

	function handleClearSelection() {
		setSelectedUserIds(new Set());
		setSelectedUsersData(new Map());
	}

	function handleSelectionChange(keys: 'all' | Set<React.Key>) {
		if (keys === 'all') {
			const enabledUsers = users.filter((u) => u.hasPushEnabled);
			setSelectedUserIds(new Set(enabledUsers.map((u) => u.id)));
			setSelectedUsersData(new Map(enabledUsers.map((u) => [u.id, u])));
		} else {
			const selectedIds = new Set(Array.from(keys) as string[]);
			setSelectedUserIds(selectedIds);
			const newUsersData = new Map<string, DevToolsUser>();
			users.forEach((user) => {
				if (selectedIds.has(user.id)) {
					newUsersData.set(user.id, user);
				}
			});
			setSelectedUsersData(newUsersData);
		}
	}

	function handleSendNotification() {
		if (!sendToAll && selectedUserIds.size === 0) {
			toast('Selecione usuários', {
				description: 'Selecione pelo menos um usuário ou ative "Enviar para todos".',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			return;
		}

		if (!sendPush && !sendInApp) {
			toast('Selecione tipo de notificação', {
				description: 'Selecione pelo menos um tipo de notificação (Push ou In-App).',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			return;
		}

		startTransition(async () => {
			const selectedUsers = Array.from(selectedUserIds)
				.map((id) => selectedUsersData.get(id))
				.filter((user): user is DevToolsUser => user !== undefined);

			const targetCount = sendToAll ? 'todos os usuários' : `${selectedUsers.length} usuário(s)`;
			addLog(`Enviando notificação para ${targetCount}...`, 'info');
			addLog(`  Push: ${sendPush ? '✓' : '✗'} | In-App: ${sendInApp ? '✓' : '✗'}`, 'info');

			try {
				const response = await sendNotification({
					title,
					message,
					actionUrl: actionUrl || undefined,
					sendPush,
					sendInApp,
					sendToAll,
					targetUserIds: sendToAll ? undefined : selectedUsers.map((u) => u.id),
					notificationType,
					statusType: statusType || undefined,
					priority,
				});

				if (response?.error) {
					addLog(`Erro: ${response.error.message}`, 'error');
					toast('Erro ao enviar', {
						description: response.error.message,
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
				} else {
					const data = response?.data;
					addLog(`${response?.message ?? 'Enviado com sucesso!'}`, 'success');
					if (data?.isBatchProcessing && data.batchInfo) {
						addLog(`  ${data.batchInfo}`, 'info');
					}
					addLog(`  Total de alvos: ${data?.totalTargets ?? 0}`, 'info');
					toast('Notificações enviadas', {
						description: response?.message ?? 'Notificações enviadas com sucesso!',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
				addLog(`Erro: ${errorMsg}`, 'error');
				toast('Erro ao enviar', {
					description: 'Ocorreu um erro ao enviar as notificações.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			}

			if (!sendToAll) {
				handleClearSelection();
			}
		});
	}

	function handleShowDeviceInfo() {
		addLog('=== DEVICE INFO ===', 'info');
		addLog(`User Agent: ${navigator.userAgent}`, 'info');
		addLog(`Platform: ${navigator.platform}`, 'info');
		addLog(`Language: ${navigator.language}`, 'info');
		addLog(`Push Supported: ${isSupported}`, 'info');
		addLog(`Notification Permission: ${permission}`, 'info');
		addLog(`Service Worker: ${'serviceWorker' in navigator ? 'Supported' : 'Not supported'}`, 'info');

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then((regs) => {
				addLog(`SW Registrations: ${regs.length}`, 'info');
				regs.forEach((reg, i) => {
					addLog(`  [${i}] Scope: ${reg.scope}`, 'info');
					addLog(`  [${i}] Active: ${!!reg.active}`, 'info');
				});
			});
		}

		const fcmToken = localStorage.getItem('swiftpay_fcm_token');
		addLog(`FCM Token: ${fcmToken ? fcmToken.substring(0, 30) + '...' : 'not found'}`, 'info');
		addLog('=================', 'info');

		toast('Device info registrado', {
			description: 'As informações do dispositivo foram registradas no log.',
			indicator: <Icon icon={InformationCircleIcon} className="icon-sm" />,
			variant: 'default',
		});
	}

	function handleClearLogs() {
		setLogs([]);
		toast('Logs limpos', {
			description: 'Todos os logs foram removidos.',
			indicator: <Icon icon={Delete02Icon} className="icon-sm" />,
			variant: 'default',
		});
	}

	function handleReloadPWA() {
		localStorage.clear();
		window.location.reload();
	}

	const selectedCount = selectedUserIds.size;
	const pluralSuffix = selectedCount !== 1 ? 's' : '';
	const usersWithoutPush = users.filter((u) => !u.hasPushEnabled).map((u) => u.id);

	function renderUserList() {
		if (isSearching) {
			return <UserListSkeleton />;
		}

		if (!hasSearched) {
			return (
				<div className="rounded-lg border border-default bg-surface p-4 text-center text-sm text-muted">
					Digite para buscar usuários
				</div>
			);
		}

		if (users.length === 0) {
			return (
				<div className="rounded-lg border border-default bg-surface p-4 text-center text-sm text-muted">
					Nenhum usuário encontrado
				</div>
			);
		}

		return (
			<div className="rounded-lg border border-default bg-surface">
				<ListBox
					aria-label="Selecione os usuários destinatários"
					selectionMode="multiple"
					selectedKeys={selectedUserIds}
					disabledKeys={usersWithoutPush}
					onSelectionChange={handleSelectionChange}
					className="max-h-60 overflow-y-auto"
				>
					{users.map((user) => (
						<ListBox.Item key={user.id} id={user.id} textValue={user.email}>
							<div className="flex flex-1 items-center justify-between gap-2">
								<div className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-medium">{user.name || user.email}</span>
									{user.name && <span className="truncate text-xs text-muted">{user.email}</span>}
								</div>
								{user.hasPushEnabled && (
									<Chip variant="soft" color="success" size="sm">
										Push ativo
									</Chip>
								)}
							</div>
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Atom01Icon} className="icon-md text-accent-foreground" />}
				title="Dev Tools"
				description="Ferramentas de desenvolvimento e testes disponível apenas para Dev"
			/>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<Card.Header>
						<div className="flex items-center gap-2">
							<Icon icon={Settings02Icon} className="icon-md text-accent" />
							<div>
								<Card.Title>Enviar Notificação</Card.Title>
								<Card.Description>Envie notificações push e/ou in-app para usuários</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Separator />
					<Card.Content className="flex flex-col gap-4">
						<div className="flex flex-col gap-2 rounded-lg bg-surface text-sm">
							<div className="flex items-center gap-2">
								<span className="font-medium">Suporte:</span>
								<span>
									{isSupported ? '✓' : '✗'} {isSupported ? 'Suportado' : 'Não suportado'}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="font-medium">Permissão:</span>
								<span>{permission}</span>
							</div>
						</div>

						<TextField variant="secondary">
							<Label>Buscar Usuários</Label>
							<Input variant="secondary"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Digite nome ou email para filtrar..."
							/>
						</TextField>

						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<Label>
									Destinatários ({selectedCount} selecionado{pluralSuffix})
								</Label>
								{selectedCount > 0 && (
									<Button variant="tertiary" size="sm" onPress={handleClearSelection}>
										Limpar seleção
									</Button>
								)}
							</div>

							{renderUserList()}
						</div>

						<TextField variant="secondary">
							<Label>Título</Label>
							<Input variant="secondary" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da notificação" />
						</TextField>

						<TextField variant="secondary">
							<Label>Mensagem</Label>
							<TextArea variant="secondary"
								value={message}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
								placeholder="Mensagem da notificação"
								rows={3}
							/>
						</TextField>

						<TextField variant="secondary">
							<Label>URL de ação (opcional)</Label>
							<Input variant="secondary" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/panel/dashboard" />
						</TextField>

						<div className="grid gap-4 sm:grid-cols-3">
							<Select									variant="secondary"								className="w-full"
								value={notificationType}
								onChange={(key) => setNotificationType((key || NotificationType.Info) as NotificationType)}
							>
								<Label>Tipo</Label>
								<Select.Trigger>
									<Select.Value>
										<Chip variant="soft" color={mapParseColorToChipColor(notificationTypeParse[notificationType].color)} size="sm" className="gap-1">
											{notificationTypeParse[notificationType].icon}
											{notificationTypeParse[notificationType].label}
										</Chip>
									</Select.Value>
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{Object.entries(notificationTypeParse).map(([key, value]) => (
											<ListBox.Item key={key} id={key} textValue={value.label}>
												<Chip variant="soft" color={mapParseColorToChipColor(value.color)} size="sm" className="gap-1">
													{value.icon}
													{value.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							<Select									variant="secondary"								className="w-full"
								value={statusType ?? 'none'}
								onChange={(key) => setStatusType(key === 'none' || !key ? null : (key as NotificationStatusType))}
							>
								<Label>Status (opcional)</Label>
								<Select.Trigger>
									<Select.Value>
										{statusType ? (
											<Chip variant="soft" color={mapParseColorToChipColor(notificationStatusTypeParse[statusType].color)} size="sm" className="gap-1">
												{notificationStatusTypeParse[statusType].icon}
												{notificationStatusTypeParse[statusType].label}
											</Chip>
										) : (
											<span className="text-muted">Nenhum</span>
										)}
									</Select.Value>
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover className="max-h-60 overflow-y-auto">
									<ListBox>
										<ListBox.Item key="none" id="none" textValue="Nenhum">
											<span className="text-muted">Nenhum</span>
											<ListBox.ItemIndicator />
										</ListBox.Item>
										{Object.entries(notificationStatusTypeParse).map(([key, value]) => (
											<ListBox.Item key={key} id={key} textValue={value.label}>
												<Chip variant="soft" color={mapParseColorToChipColor(value.color)} size="sm" className="gap-1">
													{value.icon}
													{value.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							<Select									variant="secondary"								className="w-full"
								value={priority}
								onChange={(key) => setPriority((key || NotificationPriority.Normal) as NotificationPriority)}
							>
								<Label>Prioridade</Label>
								<Select.Trigger>
									<Select.Value>
										<Chip variant="soft" color={mapParseColorToChipColor(notificationPriorityParse[priority].color)} size="sm" className="gap-1">
											{notificationPriorityParse[priority].icon}
											{notificationPriorityParse[priority].label}
										</Chip>
									</Select.Value>
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{Object.entries(notificationPriorityParse).map(([key, value]) => (
											<ListBox.Item key={key} id={key} textValue={value.label}>
												<Chip variant="soft" color={mapParseColorToChipColor(value.color)} size="sm" className="gap-1">
													{value.icon}
													{value.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>

						<div className="flex flex-col gap-3 rounded-lg border border-default bg-surface p-4">
							<Label className="text-sm font-medium">Opções de Envio</Label>
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<span className="text-sm">Enviar Push Notification</span>
									<Switch isSelected={sendPush} onChange={setSendPush}>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Enviar Notificação In-App</span>
									<Switch isSelected={sendInApp} onChange={setSendInApp}>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<span className="text-sm">Enviar para todos os usuários ativos</span>
									<Switch isSelected={sendToAll} onChange={setSendToAll}>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch>
								</div>
								{sendToAll && (
									<p className="text-xs text-warning">
										⚠️ Isso enviará para todos os usuários com push ativo. Use com cuidado!
									</p>
								)}
							</div>
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<AsyncButton
								variant="primary"
								onPress={handleSendNotification}
								isPending={isPending}
								isDisabled={!sendToAll && selectedCount === 0}
								className="w-full"
							>
								<Icon icon={MagicWand01Icon} className="icon-sm" />
								{sendToAll ? 'Enviar para todos' : `Enviar para ${selectedCount} usuário${pluralSuffix}`}
							</AsyncButton>
							<div className="flex gap-2">
								<Button variant="secondary" onPress={handleShowDeviceInfo} className="w-full sm:w-auto">
									Device Info
								</Button>
								<Button variant="tertiary" onPress={handleReloadPWA} className="w-full sm:w-auto">
									<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
									<span className="sm:hidden">Reload</span>
									<span className="hidden sm:inline">Reload PWA</span>
								</Button>
							</div>
						</div>
					</Card.Content>
				</Card>

				<Card>
					<Card.Header>
						<div className="flex items-center justify-between w-full">
							<div className="flex items-center gap-2">
								<Icon icon={SourceCodeSquareIcon} className="icon-md text-accent" />
								<Card.Title>Console Logs</Card.Title>
							</div>
							<Button variant="tertiary" size="sm" onPress={handleClearLogs}>
								Limpar
							</Button>
						</div>
					</Card.Header>
					<Separator />
					<Card.Content className="flex flex-col gap-4">
						<div className="flex flex-col gap-1 rounded-lg bg-surface p-3 font-mono text-xs max-h-80 overflow-y-auto">
							{logs.length === 0 ? (
								<div className="text-muted">Nenhum log ainda...</div>
							) : (
								logs.map((log, i) => (
									<div key={i} className={getLogClassName(log)}>
										{log}
									</div>
								))
							)}
						</div>

						<div className="rounded-lg bg-surface p-3 text-xs">
							<p className="mb-2 font-semibold">Como ver console no iOS:</p>
							<ol className="ml-4 flex list-decimal flex-col gap-1 text-muted">
								<li>Mac: Safari → Develop → [iPhone] → [swiftpay.app]</li>
								<li>Ou use este console interno do Dev Tools</li>
								<li>Verifique logs com prefixo [FCM] e [PushContext]</li>
							</ol>
						</div>
					</Card.Content>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<BulletinForm addLog={addLog} />
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<Card.Header>
						<div className="flex items-center gap-2">
							<Icon icon={ServerStack01Icon} className="icon-md text-accent" />
							<Card.Title>Endpoint Backend</Card.Title>
						</div>
					</Card.Header>
					<Separator />
					<Card.Content>
						<code className="text-xs text-muted">POST /v1/dev-tools/send-notification</code>
					</Card.Content>
				</Card>

				<Card>
					<Card.Header>
						<div className="flex items-center gap-2">
							<Icon icon={SourceCodeSquareIcon} className="icon-md text-accent" />
							<Card.Title>Service Worker</Card.Title>
						</div>
					</Card.Header>
					<Separator />
					<Card.Content>
						<code className="text-xs text-muted">/firebase-messaging-sw.js</code>
					</Card.Content>
				</Card>

				<Card>
					<Card.Header>
						<div className="flex items-center gap-2">
							<Icon icon={Key01Icon} className="icon-md text-accent" />
							<Card.Title>VAPID Key</Card.Title>
						</div>
					</Card.Header>
					<Separator />
					<Card.Content>
						<code className="text-xs text-muted">BL-IzwALoxd1M5g...</code>
					</Card.Content>
				</Card>
			</div>
		</div>
	);
}

