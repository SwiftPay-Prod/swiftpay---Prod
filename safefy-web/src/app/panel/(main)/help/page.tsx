import { Card, Link } from '@heroui/react';
import {
	CustomerService01Icon,
	Mail01Icon,
	SmartPhone01Icon,
	WhatsappIcon,
	InstagramIcon,
	DiscordIcon,
	UserGroup02Icon,
	HelpCircleIcon,
	BookOpen01Icon,
	TelegramIcon,
	HeadsetIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { WhatsAppManagerButton } from './whatsapp-manager-button';
import { USEFUL_LINKS, resolveDocsUrl, resolveWhatsAppSupportUrl } from '@/constants/useful-links';

const DOCS_URL = resolveDocsUrl();

interface ContactCardProps {
	icon: IconSvgElement;
	title: string;
	description: string;
	action: string;
	href: string;
	color: 'accent' | 'success' | 'warning' | 'danger';
	external?: boolean;
}

function ContactCard({ icon, title, description, action, href, color, external = true }: ContactCardProps) {
	const colorClasses = {
		accent: 'bg-accent/10 text-accent',
		success: 'bg-success/10 text-success',
		warning: 'bg-warning/10 text-warning',
		danger: 'bg-danger/10 text-danger',
	};

	return (
		<Card className="p-5 hover:shadow-lg transition-shadow">
			<div className="flex items-start gap-4">
				<div className={`p-3 rounded-xl ${colorClasses[color]}`}>
					<Icon icon={icon} className="icon-lg" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-foreground mb-1">{title}</h3>
					<p className="text-sm text-muted mb-3">{description}</p>
					<Link
						href={href}
						target="_blank"
						className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
					>
						{action}
						{external && <Link.Icon />}
					</Link>
				</div>
			</div>
		</Card>
	);
}

interface SocialLinkProps {
	icon: IconSvgElement;
	name: string;
	handle: string;
	href: string;
	bgColor: string;
}

function SocialLink({ icon, name, handle, href, bgColor }: SocialLinkProps) {
	return (
		<Link
			href={href}
			target="_blank"
			className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
		>
			<div className={`p-2.5 rounded-lg ${bgColor}`}>
				<Icon icon={icon} className="icon-md text-white" />
			</div>
			<div className="flex-1">
				<p className="font-medium text-foreground group-hover:text-accent transition-colors">{name}</p>
				<p className="text-sm text-muted">{handle}</p>
			</div>
			<Link.Icon className="text-muted group-hover:text-accent transition-colors" />
		</Link>
	);
}

export default function HelpPage() {
	const whatsappUrl = resolveWhatsAppSupportUrl('Olá! Preciso de ajuda com a plataforma Safefy.');

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				icon={<Icon icon={CustomerService01Icon} size={24} />}
				title="Central de Ajuda"
				description="Encontre suporte, tire suas dúvidas e entre em contato com nossa equipe."
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2 flex flex-col gap-4">
					<div>
						<h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
							<Icon icon={HeadsetIcon} className="icon-md text-accent" />
							Canais de Atendimento
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<ContactCard
								icon={WhatsappIcon}
								title="WhatsApp"
								description="Fale com um gerente de conta ou suporte técnico."
								action="Chamar no WhatsApp"
								href={whatsappUrl}
								color="success"
							/>
							<ContactCard
								icon={SmartPhone01Icon}
								title="Telefone"
								description={USEFUL_LINKS.supportPhone}
								action="Ligar agora"
								href={`tel:${USEFUL_LINKS.supportPhone.replace(/\s/g, '')}`}
								color="accent"
							/>
							<ContactCard
								icon={Mail01Icon}
								title="E-mail"
								description={USEFUL_LINKS.supportEmail}
								action="Enviar e-mail"
								href={`mailto:${USEFUL_LINKS.supportEmail}`}
								color="warning"
							/>
							<ContactCard
								icon={BookOpen01Icon}
								title="Documentação"
								description={USEFUL_LINKS.docsDescription}
								action={USEFUL_LINKS.docsActionLabel}
								href={DOCS_URL}
								color="accent"
							/>
						</div>
					</div>

					<div>
						<h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
							<Icon icon={HelpCircleIcon} className="icon-md text-accent" />
							Perguntas Frequentes
						</h2>
						<Card className="divide-y divide-default">
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Como gero minhas credenciais de API?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
									<p className="mt-3 text-sm text-muted">
										Acesse o menu &quot;Credenciais de API&quot; no painel lateral. Lá você pode gerar suas chaves de
										produção e sandbox para integrar com nossa API.
									</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Quais são os horários de atendimento?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									Nosso suporte funciona de segunda a sexta, das 9h às 18h. Para urgências, utilize o
									WhatsApp que possui atendimento estendido.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Como solicito um saque?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
									<p className="mt-3 text-sm text-muted">
										Acesse o menu &quot;Saques&quot; no painel lateral, cadastre uma conta bancária e solicite o saque do
										seu saldo disponível. Os saques são processados em até 24 horas úteis.
									</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Como funciona o ambiente Sandbox?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									O Sandbox é um ambiente de testes onde você pode simular transações sem movimentar dinheiro
									real. Use as credenciais de Sandbox para integrar e testar antes de ir para produção.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Quais métodos de pagamento são suportados?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									Atualmente suportamos PIX e Boleto Bancário como métodos de pagamento. Caso algum desses
									métodos não esteja habilitado na sua conta e você deseje utilizá-lo, entre em contato com nosso suporte.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Como recebo notificações de pagamento?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									Você pode configurar webhooks para receber notificações automáticas quando um pagamento
									for confirmado. Acesse as configurações da sua organização para definir a URL do webhook.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Qual é a taxa cobrada por transação?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									As taxas são configuradas individualmente para cada organização, de acordo com o volume
									e perfil do seu negócio. Para saber mais sobre as taxas aplicadas à sua conta, entre em contato
									com nosso time comercial ou suporte.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Como criar um checkout para meus produtos?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
									<p className="mt-3 text-sm text-muted">
										Acesse o menu &quot;Checkouts&quot; no painel lateral, clique em criar novo checkout, selecione
										os produtos e customize a aparência. Você receberá um link para compartilhar com seus clientes.
									</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Posso personalizar o checkout com minha marca?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									Sim! Você pode personalizar cores, logo, imagem de fundo e muito mais. Cada checkout
									pode ter uma aparência única para combinar com a identidade visual do seu negócio.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Como funciona o processo de aprovação da conta?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									Após criar sua conta, você precisa enviar os documentos da empresa para análise.
									O processo de aprovação leva de 1 a 7 dias úteis. Você será notificado por e-mail quando sua conta for aprovada.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Onde encontro a documentação da API?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
								<p className="mt-3 text-sm text-muted">
									A documentação completa da API está disponível em docs.safefypay.com.br. Lá você encontra
									guias de integração, referência de endpoints e exemplos de código em várias linguagens.
								</p>
							</details>
							<details className="group p-4">
								<summary className="flex items-center justify-between cursor-pointer list-none">
									<span className="font-medium text-foreground">Qual a diferença entre saque manual e automático?</span>
									<span className="text-muted group-open:rotate-180 transition-transform">▼</span>
								</summary>
									<p className="mt-3 text-sm text-muted">
										No modo <strong>manual</strong>, você solicita o saque quando desejar e ele passa por aprovação antes de ser processado.
										No modo <strong>automático</strong>, o saldo disponível é transferido automaticamente para sua conta bancária
										conforme a frequência configurada. Você pode verificar o modo de saque da sua conta nas configurações
										da organização, na seção &quot;Saques&quot;.
									</p>
							</details>
						</Card>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<div>
						<h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
							<Icon icon={UserGroup02Icon} className="icon-md text-accent" />
							Redes Sociais
						</h2>
						<Card className="p-2">
							<SocialLink
								icon={InstagramIcon}
								name="Instagram"
								handle="@safefy_pay"
								href={USEFUL_LINKS.instagramUrl}
								bgColor="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
							/>
							<SocialLink
								icon={DiscordIcon}
								name="Discord"
								handle="Comunidade Safefy"
								href={USEFUL_LINKS.discordUrl}
								bgColor="bg-[#5865F2]"
							/>
							<SocialLink
								icon={TelegramIcon}
								name="Telegram"
								handle="Safefy Payments"
								href={USEFUL_LINKS.telegramGroupUrl}
								bgColor="bg-[#0088cc]"
							/>
						</Card>
					</div>

					<Card className="p-5 bg-linear-to-br from-accent/10 to-accent/5 border-accent-soft-hover">
						<div className="flex flex-col items-center text-center gap-4">
							<div className="p-3 rounded-full bg-accent-soft-hover">
								<Icon icon={HeadsetIcon} className="icon-lg text-accent" />
							</div>
							<div>
								<h3 className="font-semibold text-foreground mb-1">Precisa de ajuda personalizada?</h3>
								<p className="text-sm text-muted mb-4">
									Fale diretamente com um gerente de conta para tirar suas dúvidas.
								</p>
							</div>
							<WhatsAppManagerButton href={whatsappUrl} />
						</div>
					</Card>

					<Card className="p-4 bg-surface">
						<div className="flex items-center gap-3 mb-3">
							<Icon icon={SmartPhone01Icon} className="icon-md text-muted" />
							<span className="font-medium text-foreground">Contato Direto</span>
						</div>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted">Telefone:</span>
								<Link href={`tel:${USEFUL_LINKS.supportPhone.replace(/\s/g, '')}`} target="_blank" className="text-foreground font-medium">
									{USEFUL_LINKS.supportPhone}
									<Link.Icon />
								</Link>
							</div>
							<div className="flex justify-between">
								<span className="text-muted">E-mail:</span>
								<Link href={`mailto:${USEFUL_LINKS.supportEmail}`} target="_blank" className="text-foreground font-medium">
									{USEFUL_LINKS.supportEmail}
									<Link.Icon />
								</Link>
							</div>
							<div className="flex justify-between">
								<span className="text-muted">Horário:</span>
								<span className="text-foreground font-medium">Seg-Sex, 9h-18h</span>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
