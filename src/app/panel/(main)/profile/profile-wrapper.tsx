'use client';

import { use, useRef, useState, useTransition, Suspense, type ComponentProps } from 'react';
import Image from 'next/image';
import {
	Card,
	Modal,
	Checkbox,
	TextField,
	Input,
	TextArea,
	Label,
	Description,
	FieldError,
	Tooltip,
	Button,
	Switch,
	Tabs,
} from '@heroui/react';
import { InternalTabs } from '@/components/ui/internal-tabs';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/ui/icon';
import {
	Camera01Icon,
	Delete02Icon,
	FacebookIcon,
	InstagramIcon,
	TiktokIcon,
	UserCircleIcon,
	DiscordIcon,
	TelegramIcon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	TwitterIcon,
	Medal01Icon,
	Alert01Icon,
	StarAward02Icon,
} from '@hugeicons/core-free-icons';
import { toast } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';
import { FormSaveFooter } from '@/components/ui/form-save-footer';
import { deleteMyAvatar, updateMyProfile, uploadMyAvatar } from '@/app/actions/user';
import { useUser } from '@/contexts/user-context';
import type { UserProfile, UserSocialLinks, UpdateProfileRequest } from '@/types/user';
import type { MerchantAchievementsData } from '@/types/merchant/achievements';
import type { ApiResponse } from '@/types/common';
import { ProfileBordersTab } from './profile-borders-tab';
import { ProfileEmblemsTab } from './profile-emblems-tab';

type ProfilePromise = Promise<ApiResponse<UserProfile>>;
type AchievementsPromise = Promise<ApiResponse<MerchantAchievementsData>>;

interface ProfileWrapperProps {
	profilePromise: ProfilePromise;
	achievementsPromise: AchievementsPromise;
}

function parseSocialLinks(raw: string | null | undefined): UserSocialLinks {
	if (!raw) return {};
	try {
		return JSON.parse(raw) as UserSocialLinks;
	} catch {
		return {};
	}
}

function getInitials(name: string | null | undefined) {
	if (!name) return 'U';
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
}

type SocialNetworkKey = 'instagram' | 'x' | 'facebook' | 'tiktok' | 'discord' | 'telegram';

const SOCIAL_NETWORKS: { key: SocialNetworkKey; label: string; icon: ComponentProps<typeof Icon>['icon']; placeholder: string }[] = [
	{ key: 'instagram', label: 'Instagram', icon: InstagramIcon, placeholder: '@usuario' },
	{ key: 'x', label: 'X (Twitter)', icon: TwitterIcon, placeholder: '@usuario' },
	{ key: 'facebook', label: 'Facebook', icon: FacebookIcon, placeholder: 'usuario ou URL' },
	{ key: 'tiktok', label: 'TikTok', icon: TiktokIcon, placeholder: '@usuario' },
	{ key: 'discord', label: 'Discord', icon: DiscordIcon, placeholder: 'usuario ou URL' },
	{ key: 'telegram', label: 'Telegram', icon: TelegramIcon, placeholder: '@usuario' },
];

interface AvatarSectionProps {
	profileImageUrl: string | null | undefined;
	name: string | null | undefined;
	onAvatarUploaded: (url: string) => void;
	onAvatarDeleted: () => void;
}

function AvatarSection({ profileImageUrl, name, onAvatarUploaded, onAvatarDeleted }: AvatarSectionProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadPending, startUploadTransition] = useTransition();
	const [deletePending, startDeleteTransition] = useTransition();
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [policyConfirmed, setPolicyConfirmed] = useState(false);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setPendingFile(file);
		setIsConfirmOpen(true);
	}

	function handleConfirmUpload() {
		if (!pendingFile) return;
		setIsConfirmOpen(false);
		setPolicyConfirmed(false);
		const file = pendingFile;
		setPendingFile(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
		const formData = new FormData();
		formData.append('file', file);
		startUploadTransition(async () => {
			const res = await uploadMyAvatar(formData);
			if (res?.error) {
				toast('Erro ao fazer upload', {
					description: res.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else if (res?.data?.url) {
				onAvatarUploaded(res.data.url);
				toast('Foto atualizada!', {
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	function handleCancelUpload() {
		setIsConfirmOpen(false);
		setPendingFile(null);
		setPolicyConfirmed(false);
		if (fileInputRef.current) fileInputRef.current.value = '';
	}

	function handleDelete() {
		startDeleteTransition(async () => {
			const res = await deleteMyAvatar();
			if (res?.error) {
				toast('Erro ao remover foto', {
					description: res.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				onAvatarDeleted();
				toast('Foto removida', {
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	const isLoading = uploadPending || deletePending;

	return (
		<div className="flex items-center gap-4">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				className="hidden"
				onChange={handleFileChange}
			/>

			<div className="relative shrink-0 group">
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={isLoading}
					className="relative w-24 h-24 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					{profileImageUrl ? (
						<Image
							src={profileImageUrl}
							alt="Foto de perfil"
							fill
							className="object-cover"
							unoptimized={!!profileImageUrl?.toLowerCase().endsWith('.gif')}
						/>
					) : (
						<span className="text-xl font-semibold text-accent">{getInitials(name)}</span>
					)}
					<div
						className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
					>
						{isLoading ? (
							<div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
						) : (
							<Icon icon={Camera01Icon} className="icon-sm text-white" />
						)}
					</div>
				</button>

				{profileImageUrl && (
					<Tooltip>
						<Button
							type="button"
							isIconOnly
							size="sm"
							variant="danger"
							isPending={deletePending}
							onPress={handleDelete}
							className="absolute -top-1 -right-1 w-7 h-7 min-w-0 rounded-full p-0"
						>
							<Icon icon={Delete02Icon} className="icon-xs" />
						</Button>
						<Tooltip.Content>Remover foto</Tooltip.Content>
					</Tooltip>
				)}
			</div>

			<div className="flex flex-col gap-0.5">
				<span className="text-sm font-medium">Foto de perfil</span>
				<Description className="text-xs text-muted">
					Clique na foto para alterar. JPG, PNG, WebP ou GIF animado. Máx. 5 MB.
				</Description>
			</div>

			<Modal.Backdrop
				isOpen={isConfirmOpen}
				onOpenChange={(open) => {
					if (!open) handleCancelUpload();
				}}
			>
				<Modal.Container placement="center" scroll="outside">
					<Modal.Dialog className="max-w-sm">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-warning-soft-hover text-warning">
								<Icon icon={Alert01Icon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Política de conteúdo</Modal.Heading>
							<p className="text-sm text-muted">Leia antes de enviar sua foto de perfil</p>
						</Modal.Header>
						<Modal.Body>
							<p className="text-sm">
								Sua conta pode ser{' '}
								<strong className="text-danger">suspensa permanentemente</strong> se a imagem
								contiver:
							</p>
							<ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted">
								<li>• Conteúdo +18, nudez ou sexualização</li>
								<li>• Armas, violência ou automutilação</li>
								<li>• Drogas ou substâncias ilícitas</li>
								<li>• Imagem de outra pessoa sem consentimento</li>
								<li>• Conteúdo discriminatório, ofensivo ou sensível</li>
							</ul>
						<Checkbox
							id="policy-confirm"
							isSelected={policyConfirmed}
							onChange={setPolicyConfirmed}
							className="mt-4 items-start"
                            variant="secondary"
						>
							<Checkbox.Control>
								<Checkbox.Indicator />
							</Checkbox.Control>
							<Checkbox.Content>
								<Label htmlFor="policy-confirm" className="text-sm text-muted leading-snug cursor-pointer">
									Li e estou ciente desta política. Confirmo que a imagem respeita os{' '}
									<strong className="text-foreground">termos de uso</strong> da plataforma.
								</Label>
							</Checkbox.Content>
						</Checkbox>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleCancelUpload}>
								Cancelar
							</Button>
							<Button variant="primary" onPress={handleConfirmUpload} isDisabled={!policyConfirmed}>
								Confirmar e enviar
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

const profileFormSchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório.').max(100, 'Nome deve ter no máximo 100 caracteres.'),
	bio: z.string().max(300, 'Bio deve ter no máximo 300 caracteres.').optional(),
	instagram: z.string().max(100).optional(),
	x: z.string().max(100).optional(),
	facebook: z.string().max(100).optional(),
	tiktok: z.string().max(100).optional(),
	discord: z.string().max(100).optional(),
	telegram: z.string().max(100).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
	profile: UserProfile;
	currentAvatarUrl: string | null | undefined;
	onAvatarUploaded: (url: string) => void;
	onAvatarDeleted: () => void;
	onNameUpdated: (name: string) => void;
}

function ProfileForm({ profile, currentAvatarUrl, onAvatarUploaded, onAvatarDeleted, onNameUpdated }: ProfileFormProps) {
	const socialLinks = parseSocialLinks(profile.socialLinks);
	const [isPending, startTransition] = useTransition();
	const [enabledNetworks, setEnabledNetworks] = useState<Record<SocialNetworkKey, boolean>>(() => {
		const keys: SocialNetworkKey[] = ['instagram', 'x', 'facebook', 'tiktok', 'discord', 'telegram'];
		return Object.fromEntries(keys.map((key) => [key, socialLinks.visibility?.[key] !== false])) as Record<
			SocialNetworkKey,
			boolean
		>;
	});

	const { control, handleSubmit } = useForm<ProfileFormValues>({
		resolver: zodResolver(profileFormSchema),
		mode: 'onChange',
		defaultValues: {
			name: profile.name ?? '',
			bio: profile.bio ?? '',
			instagram: socialLinks.instagram ?? '',
			x: socialLinks.x ?? '',
			facebook: socialLinks.facebook ?? '',
			tiktok: socialLinks.tiktok ?? '',
			discord: socialLinks.discord ?? '',
			telegram: socialLinks.telegram ?? '',
		},
	});

	const bioValue = useWatch({ control, name: 'bio' });
	const bioLength = bioValue?.length ?? 0;

	function onSubmit(values: ProfileFormValues) {
		startTransition(async () => {
			const networkKeys: SocialNetworkKey[] = ['instagram', 'x', 'facebook', 'tiktok', 'discord', 'telegram'];
			const disabledNetworks = networkKeys.filter((key) => !enabledNetworks[key]);
			const visibility =
				disabledNetworks.length > 0
					? (Object.fromEntries(disabledNetworks.map((key) => [key, false])) as UserSocialLinks['visibility'])
					: undefined;

			const links: UserSocialLinks = {
				instagram: values.instagram || undefined,
				x: values.x || undefined,
				facebook: values.facebook || undefined,
				tiktok: values.tiktok || undefined,
				discord: values.discord || undefined,
				telegram: values.telegram || undefined,
				...(visibility ? { visibility } : {}),
			};

			const hasLinks = networkKeys.some((key) => !!links[key]) || !!visibility;

			const payload: UpdateProfileRequest = {
				name: values.name.trim(),
				bio: values.bio?.trim() || null,
				socialLinks: hasLinks ? JSON.stringify(links) : null,
			};

			const res = await updateMyProfile(payload);
			if (res?.error) {
				toast('Erro ao salvar perfil', {
					description: res.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				onNameUpdated(values.name.trim());
				toast('Perfil atualizado!', {
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	return (
		<form action="" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
			<AvatarSection
				profileImageUrl={currentAvatarUrl}
				name={profile.name}
				onAvatarUploaded={onAvatarUploaded}
				onAvatarDeleted={onAvatarDeleted}
			/>

			<Controller
				name="name"
				control={control}
				render={({ field, fieldState }) => (
					<TextField variant="secondary" isRequired isInvalid={!!fieldState.error}>
						<Label>Nome</Label>
						<Input {...field} variant="secondary" placeholder="Seu nome completo" />
						<FieldError>{fieldState.error?.message}</FieldError>
					</TextField>
				)}
			/>

			<div className="flex flex-col gap-1">
				<Controller
					name="bio"
					control={control}
					render={({ field, fieldState }) => (
					<TextField variant="secondary" isInvalid={!!fieldState.error}>
							<Label>Bio</Label>
							<TextArea
								{...field}
								variant="secondary"
								placeholder="Conte um pouco sobre você..."
								rows={3}
								maxLength={300}
								className="resize-none"
							/>
							<FieldError>{fieldState.error?.message}</FieldError>
						</TextField>
					)}
				/>
				<span className={`text-xs text-right ${bioLength > 280 ? 'text-warning' : 'text-muted'}`}>{bioLength}/300</span>
			</div>

			<div className="flex flex-col gap-2">
				<div>
					<span className="text-sm font-medium">Redes Sociais</span>
					<p className="text-xs text-muted mt-0.5">Ative as redes que deseja exibir no ranking.</p>
				</div>
				<div className="flex flex-col gap-1.5">
					{SOCIAL_NETWORKS.map(({ key, label, icon, placeholder }) => (
						<div key={key} className="flex items-center gap-2">
							<Switch
								isSelected={enabledNetworks[key]}
								onChange={(checked) => setEnabledNetworks((prev) => ({ ...prev, [key]: checked }))}
								aria-label={`Ativar ${label}`}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
							<Icon icon={icon} className="icon-sm shrink-0 text-muted" />
							<span className="w-20 shrink-0 text-sm text-muted">{label}</span>
							<Controller
								name={key}
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										variant="secondary"
										placeholder={placeholder}
										disabled={!enabledNetworks[key]}
										className="min-w-0 flex-1"
									/>
								)}
							/>
						</div>
					))}
				</div>
			</div>

			<FormSaveFooter submitLabel="Salvar alterações" isPending={isPending} isDisabled={false} />
		</form>
	);
}

const PROFILE_TAB_ITEMS = [
	{ id: 'profile', label: 'Perfil', icon: <Icon icon={UserCircleIcon} className="icon-sm" /> },
	{ id: 'emblems', label: 'Emblemas', icon: <Icon icon={StarAward02Icon} className="icon-sm" /> },
	{ id: 'borders', label: 'Dinastias', icon: <Icon icon={Medal01Icon} className="icon-sm" /> },
];

export function ProfileWrapper({ profilePromise, achievementsPromise }: ProfileWrapperProps) {
	const response = use(profilePromise);
	const profile = response?.data;
	const { updateUser } = useUser();

	const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(profile?.profileImageUrl);

	if (response?.error || !profile) {
		return (
			<div className="flex flex-col gap-6 text-white">
				<div className="flex items-center gap-3 border-b border-white/10 pb-5">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={UserCircleIcon} className="icon-sm text-[#4f55f1]" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-white">Perfil</h1>
						<p className="text-xs text-white/50 mt-0.5">Edite suas informações públicas.</p>
					</div>
				</div>
				<Card>
					<Card.Content className="flex items-center justify-center p-8 text-muted text-sm">
						{response?.error?.message ?? 'Não foi possível carregar o perfil.'}
					</Card.Content>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center gap-3 border-b border-white/10 pb-5">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
					<Icon icon={UserCircleIcon} className="icon-sm text-[#4f55f1]" />
				</div>
				<div>
					<h1 className="text-xl font-bold tracking-tight text-white">Perfil</h1>
					<p className="text-xs text-white/50 mt-0.5">Edite suas informações públicas.</p>
				</div>
			</div>

<InternalTabs
			ariaLabel="Seções do perfil"
			items={PROFILE_TAB_ITEMS}
			defaultSelectedKey="profile"
		>

				<Tabs.Panel id="profile" className="p-0 pt-4">
					<Card>
						<Card.Header>
							<Card.Title>Foto &amp; Identidade</Card.Title>
							<Description>Sua foto e bio aparecem para outros usuários no ranking de organizações.</Description>
						</Card.Header>
						<Card.Content>
							<ProfileForm
								profile={{ ...profile, profileImageUrl: avatarUrl ?? null }}
								currentAvatarUrl={avatarUrl}
								onAvatarUploaded={(url) => { setAvatarUrl(url); updateUser({ profileImageUrl: url }); }}
								onAvatarDeleted={() => { setAvatarUrl(null); updateUser({ profileImageUrl: null }); }}
								onNameUpdated={(name) => updateUser({ name })}
							/>
						</Card.Content>
					</Card>
				</Tabs.Panel>

				<Tabs.Panel id="emblems" className="p-0 pt-4">
					<Card>
						<Card.Header>
							<Card.Title>Emblemas</Card.Title>
							<Description>Selecione os emblemas que aparecem no seu perfil público.</Description>
						</Card.Header>
						<Card.Content>
							<Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-surface" />)}</div>}>
								<ProfileEmblemsTab achievementsPromise={achievementsPromise} />
							</Suspense>
						</Card.Content>
					</Card>
				</Tabs.Panel>

				<Tabs.Panel id="borders" className="p-0 pt-4">
					<Card>
						<Card.Header>
							<Card.Title>Dinastias</Card.Title>
							<Description>Selecione a dinastia que aparece ao redor do seu avatar.</Description>
						</Card.Header>
						<Card.Content>
							<Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-surface" />)}</div>}>
								<ProfileBordersTab achievementsPromise={achievementsPromise} name={profile.name} profileImageUrl={avatarUrl} />
							</Suspense>
						</Card.Content>
					</Card>
				</Tabs.Panel>
			</InternalTabs>
		</div>
	);
}
