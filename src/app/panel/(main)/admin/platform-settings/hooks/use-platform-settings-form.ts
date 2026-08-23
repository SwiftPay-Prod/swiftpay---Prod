import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import type { Key } from '@heroui/react';
import type { PaymentMethod } from '@/types/enums';
import type {
	AdminPlatformSettingsData,
	PaymentLinkDomainOption,
} from '@/types/admin/platform-settings';
import type { AdminPlatformPayoutAccountData } from '@/types/admin/platform-payouts';
import { adminUpdatePlatformSettings } from '@/app/actions/admin/platform-settings';
import {
	buildDomainEditorKey,
	buildDomainOptionId,
	buildUpdatePayload,
	hasConfiguredDays,
	hasConfiguredPercentage,
	isValidHttpUrl,
	mapSettingsToForm,
	safeTrim,
	validatePayload,
} from '../platform-settings-form.helpers';
import type { FormValues } from '../platform-settings-form.types';

interface UsePlatformSettingsFormOptions {
	settings: AdminPlatformSettingsData;
	platformPayoutAccounts: AdminPlatformPayoutAccountData[];
	onSaveSuccess?: (args: { message?: string }) => void;
	onSaveError?: (args: { message?: string }) => void;
}

export function usePlatformSettingsForm({
	settings,
	platformPayoutAccounts,
	onSaveError,
	onSaveSuccess,
}: UsePlatformSettingsFormOptions) {
	const [isPending, startTransition] = useTransition();
	const [formError, setFormError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState(settings.updatedAt);

	const initialAutomaticCashoutPayoutAccountId =
		settings.automaticCashoutPayoutAccountId ?? platformPayoutAccounts.find((account) => account.isActive)?.id ?? '';

	const initialData = useMemo<FormValues>(
		() => ({
			...mapSettingsToForm(settings),
			automaticCashoutPayoutAccountId: initialAutomaticCashoutPayoutAccountId,
		}),
		[initialAutomaticCashoutPayoutAccountId, settings]
	);

	const [savedData, setSavedData] = useState<FormValues>(initialData);
	const [formData, setFormData] = useState<FormValues>(initialData);
	const [showPixReserveField, setShowPixReserveField] = useState(() =>
		hasConfiguredPercentage(initialData.pixReservePercentage)
	);
	const [showPixReserveCompensationField, setShowPixReserveCompensationField] = useState(() =>
		hasConfiguredDays(initialData.pixReserveCompensationDays)
	);
	const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
	const [domainModalMethod, setDomainModalMethod] = useState<PaymentMethod | null>(null);
	const [domainModalOptionId, setDomainModalOptionId] = useState<string | null>(null);
	const [domainDraft, setDomainDraft] = useState<PaymentLinkDomainOption | null>(null);
	const [pendingDomainRemovalKey, setPendingDomainRemovalKey] = useState<string | null>(null);

	const hasChanges = useMemo(
		() => JSON.stringify(formData) !== JSON.stringify(savedData),
		[formData, savedData]
	);

	useEffect(() => {
		function handleBeforeUnload(event: BeforeUnloadEvent) {
			if (hasChanges) {
				event.preventDefault();
				event.returnValue = '';
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasChanges]);

	const handleFieldChange = useCallback(<K extends keyof FormValues>(field: K, value: FormValues[K]) => {
		setFormData((previous) => ({ ...previous, [field]: value }));
	}, []);

	const handleSelectChange = useCallback(<K extends keyof FormValues>(field: K, key: Key | null) => {
		if (!key) {
			return;
		}

		setFormData((previous) => ({ ...previous, [field]: String(key) as FormValues[K] }));
	}, []);

	const updatePaymentLinkMethodOptions = useCallback(
		(method: PaymentMethod, updater: (options: PaymentLinkDomainOption[]) => PaymentLinkDomainOption[]) => {
			setFormData((previous) => {
				const existing = previous.paymentLinkDomainOptions;
				const groupIndex = existing.findIndex((group) => group.method === method);
				const currentOptions = groupIndex >= 0 ? existing[groupIndex]!.options : [];
				const nextOptions = updater([...currentOptions]);
				const nextGroup = { method, options: nextOptions };

				if (groupIndex >= 0) {
					const nextGroups = [...existing];
					nextGroups[groupIndex] = nextGroup;
					return { ...previous, paymentLinkDomainOptions: nextGroups };
				}

				return {
					...previous,
					paymentLinkDomainOptions: [...existing, nextGroup],
				};
			});
		},
		[]
	);

	const findMethodOptions = useCallback(
		(method: PaymentMethod): PaymentLinkDomainOption[] =>
			formData.paymentLinkDomainOptions.find((group) => group.method === method)?.options ?? [],
		[formData.paymentLinkDomainOptions]
	);

	const closeDomainModal = useCallback(() => {
		setIsDomainModalOpen(false);
		setDomainModalMethod(null);
		setDomainModalOptionId(null);
		setDomainDraft(null);
		setFormError(null);
	}, []);

	const openCreatePaymentLinkDomainModal = useCallback(
		(method: PaymentMethod) => {
			const nextOption: PaymentLinkDomainOption = {
				id: buildDomainOptionId(method, findMethodOptions(method).length + 1),
				name: '',
				baseUrl: '',
				isDefault: findMethodOptions(method).every((option) => !option.isDefault),
				showSwiftPayBranding: true,
			};

			setDomainModalMethod(method);
			setDomainModalOptionId(null);
			setDomainDraft(nextOption);
			setIsDomainModalOpen(true);
			setPendingDomainRemovalKey(null);
			setFormError(null);
		},
		[findMethodOptions]
	);

	const openEditPaymentLinkDomainModal = useCallback((method: PaymentMethod, option: PaymentLinkDomainOption) => {
		setDomainModalMethod(method);
		setDomainModalOptionId(option.id);
		setDomainDraft({ ...option });
		setIsDomainModalOpen(true);
		setPendingDomainRemovalKey(null);
		setFormError(null);
	}, []);

	const saveDomainModal = useCallback(() => {
		if (!domainModalMethod || !domainDraft) {
			return;
		}

		const nextOption: PaymentLinkDomainOption = {
			...domainDraft,
			id: safeTrim(domainDraft.id),
			name: safeTrim(domainDraft.name),
			baseUrl: safeTrim(domainDraft.baseUrl),
		};

		if (!nextOption.id || !nextOption.name || !nextOption.baseUrl) {
			setFormError('Preencha nome e URL base do domínio antes de salvar.');
			return;
		}

		if (!isValidHttpUrl(nextOption.baseUrl)) {
			setFormError('A URL base do domínio deve ser válida e usar http:// ou https://.');
			return;
		}

		const hasDuplicateId = findMethodOptions(domainModalMethod).some(
			(option) => option.id !== domainModalOptionId && option.id.toLowerCase() === nextOption.id.toLowerCase()
		);

		if (hasDuplicateId) {
			setFormError('Já existe um domínio com esse ID para este método de pagamento.');
			return;
		}

		if (!domainModalOptionId) {
			updatePaymentLinkMethodOptions(domainModalMethod, (options) => {
				const updated = [...options, nextOption];
				if (updated.length > 0 && updated.every((option) => !option.isDefault)) {
					updated[0] = { ...updated[0]!, isDefault: true };
				}

				return updated;
			});
		} else {
			updatePaymentLinkMethodOptions(domainModalMethod, (options) => {
				const updated = options.map((option) => {
					if (option.id !== domainModalOptionId) {
						if (nextOption.isDefault) {
							return { ...option, isDefault: false };
						}

						return option;
					}

					return { ...nextOption };
				});

				if (updated.length > 0 && updated.every((option) => !option.isDefault)) {
					updated[0] = { ...updated[0]!, isDefault: true };
				}

				return updated;
			});
		}

		closeDomainModal();
		setPendingDomainRemovalKey(null);
	}, [
		closeDomainModal,
		domainDraft,
		domainModalMethod,
		domainModalOptionId,
		findMethodOptions,
		updatePaymentLinkMethodOptions,
	]);

	const setPaymentLinkDomainAsDefault = useCallback(
		(method: PaymentMethod, optionId: string) => {
			updatePaymentLinkMethodOptions(method, (options) =>
				options.map((option) => ({
					...option,
					isDefault: option.id === optionId,
				}))
			);

			setPendingDomainRemovalKey(null);
			setFormError(null);
		},
		[updatePaymentLinkMethodOptions]
	);

	const requestPaymentLinkDomainRemoval = useCallback((method: PaymentMethod, optionId: string) => {
		setPendingDomainRemovalKey(buildDomainEditorKey(method, optionId));
		setIsDomainModalOpen(false);
		setDomainModalMethod(null);
		setDomainModalOptionId(null);
		setDomainDraft(null);
		setFormError(null);
	}, []);

	const confirmPaymentLinkDomainRemoval = useCallback(
		(method: PaymentMethod, optionId: string) => {
			updatePaymentLinkMethodOptions(method, (options) => {
				const filtered = options.filter((option) => option.id !== optionId);
				if (filtered.length > 0 && filtered.every((option) => !option.isDefault)) {
					filtered[0] = { ...filtered[0]!, isDefault: true };
				}

				return filtered;
			});

			setPendingDomainRemovalKey(null);
			setIsDomainModalOpen(false);
			setDomainModalMethod(null);
			setDomainModalOptionId(null);
			setDomainDraft(null);
			setFormError(null);
		},
		[updatePaymentLinkMethodOptions]
	);

	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setFormError(null);

			const payload = buildUpdatePayload(formData);
			const validationError = validatePayload(payload);

			if (validationError) {
				setFormError(validationError);
				return;
			}

			startTransition(async () => {
				const response = await adminUpdatePlatformSettings(payload);

				if (response?.error) {
					const message = response.error.message ?? 'Nao foi possivel salvar as configuracoes.';
					setFormError(message);
					onSaveError?.({ message });
					return;
				}

				if (response?.data) {
					const nextData = mapSettingsToForm(response.data);
					setFormData(nextData);
					setSavedData(nextData);
					setLastUpdated(response.data.updatedAt);
					setIsDomainModalOpen(false);
					setDomainModalMethod(null);
					setDomainModalOptionId(null);
					setDomainDraft(null);
					setPendingDomainRemovalKey(null);
					setShowPixReserveField(hasConfiguredPercentage(nextData.pixReservePercentage));
					setShowPixReserveCompensationField(hasConfiguredDays(nextData.pixReserveCompensationDays));
				}

				onSaveSuccess?.({ message: response?.message ?? 'As configurações foram salvas com sucesso.' });
			});
		},
		[formData, onSaveError, onSaveSuccess]
	);

	const handleDomainDraftFieldChange = useCallback(
		<K extends keyof PaymentLinkDomainOption>(field: K, value: PaymentLinkDomainOption[K]) => {
			setDomainDraft((previous) => (previous ? { ...previous, [field]: value } : previous));
		},
		[]
	);

	return {
		isPending,
		formError,
		setFormError,
		lastUpdated,
		formData,
		hasChanges,
		handleFieldChange,
		handleSelectChange,
		handleSubmit,
		showPixReserveField,
		setShowPixReserveField,
		showPixReserveCompensationField,
		setShowPixReserveCompensationField,
		domainModalState: {
			isOpen: isDomainModalOpen,
			method: domainModalMethod,
			optionId: domainModalOptionId,
			draft: domainDraft,
			pendingRemovalKey: pendingDomainRemovalKey,
		},
		handleDomainDraftFieldChange,
		openCreatePaymentLinkDomainModal,
		openEditPaymentLinkDomainModal,
		closeDomainModal,
		saveDomainModal,
		setPaymentLinkDomainAsDefault,
		requestPaymentLinkDomainRemoval,
		confirmPaymentLinkDomainRemoval,
		clearPendingDomainRemoval: () => setPendingDomainRemovalKey(null),
	};
}
