import { Icon } from '@/components/ui/icon';
import {
  Alert01Icon,
  Analytics01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  File01Icon,
  Mail01Icon,
  PencilEdit01Icon,
  Shield01Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import type { TParse } from './types';
import { mapParseColorToChipColor } from './types';
import { merchantEmailTemplateTypeParse } from './email-template';
import type { AdminLogEntry, AdminLogType } from '@/types/admin/logs';

export const adminLogTypeParse: Record<AdminLogType, TParse> = {
  Api: {
    label: 'API',
    color: 'accent',
    icon: <Icon icon={File01Icon} className="icon-sm" />,
  },
	AcquirerWebhook: {
		label: 'Webhook adquirente',
		color: 'accent',
		icon: <Icon icon={File01Icon} className="icon-sm" />,
	},
  Security: {
    label: 'Segurança',
    color: 'warning',
    icon: <Icon icon={Shield01Icon} className="icon-sm" />,
  },
  Email: {
    label: 'E-mail',
    color: 'secondary',
    icon: <Icon icon={Mail01Icon} className="icon-sm" />,
  },
  Profiler: {
    label: 'Profiler',
    color: 'accent',
    icon: <Icon icon={Analytics01Icon} className="icon-sm" />,
  },
};

const buildIcon = (icon: typeof File01Icon) => <Icon icon={icon} className="icon-sm" />;

const apiActionParse: Record<string, TParse> = {
	Authenticate: { label: 'Autenticação', color: 'accent', icon: buildIcon(Shield01Icon) },
	TokenRefresh: { label: 'Renovar token', color: 'accent', icon: buildIcon(Shield01Icon) },
	CreateCustomer: { label: 'Criar cliente', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	UpdateCustomer: { label: 'Atualizar cliente', color: 'accent', icon: buildIcon(PencilEdit01Icon) },
	DeleteCustomer: { label: 'Excluir cliente', color: 'danger', icon: buildIcon(Delete02Icon) },
	CreatePayment: { label: 'Criar pagamento', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	RefundPayment: { label: 'Estornar pagamento', color: 'warning', icon: buildIcon(Alert01Icon) },
	CancelPayment: { label: 'Cancelar pagamento', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	SimulatePayment: { label: 'Simular pagamento', color: 'warning', icon: buildIcon(Alert01Icon) },
	CreateCashout: { label: 'Criar saque', color: 'warning', icon: buildIcon(Alert01Icon) },
	CancelCashout: { label: 'Cancelar saque', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	ApproveCashout: { label: 'Aprovar saque', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	RejectCashout: { label: 'Rejeitar saque', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	CreatePlatformPayout: { label: 'Criar saque da plataforma', color: 'warning', icon: buildIcon(Alert01Icon) },
	CancelPlatformPayout: { label: 'Cancelar saque da plataforma', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	CreateSimulatedPlatformPayout: { label: 'Criar saque simulado da plataforma', color: 'warning', icon: buildIcon(Alert01Icon) },
	CreateOrder: { label: 'Criar pedido', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	WebhookReceived: { label: 'Webhook recebido', color: 'accent', icon: buildIcon(File01Icon) },
	AcquirerWebhookReceived: { label: 'Webhook da adquirente recebido', color: 'accent', icon: buildIcon(File01Icon) },
	AcquirerRequestFailed: { label: 'Falha na adquirente', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	RateLimitExceeded: { label: 'Limite de requisições excedido', color: 'warning', icon: buildIcon(Alert01Icon) },
	InvalidRequest: { label: 'Requisição inválida', color: 'warning', icon: buildIcon(Alert01Icon) },
	Unauthorized: { label: 'Não autorizado', color: 'danger', icon: buildIcon(CancelCircleIcon) },
};

const securityActionParse: Record<string, TParse> = {
	SignIn: { label: 'Login', color: 'accent', icon: buildIcon(UserCircleIcon) },
	SignUp: { label: 'Cadastro', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	SignOut: { label: 'Logout', color: 'accent', icon: buildIcon(UserCircleIcon) },
	PasswordResetRequest: { label: 'Solicitar redefinição de senha', color: 'warning', icon: buildIcon(Alert01Icon) },
	PasswordResetComplete: { label: 'Redefinir senha', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PasswordChange: { label: 'Alterar senha', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	TwoFactorEnable: { label: 'Ativar 2FA', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	TwoFactorDisable: { label: 'Desativar 2FA', color: 'warning', icon: buildIcon(Alert01Icon) },
	TwoFactorVerify: { label: 'Verificar 2FA', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	RefreshToken: { label: 'Renovar token', color: 'accent', icon: buildIcon(Shield01Icon) },
	RevokeToken: { label: 'Revogar token', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	RevokeAllTokens: { label: 'Revogar todos os tokens', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	AccountLocked: { label: 'Conta bloqueada', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	AccountUnlocked: { label: 'Conta desbloqueada', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	EmailChange: { label: 'Alterar e-mail', color: 'accent', icon: buildIcon(Mail01Icon) },
	EmailConfirmationRequest: { label: 'Solicitar confirmação de e-mail', color: 'warning', icon: buildIcon(Alert01Icon) },
	EmailConfirmationComplete: { label: 'Confirmar e-mail', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	ProfileUpdate: { label: 'Atualizar perfil', color: 'accent', icon: buildIcon(PencilEdit01Icon) },
	SuspiciousLogin: { label: 'Login suspeito', color: 'warning', icon: buildIcon(Alert01Icon) },
	MerchantCreated: { label: 'Criar organização', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	MerchantUpdated: { label: 'Atualizar organização', color: 'accent', icon: buildIcon(PencilEdit01Icon) },
	MerchantDeleted: { label: 'Excluir organização', color: 'danger', icon: buildIcon(Delete02Icon) },
	MerchantStatusChange: { label: 'Alterar status da organização', color: 'warning', icon: buildIcon(Alert01Icon) },
	MerchantOnboardingCompleted: { label: 'Concluir onboarding', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	MerchantKycSubmitted: { label: 'Enviar KYC', color: 'warning', icon: buildIcon(Alert01Icon) },
	MerchantKycApproved: { label: 'Aprovar KYC', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	MerchantKycRejected: { label: 'Rejeitar KYC', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	MerchantKycComplement: { label: 'Complemento de KYC', color: 'warning', icon: buildIcon(Alert01Icon) },
	FileUploaded: { label: 'Upload de arquivo', color: 'success', icon: buildIcon(File01Icon) },
	FileDeleted: { label: 'Excluir arquivo', color: 'danger', icon: buildIcon(Delete02Icon) },
	PlatformSettingsUpdated: { label: 'Atualizar configurações da plataforma', color: 'accent', icon: buildIcon(PencilEdit01Icon) },
	PayoutAccountCreated: { label: 'Criar conta de saque', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PayoutAccountVerified: { label: 'Verificar conta de saque', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PayoutAccountDeleted: { label: 'Excluir conta de saque', color: 'danger', icon: buildIcon(Delete02Icon) },
	PayoutAccountSetDefault: { label: 'Definir conta de saque padrão', color: 'accent', icon: buildIcon(Shield01Icon) },
	PayoutRequested: { label: 'Solicitar saque', color: 'warning', icon: buildIcon(Alert01Icon) },
	PayoutApproved: { label: 'Aprovar saque', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PayoutRejected: { label: 'Rejeitar saque', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	PayoutCancelled: { label: 'Cancelar saque', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	PayoutCompleted: { label: 'Saque concluído', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PayoutFailed: { label: 'Falha no saque', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	DeviceVerified: { label: 'Dispositivo verificado', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	DeviceRevoked: { label: 'Dispositivo revogado', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	DeviceVerificationCodeResent: { label: 'Reenviar código do dispositivo', color: 'warning', icon: buildIcon(Alert01Icon) },
};

function formatFallbackLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function getAdminLogActionLabel(log: AdminLogEntry): string {
  if (!log.action) return '-';

  if (log.logType === 'Api') {
    return apiActionParse[log.action]?.label ?? formatFallbackLabel(log.action);
  }

  if (log.logType === 'Security') {
    return securityActionParse[log.action]?.label ?? formatFallbackLabel(log.action);
  }

  return formatFallbackLabel(log.action);
}

export function getAdminLogActionParse(log: AdminLogEntry): TParse {
  if (!log.action) {
    return { label: '-', color: 'default', icon: buildIcon(File01Icon) };
  }

  if (log.logType === 'Api') {
    return apiActionParse[log.action] ?? {
      label: formatFallbackLabel(log.action),
      color: 'default',
      icon: buildIcon(File01Icon),
    };
  }

  if (log.logType === 'Security') {
    return securityActionParse[log.action] ?? {
      label: formatFallbackLabel(log.action),
      color: 'default',
      icon: buildIcon(Shield01Icon),
    };
  }

  return { label: formatFallbackLabel(log.action), color: 'default', icon: buildIcon(File01Icon) };
}

const statusParse: Record<string, TParse> = {
  Success: { label: 'Sucesso', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
  Failed: { label: 'Falha', color: 'danger', icon: buildIcon(CancelCircleIcon) },
  Warning: { label: 'Alerta', color: 'warning', icon: buildIcon(Alert01Icon) },
  Sent: { label: 'Enviado', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
  Skipped: { label: 'Ignorado', color: 'warning', icon: buildIcon(Alert01Icon) },
};

const systemEmailTemplateParse: Record<string, TParse> = {
	Welcome: { label: 'Boas-vindas', color: 'accent', icon: buildIcon(Mail01Icon) },
	EmailConfirmation: { label: 'Confirmação de e-mail', color: 'accent', icon: buildIcon(Mail01Icon) },
	PasswordReset: { label: 'Redefinição de senha', color: 'warning', icon: buildIcon(Alert01Icon) },
	PasswordChanged: { label: 'Senha alterada', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PasswordChangeCode: { label: 'Código de alteração de senha', color: 'warning', icon: buildIcon(Alert01Icon) },
	AccountLocked: { label: 'Conta bloqueada', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	AccountInactivated: { label: 'Conta inativada', color: 'warning', icon: buildIcon(Alert01Icon) },
	AccountSuspended: { label: 'Conta suspensa', color: 'warning', icon: buildIcon(Alert01Icon) },
	SuspiciousLogin: { label: 'Login suspeito', color: 'warning', icon: buildIcon(Alert01Icon) },
	DeviceVerification: { label: 'Verificação de dispositivo', color: 'warning', icon: buildIcon(Alert01Icon) },
	DeviceAdded: { label: 'Dispositivo adicionado', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	ApiCredentialCode: { label: 'Código de credencial', color: 'warning', icon: buildIcon(Alert01Icon) },
	ApiCredentialCreated: { label: 'Credencial criada', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	ApiCredentialRevoked: { label: 'Credencial revogada', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	ApiCredentialRegenerated: { label: 'Credencial regenerada', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	KycSubmitted: { label: 'KYC enviado', color: 'warning', icon: buildIcon(Alert01Icon) },
	KycApproved: { label: 'KYC aprovado', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	KycRejected: { label: 'KYC rejeitado', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	KycComplement: { label: 'Complemento de KYC', color: 'warning', icon: buildIcon(Alert01Icon) },
	MerchantDeletionCode: { label: 'Código de exclusão da organização', color: 'warning', icon: buildIcon(Alert01Icon) },
	MerchantDeleted: { label: 'Organização excluída', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	MerchantSuspended: { label: 'Organização suspensa', color: 'warning', icon: buildIcon(Alert01Icon) },
	MerchantInactivated: { label: 'Organização inativada', color: 'warning', icon: buildIcon(Alert01Icon) },
	PayoutAccountActionVerification: { label: 'Verificação de conta de saque', color: 'warning', icon: buildIcon(Alert01Icon) },
	PayoutAccountCreated: { label: 'Conta de saque criada', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PayoutRequested: { label: 'Saque solicitado', color: 'warning', icon: buildIcon(Alert01Icon) },
	'Payout Requested': { label: 'Saque solicitado', color: 'warning', icon: buildIcon(Alert01Icon) },
	AdminPasswordReset: { label: 'Redefinição de senha (Admin)', color: 'warning', icon: buildIcon(Alert01Icon) },
	PaymentReceived: { label: 'Pagamento recebido', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PaymentExpired: { label: 'Pagamento expirado', color: 'warning', icon: buildIcon(Alert01Icon) },
	PayoutCompleted: { label: 'Saque concluído', color: 'success', icon: buildIcon(CheckmarkCircle02Icon) },
	PayoutFailed: { label: 'Falha no saque', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	PayoutRejected: { label: 'Saque rejeitado', color: 'danger', icon: buildIcon(CancelCircleIcon) },
	WebhookFailed: { label: 'Falha no webhook', color: 'danger', icon: buildIcon(CancelCircleIcon) },
};

function normalizeTemplateKey(template: string): string {
	const trimmed = template.trim();
	const withoutExtension = trimmed.toLowerCase().endsWith('.html') ? trimmed.slice(0, -5) : trimmed;
	return withoutExtension.trim();
}

export function getAdminLogStatusParse(status?: string | null): TParse {
  if (!status) {
    return { label: '-', color: 'default', icon: buildIcon(File01Icon) };
  }

  return statusParse[status] ?? {
    label: formatFallbackLabel(status),
    color: 'default',
    icon: buildIcon(File01Icon),
  };
}

export function getAdminEmailTemplateParse(template?: string | null): TParse {
	if (!template) {
		return { label: '-', color: 'default', icon: buildIcon(Mail01Icon) };
	}

	const normalized = normalizeTemplateKey(template);

	const parsed = merchantEmailTemplateTypeParse[normalized as keyof typeof merchantEmailTemplateTypeParse];
	if (parsed) {
		return parsed;
	}

	const systemParsed = systemEmailTemplateParse[normalized] ?? systemEmailTemplateParse[template];
	if (systemParsed) {
		return systemParsed;
	}

	return {
		label: formatFallbackLabel(normalized),
		color: 'default',
		icon: buildIcon(Mail01Icon),
	};
}

export const apiActionFilterOptions = [
	{ value: 'all', label: 'Todas as ações' },
	...Object.entries(apiActionParse).map(([key, parse]) => ({
		value: key,
		label: parse.label,
		color: mapParseColorToChipColor(parse.color),
		icon: parse.icon,
	})),
];

export const securityActionFilterOptions = [
	{ value: 'all', label: 'Todas as ações' },
	...Object.entries(securityActionParse).map(([key, parse]) => ({
		value: key,
		label: parse.label,
		color: mapParseColorToChipColor(parse.color),
		icon: parse.icon,
	})),
];

export const emailTemplateFilterOptions = [
	{ value: 'all', label: 'Todos os templates' },
	...Object.entries(systemEmailTemplateParse).map(([key, parse]) => ({
		value: key,
		label: parse.label,
		color: mapParseColorToChipColor(parse.color),
		icon: parse.icon,
	})),
];
