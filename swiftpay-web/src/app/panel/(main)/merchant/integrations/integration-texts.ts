export type IntegrationText = {
	description: string;
	capabilities: string[];
	examples: string[];
};

export type IntegrationTextId =
	| 'utmify'
	| 'otimizey'
	| 'google_ads'
	| 'facebook_capi'
	| 'zapier'
	| 'n8n'
	| 'hubspot'
	| 'target_ai'
	| 'google_analytics'
	| 'mixpanel';

export const integrationTexts: Record<IntegrationTextId, IntegrationText> = {
	utmify: {
		description:
			'Conecte sua operação à Utmify para acompanhar a jornada de compra com eventos de pagamento em tempo real.',
		capabilities: [
			'Ativar ou desativar a integração sem perder a configuração já salva.',
			'Configurar o token da API para autenticar os envios da SwiftPay.',
			'Escolher quais notificações serão enviadas: waiting_payment, paid, refused, refunded e chargedback.',
			'Controlar a granularidade do tracking por evento, mantendo somente o que faz sentido para sua operação.',
		],
		examples: [
			'Quando uma cobrança é criada, você pode enviar waiting_payment para iniciar uma automação de recuperação.',
			'Quando o pagamento confirma, o evento paid pode alimentar o painel de ROI das campanhas ativas.',
			'Em casos de falha ou expiração, o evento refused pode acionar fluxos de retentativa no seu CRM.',
		],
	},
	otimizey: {
		description: 'Conecte sua operação à Otimizey para enviar eventos de compra e otimizar atribuição de campanhas.',
		capabilities: [
			'Configurar o credential ID da Otimizey para autenticar os envios da SwiftPay.',
			'Ativar ou desativar a integração sem perder as preferências de notificações.',
			'Controlar envios por evento: waiting_payment, paid, refused, refunded e chargedback.',
			'Enviar parâmetros UTM e dados de compra para análise completa de performance.',
		],
		examples: [
			'Comparar performance entre campanhas de aquisição por eventos de pagamento confirmados.',
			'Alimentar dashboards de atribuição com eventos refused e refunded para reduzir perdas.',
		],
	},
	google_ads: {
		description: 'Sincronização de conversões para campanhas de mídia paga.',
		capabilities: [
			'Enviar eventos de conversão para otimização de campanhas.',
			'Melhorar estratégias de lance com base em receita real.',
		],
		examples: ['Usar conversões de pagamento confirmado para otimizar campanhas de fundo de funil.'],
	},
	facebook_capi: {
		description: 'Envie eventos de servidor para a Meta Conversions API com deduplicação e melhor atribuição de campanhas.',
		capabilities: [
			'Enviar apenas o evento padrão da Meta Purchase para compras concluídas.',
			'Configurar Pixel ID e Access Token da Conversions API para autenticação segura.',
			'Usar campos de customer e metadata para melhorar o match quality no Events Manager.',
			'Suportar Test Event Code para homologação sem impactar métricas de produção.',
		],
		examples: [
			'Enviar Purchase quando o pagamento é confirmado para otimizar campanhas de conversão.',
			'Validar payloads no ambiente de testes com test_event_code antes de publicar em produção.',
		],
	},
	zapier: {
		description: 'Automatize fluxos operacionais com gatilhos de pagamento.',
		capabilities: [
			'Conectar eventos da SwiftPay com milhares de aplicativos.',
			'Criar automações sem código para operações comerciais.',
		],
		examples: ['Criar uma tarefa no time de suporte sempre que uma cobrança entrar em disputa.'],
	},
	n8n: {
		description: 'Integre sua operação com automações self-hosted.',
		capabilities: [
			'Construir fluxos customizados com total controle técnico.',
			'Executar automações em infraestrutura própria.',
		],
		examples: ['Disparar fluxo interno de antifraude ao receber evento de chargeback.'],
	},
	hubspot: {
		description: 'Atualização automática de contatos e funis de vendas.',
		capabilities: [
			'Sincronizar estágios de negócio com o status do pagamento.',
			'Enriquecer histórico do contato com eventos financeiros.',
		],
		examples: ['Mover negócio para ganho automaticamente após evento paid.'],
	},
	target_ai: {
		description: 'Captura inteligente de leads via WhatsApp.',
		capabilities: [
			'Qualificar leads com mensagens automatizadas e contexto comercial.',
			'Organizar oportunidades por intenção de compra.',
		],
		examples: ['Priorizar contatos com maior intenção para abordagem imediata do time de vendas.'],
	},
	google_analytics: {
		description: 'Consolidação de eventos de receita e conversão.',
		capabilities: [
			'Analisar funis de checkout com base em dados de pagamento.',
			'Mensurar conversão por canal com mais confiança.',
		],
		examples: ['Cruzar conversões pagas com origem de tráfego para avaliar desempenho de campanhas.'],
	},
	mixpanel: {
		description: 'Análise de comportamento de compra e funil de conversão.',
		capabilities: [
			'Visualizar jornadas de usuário com eventos de pagamento.',
			'Identificar pontos de abandono e melhoria no checkout.',
		],
		examples: ['Mapear em qual etapa os clientes desistem antes da confirmação do pagamento.'],
	},
};
