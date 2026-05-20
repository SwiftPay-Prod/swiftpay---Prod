import { canAccessRoute } from '@/router/route-guard';
import { ROUTES_CONFIG } from '@/router/router';
import { Routes } from '@/router/routes';
import { RouteType } from '@/types/router';
import type { IconName, RouteContext } from '@/types/router';
import { UserRole } from '@/types/enums';
import type { MerchantKycStatus, MerchantStatus } from '@/types/enums';

export interface SidebarKbarActionDefinition {
	id: string;
	name: string;
	path: string;
	section: string;
	subtitle?: string;
	keywords?: string;
	shortcut?: string[];
	iconName?: IconName;
	isExternal?: boolean;
	isDisabled?: boolean;
}

interface SidebarKbarActionsParams {
	userRole: UserRole;
	emailVerified: boolean;
	hasMerchant: boolean;
	merchantStatus?: MerchantStatus;
	merchantKycStatus?: MerchantKycStatus;
}

const ROUTE_KEYWORDS: Record<string, string> = {
	[Routes.panel.merchant.dashboard]: 'organizacao organização merchant resumo metricas kpi vendas lucro receita graficos',
	[Routes.panel.merchant.orders]: 'organizacao organização pedidos order compra checkout itens status envio',
	[Routes.panel.merchant.products]: 'organizacao organização produtos catalogo estoque sku variantes precos',
	[Routes.panel.merchant.physicalProducts]: 'organizacao organização produtos fisicos estoque frete peso dimensoes',
	[Routes.panel.merchant.digitalProducts]: 'organizacao organização produtos digitais arquivo entrega email automatico download',
	[Routes.panel.merchant.services]: 'organizacao organização servicos agenda atendimento prestacao',
	[Routes.panel.merchant.transactions]: 'organizacao organização transacoes pagamentos pix boleto cartao conciliação',
	[Routes.panel.merchant.paymentLinks]: 'organizacao organização link de pagamento links de pagamento cobrança cobrança rápida pix boleto',
	[Routes.panel.merchant.cashouts]: 'organizacao organização saques retirada extrato saldo contas bancarias',
	[Routes.panel.merchant.cashoutAccounts]: 'organizacao organização contas de saque pix banco chave titularidade',
	[Routes.panel.merchant.balanceHistory]: 'organizacao organização historico de saldo ledger movimentacoes creditos debitos',
	[Routes.panel.merchant.customers]: 'organizacao organização clientes crm compradores recorrencia tickets',
	[Routes.panel.merchant.coupons]: 'organizacao organização cupons desconto promocao campanha marketing',
	[Routes.panel.merchant.apiCredentials]: 'organizacao organização credenciais api secret key token integração',
	[Routes.panel.merchant.settings]: 'organizacao organização configuracoes webhook timeout preferencias',
	[Routes.panel.merchant.fees]: 'organizacao organização taxas limites fee split tarifa saque',
	[Routes.panel.merchant.onboarding]: 'organizacao organização onboarding completar cadastro kyc documentos',
	[Routes.panel.merchant.review]: 'organizacao organização meu cadastro minha organização minha organizacao dados da conta cnpj documentos',
	[Routes.panel.merchant.checkouts]: 'organizacao organização checkouts paginas de pagamento templates',
	[Routes.panel.admin.dashboard]: 'admin administração visao geral plataforma metricas operacionais',
	[Routes.panel.admin.balances]: 'admin administração saldos contas plataforma reconciliacao',
	[Routes.panel.admin.merchants]: 'admin administração organizações merchants kyc aprovacao',
	[Routes.panel.admin.users]: 'admin administração usuários roles permissões acessos',
	[Routes.panel.admin.referrals]: 'admin administração indicações saques de comissão payout referral',
	[Routes.panel.admin.transactions]: 'admin administração transações auditoria pagamentos',
	[Routes.panel.admin.payouts]: 'admin administração saques de organizações cashouts revisão',
	[Routes.panel.admin.platformPayouts]: 'admin administração saques da plataforma contas internas',
	[Routes.panel.admin.platformPayoutAccounts]: 'admin administração contas de saque da plataforma bancos pix',
	[Routes.panel.admin.acquirers]: 'admin administração adquirentes integração taxas webhooks',
	[Routes.panel.admin.templates]: 'admin administração templates checkout temas',
	[Routes.panel.admin.platformSettings]: 'admin administração configurações globais rate limit referral',
	[Routes.panel.admin.logs]: 'admin administração logs auditoria segurança api integrações',
	[Routes.panel.dev.tools]: 'admin desenvolvimento suporte ferramentas internas debug',
	[Routes.panel.security]: 'conta segurança senha dispositivos sessão 2fa',
	[Routes.panel.notifications]: 'conta notificacoes alertas avisos push in-app',
	[Routes.panel.userSettings]: 'conta preferencias perfil configuracoes pessoais',
	[Routes.panel.help]: 'ajuda suporte faq atendimento documentação',
	[Routes.panel.docs]: 'documentacao api integração exemplos webhooks credenciais',
	[Routes.panel.bulletins]: 'informativos atualizacoes novidades changelog',
	[Routes.panel.referrals]: 'indique e ganhe referral comissão convites',
};

const ROUTE_SHORTCUTS: Record<string, string[]> = {
	[Routes.panel.merchant.dashboard]: ['m', 'd'],
	[Routes.panel.merchant.transactions]: ['m', 't'],
	[Routes.panel.merchant.paymentLinks]: ['m', 'l'],
	[Routes.panel.merchant.orders]: ['m', 'o'],
	[Routes.panel.merchant.products]: ['m', 'p'],
	[Routes.panel.merchant.customers]: ['m', 'c'],
	[Routes.panel.merchant.cashouts]: ['m', 's'],
	[Routes.panel.merchant.settings]: ['m', 'g'],
	[Routes.panel.admin.dashboard]: ['a', 'd'],
	[Routes.panel.admin.transactions]: ['a', 't'],
	[Routes.panel.admin.merchants]: ['a', 'm'],
	[Routes.panel.admin.users]: ['a', 'u'],
	[Routes.panel.admin.logs]: ['a', 'l'],
	[Routes.panel.help]: ['h'],
	[Routes.panel.docs]: ['d'],
};

const GLOBAL_SYNONYMS =
	'tela pagina menu navegar acesso abrir ir para atalhos painel plataforma sistema safefy';

const SECTION_SYNONYMS: Record<string, string> = {
	Vendas: 'venda vendas comercial pedidos catalogo loja ecommerce',
	Financeiro: 'financeiro pagamentos cobrancas pix boleto saques saldo extrato',
	Configurações: 'configuracoes ajustes preferencias parametros',
	Administração: 'admin administracao gestor gerenciamento operacao backoffice',
	Suporte: 'suporte ajuda documentacao faq central de ajuda',
	Sistema: 'sistema dev tools ferramenta interna desenvolvimento',
	Conta: 'conta usuario perfil seguranca notificacoes',
	'Atalhos • Organização': 'organizacao organizacao empresa negocio merchant minha organização minha organizacao',
	'Atalhos • Administração': 'admin administracao operacao plataforma',
	Navegação: 'navegacao menu acessos rotas',
};

const PATH_SYNONYMS: Record<string, string> = {
	[Routes.panel.merchant.review]: 'minha organização minha organizacao perfil da empresa dados da empresa',
	[Routes.panel.merchant.onboarding]: 'cadastro organizacao completar organizacao enviar documentos',
	[Routes.panel.admin.merchants]: 'organizacoes empresas merchants clientes b2b',
	[Routes.panel.security]: 'trocar senha dispositivos confiaveis 2fa autenticacao',
};

interface ExtraActionDefinition {
	id: string;
	name: string;
	path: string;
	section: string;
	subtitle: string;
	keywords: string;
	shortcut?: string[];
	iconName?: IconName;
	isExternal?: boolean;
	isDisabled?: boolean;
	requiresMerchant?: boolean;
	roles?: UserRole[];
}

const EXTRA_ACTIONS: ExtraActionDefinition[] = [
	{
		id: 'merchant-my-organization',
		name: 'Minha Organização',
		path: Routes.panel.merchant.review,
		section: 'Atalhos • Organização',
		subtitle: 'Cadastro',
		keywords: 'minha organização minha organizacao cadastro da organizacao dados da organizacao',
		iconName: 'ClipboardText',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-order',
		name: 'Novo Pedido',
		path: Routes.panel.merchant.ordersUpsert('new'),
		section: 'Atalhos • Organização',
		subtitle: 'Vendas',
		keywords: 'criar pedido novo order checkout itens cliente',
		shortcut: ['n', 'o'],
		iconName: 'ShoppingCartCheck01Icon',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-customer',
		name: 'Novo Cliente',
		path: Routes.panel.merchant.customersUpsert('new'),
		section: 'Atalhos • Organização',
		subtitle: 'Vendas',
		keywords: 'criar cliente novo customer cadastro comprador',
		shortcut: ['n', 'c'],
		iconName: 'UsersGroupTwoRounded',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-physical-product',
		name: 'Novo Produto Físico',
		path: Routes.panel.merchant.physicalProductsUpsert('new'),
		section: 'Atalhos • Organização',
		subtitle: 'Produtos',
		keywords: 'criar produto fisico estoque sku variacao novo',
		shortcut: ['n', 'f'],
		iconName: 'BoxMinimalistic',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-digital-product',
		name: 'Novo Produto Digital',
		path: Routes.panel.merchant.digitalProductsUpsert('new'),
		section: 'Atalhos • Organização',
		subtitle: 'Produtos',
		keywords: 'criar produto digital email entrega download novo',
		shortcut: ['n', 'd'],
		iconName: 'DigitalProduct',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-service',
		name: 'Novo Serviço',
		path: Routes.panel.merchant.servicesUpsert('new'),
		section: 'Atalhos • Organização',
		subtitle: 'Produtos',
		keywords: 'criar servico novo agenda atendimento',
		shortcut: ['n', 's'],
		iconName: 'Service',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-coupon',
		name: 'Novo Cupom',
		path: Routes.panel.merchant.couponsUpsert('new'),
		section: 'Atalhos • Organização',
		subtitle: 'Marketing',
		keywords: 'criar cupom desconto promocao campanha novo',
		shortcut: ['n', 'u'],
		iconName: 'Coupon',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-checkout',
		name: 'Novo Checkout',
		path: Routes.panel.merchant.checkoutsUpsert('new'),
		section: 'Atalhos • Organização',
		subtitle: 'Checkout',
		keywords: 'criar checkout pagina pagamento template novo',
		shortcut: ['n', 'k'],
		iconName: 'WidgetAdd',
		requiresMerchant: true,
	},
	{
		id: 'merchant-new-payment-link',
		name: 'Novo link de pagamento',
		path: Routes.panel.merchant.paymentLinks,
		section: 'Atalhos • Organização',
		subtitle: 'Financeiro',
		keywords: 'criar link de pagamento novo link de pagamento cobrança',
		shortcut: ['n', 'l'],
		iconName: 'Card',
		requiresMerchant: true,
	},
	{
		id: 'admin-new-template',
		name: 'Novo Template de Checkout',
		path: Routes.panel.admin.templatesUpsert('new'),
		section: 'Atalhos • Administração',
		subtitle: 'Checkouts',
		keywords: 'admin criar template checkout novo tema',
		shortcut: ['a', 'n'],
		iconName: 'WidgetAdd',
		roles: [UserRole.Admin, UserRole.God],
	},
	{
		id: 'account-security',
		name: 'Segurança da Conta',
		path: Routes.panel.security,
		section: 'Conta',
		subtitle: 'Usuário',
		keywords: 'senha dispositivos confiáveis sessão autenticação',
		shortcut: ['s', 'e'],
		iconName: 'Shield',
	},
	{
		id: 'account-notifications',
		name: 'Notificações',
		path: Routes.panel.notifications,
		section: 'Conta',
		subtitle: 'Usuário',
		keywords: 'alertas push notificações avisos',
		shortcut: ['n'],
		iconName: 'Bell',
	},
	{
		id: 'account-settings',
		name: 'Configurações do Usuário',
		path: Routes.panel.userSettings,
		section: 'Conta',
		subtitle: 'Usuário',
		keywords: 'perfil conta preferências pessoais',
		iconName: 'Settings',
	},
];

function canUseExtraAction(
	action: ExtraActionDefinition,
	params: SidebarKbarActionsParams,
	context: RouteContext
): boolean {
	if (action.requiresMerchant && !params.hasMerchant) {
		return false;
	}

	if (action.roles && action.roles.length > 0 && !action.roles.includes(params.userRole)) {
		return false;
	}

	if (!canAccessRoute(action.path, context).allowed) {
		return false;
	}

	return true;
}

function isDisabledRoutePath(path: string, disabledRoutePaths: string[]): boolean {
	return disabledRoutePaths.some((disabledPath) => path === disabledPath || path.startsWith(`${disabledPath}/`) || path.startsWith(`${disabledPath}?`));
}

function buildActionKeywords(baseKeywords: string | undefined, name: string, section: string, path: string): string {
	const parts = [
		baseKeywords ?? '',
		name,
		section,
		GLOBAL_SYNONYMS,
		SECTION_SYNONYMS[section] ?? '',
		PATH_SYNONYMS[path] ?? '',
	];

	return parts.filter(Boolean).join(' ').trim();
}

export function buildSidebarKbarActions(params: SidebarKbarActionsParams): SidebarKbarActionDefinition[] {
	const context: RouteContext = {
		isAuthenticated: true,
		emailVerified: params.emailVerified,
		userRole: params.userRole,
		hasMerchant: params.hasMerchant,
		merchantStatus: params.merchantStatus,
		merchantKycStatus: params.merchantKycStatus,
	};

	const disabledRoutePaths = ROUTES_CONFIG.filter((route) => route.isDisabled).map((route) => route.path);

	const routeActions = ROUTES_CONFIG
		.filter((route) => route.type === RouteType.Private)
		.filter((route) => !route.isDisabled)
		.filter((route) => canAccessRoute(route.path, context).allowed)
		.map<SidebarKbarActionDefinition>((route) => ({
			id: `route-${route.path}`,
			name: route.title,
			path: route.path,
			section: route.menuSection ?? 'Navegação',
			subtitle: route.menuSection ?? 'Navegação',
			keywords: buildActionKeywords(ROUTE_KEYWORDS[route.path], route.title, route.menuSection ?? 'Navegação', route.path),
			shortcut: ROUTE_SHORTCUTS[route.path],
			iconName: route.iconName,
			isExternal: route.isExternal,
			isDisabled: false,
		}));

	const extraActions = EXTRA_ACTIONS.filter((action) => canUseExtraAction(action, params, context))
		.filter((action) => !isDisabledRoutePath(action.path, disabledRoutePaths))
		.map<SidebarKbarActionDefinition>(
			(action) => ({
				id: action.id,
				name: action.name,
				path: action.path,
				section: action.section,
				subtitle: action.subtitle,
				keywords: buildActionKeywords(action.keywords, action.name, action.section, action.path),
				shortcut: action.shortcut,
				iconName: action.iconName,
				isExternal: action.isExternal,
				isDisabled: action.isDisabled,
			})
		);

	return [...routeActions, ...extraActions].filter((action) => !isDisabledRoutePath(action.path, disabledRoutePaths));
}
