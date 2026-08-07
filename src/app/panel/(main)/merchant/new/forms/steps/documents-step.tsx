import { Alert } from '@heroui/react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { UploadFolder } from '@/types/enums';
import type { MerchantData } from '@/types/merchant/crud';
import type {
  MerchantOnboardingAnswers,
  MerchantOnboardingUploadRequirement,
} from '../../types/merchant-onboarding.types';
import type { DocumentUploadKey, FieldCorrectionsResolver } from './types';
import type { FileData } from '@/types/merchant/crud';
import { CorrectionFieldLabel, CorrectionHint } from './correction-hint';

interface DocumentsStepProps {
  merchant: MerchantData | null;
  answers: MerchantOnboardingAnswers;
  isBusy: boolean;
  isFieldEditable: (field: keyof MerchantOnboardingAnswers) => boolean;
  requiredUploads: MerchantOnboardingUploadRequirement[];
  getFieldCorrections: FieldCorrectionsResolver;
  getCurrentDocumentFile: (key: DocumentUploadKey) => FileData[];
  getDocumentUploadError: (label: string) => string | null;
  onDocumentFilesChange: (key: DocumentUploadKey, files: FileData[]) => Promise<void>;
}

export function DocumentsStep({
  merchant,
  isBusy,
  isFieldEditable,
  requiredUploads,
  getFieldCorrections,
  getCurrentDocumentFile,
  getDocumentUploadError,
  onDocumentFilesChange,
}: DocumentsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      {!merchant?.id && (
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Salve as informações iniciais antes de enviar documentos</Alert.Title>
            <Alert.Description>
              Avance pelos passos anteriores para criar a organização e liberar o upload dos arquivos.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {requiredUploads.map((item) => {
          const correctionMessages = getFieldCorrections(item.key);
          return (
            <div key={item.key} className="flex flex-col gap-2">
              <ImageUploader
                isAdmin={false}
                merchantId={merchant?.id ?? ''}
                folder={UploadFolder.Kyc}
                label={item.label}
                labelContent={<CorrectionFieldLabel label={item.label} corrections={correctionMessages} />}
                description={item.description}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                required
                maxFiles={1}
                value={[]}
                fileValue={getCurrentDocumentFile(item.key as DocumentUploadKey)}
                onChange={() => undefined}
                onFileValueChange={(files) => void onDocumentFilesChange(item.key as DocumentUploadKey, files)}
                isDisabled={!merchant?.id || isBusy || !isFieldEditable(item.key)}
                error={getDocumentUploadError(item.label)}
                itemHeight="h-44"
                objectFit="contain"
                orientation="col"
              />
              <CorrectionHint corrections={correctionMessages} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
