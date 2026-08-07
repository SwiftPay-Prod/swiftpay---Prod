import type { FileData } from '@/types/merchant/crud';
import type {
  MerchantOnboardingAnswers,
  MerchantOnboardingFieldCorrection,
  MerchantOnboardingStepId,
} from '../../types/merchant-onboarding.types';

export type OnboardingValueChange = <K extends keyof MerchantOnboardingAnswers>(
  field: K,
  value: MerchantOnboardingAnswers[K]
) => void;

export type StepErrorMatcher = (
  stepId: MerchantOnboardingStepId,
  ...messages: string[]
) => string | null;

export type FieldCorrectionsResolver = (
  field: keyof MerchantOnboardingAnswers
) => MerchantOnboardingFieldCorrection[];

export type DocumentUploadKey =
  | 'proofOfAddressFileId'
  | 'documentFrontFileId'
  | 'documentBackFileId'
  | 'selfieFileId'
  | 'cnpjCardFileId'
  | 'companyContractFileId';

export type DocumentFilesMap = Record<DocumentUploadKey, FileData | null>;
