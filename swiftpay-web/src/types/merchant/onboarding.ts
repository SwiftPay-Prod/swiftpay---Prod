import { MerchantOnboardingStep } from "@/types/enums";

export { 
  type BasicInfoFormData, 
  type AddressFormData, 
  type DocumentsFormData,
  type BillingFormData,
  merchantToBasicInfoFormData,
  merchantToAddressFormData,
  merchantToDocumentsFormData,
  merchantToBillingFormData,
} from "@/converters/onboarding-converters";

export interface OnboardingStepConfig {
  key: MerchantOnboardingStep;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    key: MerchantOnboardingStep.BasicInfo,
    title: "Informações Básicas",
    description: "Nome, email e WhatsApp",
  },
  {
    key: MerchantOnboardingStep.Address,
    title: "Endereço",
    description: "Localização da empresa",
  },
  {
    key: MerchantOnboardingStep.Documents,
    title: "Documentos",
    description: "Documentação e KYC",
  },
  {
    key: MerchantOnboardingStep.Billing,
    title: "Faturamento",
    description: "Receita e volume transacionado",
  },
  {
    key: MerchantOnboardingStep.Review,
    title: "Revisão",
    description: "Confirmar informações",
  },
];

export function getStepIndex(step: MerchantOnboardingStep): number {
  const index = ONBOARDING_STEPS.findIndex((s) => s.key === step);
  return index >= 0 ? index : 0;
}

export function getStepByIndex(index: number): MerchantOnboardingStep {
  return ONBOARDING_STEPS[index]?.key ?? MerchantOnboardingStep.BasicInfo;
}

export function isStepCompleted(
  currentStep: MerchantOnboardingStep,
  checkStep: MerchantOnboardingStep
): boolean {
  if (currentStep === MerchantOnboardingStep.Completed) return true;
  return getStepIndex(currentStep) > getStepIndex(checkStep);
}

