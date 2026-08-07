'use client';

import { use } from 'react';
import { Alert } from '@heroui/react';
import { SettingsContent } from '@/app/panel/(main)/merchant/settings/settings-content';
import type {
	ReadSettingsData,
	ReadNominalsData,
	ReadNominalsHistoryData,
	ReadNominalAbTestHistoryData,
} from '@/types/merchant/settings';

interface SettingsData {
	settings: ReadSettingsData | null;
	nominals: ReadNominalsData | null;
	nominalsHistory: ReadNominalsHistoryData | null;
	nominalAbTestHistory: ReadNominalAbTestHistoryData | null;
	errors: {
		settings: string | null;
		nominals: string | null;
		nominalsHistory: string | null;
		nominalAbTestHistory: string | null;
	};
}

type SettingsPromise = Promise<SettingsData>;

interface SettingsWrapperProps {
	fetchPromise: SettingsPromise;
	merchantId: string;
}

export function SettingsWrapper({ fetchPromise, merchantId }: SettingsWrapperProps) {
	const data = use(fetchPromise);

	if (!data.settings) {
		return (
			<Alert status="danger">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Erro ao carregar configurações</Alert.Title>
					<Alert.Description>Não foi possível carregar as configurações da organização.</Alert.Description>
				</Alert.Content>
			</Alert>
		);
	}

	return (
		<SettingsContent
			merchantId={merchantId}
			settings={data.settings}
			nominals={data.nominals}
			nominalsHistory={data.nominalsHistory}
			nominalAbTestHistory={data.nominalAbTestHistory}
			nominalsError={data.errors.nominals}
		/>
	);
}
