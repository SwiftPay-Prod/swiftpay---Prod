import { AutomaticCashoutFrequency, AutomaticCashoutStatus } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import type { TParse } from './types';
import {
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	MinusSignCircleIcon,
	Time01Icon,
	Calendar01Icon,
	Calendar02Icon,
	TestTube01Icon,
} from '@hugeicons/core-free-icons';

export const automaticCashoutStatusParse: Record<AutomaticCashoutStatus, TParse> = {
	[AutomaticCashoutStatus.Success]: {
		label: 'Sucesso',
		color: 'success',
		description: 'Saque automatizado realizado com sucesso',
		icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
	},
	[AutomaticCashoutStatus.Failed]: {
		label: 'Falhou',
		color: 'danger',
		description: 'Houve um erro ao processar o saque automatizado',
		icon: <Icon icon={CancelCircleIcon} className="icon-sm" />,
	},
	[AutomaticCashoutStatus.Skipped]: {
		label: 'Ignorado',
		color: 'default',
		description: 'Saque automatizado não foi necessário',
		icon: <Icon icon={MinusSignCircleIcon} className="icon-sm" />,
	},
	[AutomaticCashoutStatus.Simulated]: {
		label: 'Simulado',
		color: 'warning',
		description: 'Saque simulado em desenvolvimento — adquirente não foi chamada',
		icon: <Icon icon={TestTube01Icon} className="icon-sm" />,
	},
};

export const automaticCashoutFrequencyParse: Record<AutomaticCashoutFrequency, TParse> = {
	[AutomaticCashoutFrequency.Minutely]: {
		label: 'A cada minuto',
		color: 'danger',
		description: 'Executado uma vez por minuto',
		icon: <Icon icon={Time01Icon} className="icon-sm" />,
	},
	[AutomaticCashoutFrequency.Hourly]: {
		label: 'A cada hora',
		color: 'accent',
		description: 'Executado a cada hora',
		icon: <Icon icon={Time01Icon} className="icon-sm" />,
	},
	[AutomaticCashoutFrequency.Daily]: {
		label: 'Diário',
		color: 'success',
		description: 'Executado uma vez por dia',
		icon: <Icon icon={Calendar01Icon} className="icon-sm" />,
	},
	[AutomaticCashoutFrequency.Weekly]: {
		label: 'Semanal',
		color: 'warning',
		description: 'Executado uma vez por semana',
		icon: <Icon icon={Calendar02Icon} className="icon-sm" />,
	},
};
