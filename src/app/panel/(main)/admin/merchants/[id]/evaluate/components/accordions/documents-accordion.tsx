import { TextIcon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { ImageUploader } from '@/components/ui/image-uploader';
import { UploadFolder } from '@/types/enums';
import type { AccordionSharedProps } from './types';

export function DocumentsAccordion({ merchant }: AccordionSharedProps) {
  return (
    <SystemAccordion
      id="org-documents"
      defaultExpanded={false}
      icon={TextIcon}
      title="Documentos"
      summary="Arquivos obrigatórios do processo de verificação"
      color="accent"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ImageUploader
          isAdmin
          folder={UploadFolder.Kyc}
          label="Comprovante de endereço"
          maxFiles={1}
          value={[]}
          onChange={() => {}}
          fileValue={merchant.kyc?.proofOfAddress ? [merchant.kyc.proofOfAddress] : []}
          onFileValueChange={() => {}}
          onlyView
        />
        <ImageUploader
          isAdmin
          folder={UploadFolder.Kyc}
          label="Documento frente"
          maxFiles={1}
          value={[]}
          onChange={() => {}}
          fileValue={merchant.kyc?.documentFront ? [merchant.kyc.documentFront] : []}
          onFileValueChange={() => {}}
          onlyView
        />
        <ImageUploader
          isAdmin
          folder={UploadFolder.Kyc}
          label="Documento verso"
          maxFiles={1}
          value={[]}
          onChange={() => {}}
          fileValue={merchant.kyc?.documentBack ? [merchant.kyc.documentBack] : []}
          onFileValueChange={() => {}}
          onlyView
        />
        <ImageUploader
          isAdmin
          folder={UploadFolder.Kyc}
          label="Selfie com documento"
          maxFiles={1}
          value={[]}
          onChange={() => {}}
          fileValue={merchant.kyc?.selfie ? [merchant.kyc.selfie] : []}
          onFileValueChange={() => {}}
          onlyView
        />
        {merchant.kyc?.documentType === 'CNPJ' && (
          <ImageUploader
            isAdmin
            folder={UploadFolder.Kyc}
            label="Cartão CNPJ"
            maxFiles={1}
            value={[]}
            onChange={() => {}}
            fileValue={merchant.kyc?.cnpjCard ? [merchant.kyc.cnpjCard] : []}
            onFileValueChange={() => {}}
            onlyView
          />
        )}
        {merchant.kyc?.documentType === 'CNPJ' && merchant.kyc?.usesCreditCard && (
          <ImageUploader
            isAdmin
            folder={UploadFolder.Kyc}
            label="Contrato social"
            maxFiles={1}
            value={[]}
            onChange={() => {}}
            fileValue={merchant.kyc?.companyContract ? [merchant.kyc.companyContract] : []}
            onFileValueChange={() => {}}
            onlyView
          />
        )}
      </div>
    </SystemAccordion>
  );
}
