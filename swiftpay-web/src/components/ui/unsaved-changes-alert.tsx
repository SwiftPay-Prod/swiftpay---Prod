'use client';

import { Alert } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';

interface UnsavedChangesAlertProps {
	hasChanges: boolean;
	message?: string;
	onSave?: () => void;
	isSaving?: boolean;
}

export function UnsavedChangesAlert({
	hasChanges,
	message = 'Você tem alterações não salvas. Clique em "Salvar" para aplicar as mudanças.',
	onSave,
	isSaving,
}: UnsavedChangesAlertProps) {
	if (!hasChanges) return null;

	return (
		<Alert status="warning" data-unsaved-changes-alert="true" data-unsaved-changes-saving={isSaving ? 'true' : 'false'}>
			<Alert.Indicator />
			<Alert.Content>
				<Alert.Title>Alterações não salvas</Alert.Title>
				<Alert.Description>{message}</Alert.Description>
			</Alert.Content>
			{onSave && (
				<div className="ml-auto flex items-center my-auto">
					<AsyncButton
						size="sm"
						variant="primary"
						onPress={onSave}
						isPending={isSaving}
						data-unsaved-changes-save="true"
						data-unsaved-changes-saving={isSaving ? 'true' : 'false'}
					>
						<Icon icon={CheckmarkCircle01Icon} className="icon-sm" />
						Salvar alterações
					</AsyncButton>
				</div>
			)}
		</Alert>
	);
}

