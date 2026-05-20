export type ReasonPreset =
	| 'custom'
	| 'betterRates'
	| 'operationalStability'
	| 'featureNeeds'
	| 'riskCompliance'
	| 'merchantProfileChange';

export const commonReasonOptions = [
	{ value: 'custom', label: 'Outro (digitar manualmente)' },
	{ value: 'betterRates', label: 'Melhores taxas comerciais' },
	{ value: 'operationalStability', label: 'Maior estabilidade operacional' },
	{ value: 'featureNeeds', label: 'Necessidade de funcionalidades específicas' },
	{ value: 'riskCompliance', label: 'Adequação de risco/compliance' },
	{ value: 'merchantProfileChange', label: 'Mudança no perfil da operação da organização' },
] as const;

export const reasonPresetTextMap: Record<Exclude<ReasonPreset, 'custom'>, string> = {
	betterRates: 'Alteração realizada para otimizar custos operacionais e obter melhores taxas comerciais.',
	operationalStability: 'Alteração realizada para aumentar a estabilidade operacional e reduzir riscos de indisponibilidade.',
	featureNeeds: 'Alteração realizada devido à necessidade de funcionalidades específicas para a operação da organização.',
	riskCompliance: 'Alteração realizada para adequação de políticas internas de risco e compliance.',
	merchantProfileChange: 'Alteração realizada devido à mudança no perfil transacional e necessidades da organização.',
};
