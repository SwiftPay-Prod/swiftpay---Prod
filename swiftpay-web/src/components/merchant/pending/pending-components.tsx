'use client';

import { Alert, Button, Chip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
  Alert01Icon,
	Briefcase01Icon,
	Building02Icon,
	CallingIcon,
	DocumentValidationIcon,
	File01Icon,
	GlobalIcon,
  InformationCircleIcon,
	MailOpen01Icon,
	MapPinIcon,
  Pen01Icon,
	UserCircleIcon,
	ViewIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import type { FileData } from '@/types/merchant/crud';
import { TimeRemaining } from '@/components/ui/time-remaining';
import { 
  merchantKycStatusParse,
  merchantDocumentTypeParse,
  merchantIdentityDocumentTypeParse,
  merchantOperationTypeParse
} from '@/parse';
import { 
  MerchantKycDocumentType, 
  MerchantIdentityDocumentType, 
  MerchantKycOperationType,
  MerchantKycStatus
} from '@/types/enums';
import { EmailLink, PhoneLink } from '@/components/ui/data-links';

interface KycStatusChipProps {
  status: MerchantKycStatus;
}

export function KycStatusChip({ status }: KycStatusChipProps) {
  const parse = merchantKycStatusParse[status];
  const chipColor = parse.color === 'secondary' ? 'default' : parse.color;
  
  return (
    <Chip variant="soft" color={chipColor} size="sm">
      <span className="flex items-center gap-2">
        {parse.icon}
        {parse.label}
      </span>
    </Chip>
  );
}

interface KycStatusAlertProps {
  status: MerchantKycStatus;
  hasPendingItems?: boolean;
  rejectionReason?: string | null;
  onResolveComplements?: () => void;
}

export function KycStatusAlert({
  status,
  hasPendingItems = false,
  rejectionReason,
  onResolveComplements,
}: KycStatusAlertProps) {
  if (status === MerchantKycStatus.UnderReview) {
    return (
      <Alert status="warning">
        <Alert.Indicator>
          <Icon icon={InformationCircleIcon} className="icon-md" />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Análise em andamento</Alert.Title>
          <Alert.Description>
            Sua organização está em análise pela nossa equipe. Esse processo pode levar até 2 dias úteis. Você
            receberá uma notificação quando a análise for concluída.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (status === MerchantKycStatus.Complement) {
    return (
      <Alert status="warning">
        <Alert.Indicator>
          <Icon icon={InformationCircleIcon} className="icon-md" />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Complemento solicitado</Alert.Title>
          <Alert.Description>
            <div className="flex flex-col gap-3">
              <p>
                Nossa equipe solicitou informações complementares para dar continuidade à análise. Revise as pendências
                e envie os dados solicitados.
              </p>
              {hasPendingItems && onResolveComplements && (
                <div>
                  <Button variant="secondary" onPress={onResolveComplements}>
                    <Icon icon={Pen01Icon} className="icon-sm" />
                    Responder/corrigir complementos
                  </Button>
                </div>
              )}
            </div>
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (status === MerchantKycStatus.Rejected) {
    return (
      <Alert status="danger">
        <Alert.Indicator>
          <Icon icon={Alert01Icon} className="icon-md" />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Cadastro não aprovado</Alert.Title>
          <Alert.Description>
            <div className="flex flex-col gap-2">
              <p>
                Sua organização não foi aprovada. Verifique o motivo abaixo e entre em contato com o suporte se tiver
                dúvidas.
              </p>
              {rejectionReason && (
                <p>
                  <strong>Motivo da reprovação:</strong> {rejectionReason}
                </p>
              )}
            </div>
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return null;
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

export function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-default-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-tiny text-default-400">{label}</p>
        <p className="text-sm text-foreground">{value || '-'}</p>
      </div>
    </div>
  );
}

interface InfoItemEmailProps {
  icon: React.ReactNode;
  label: string;
  email: string | null | undefined;
}

export function InfoItemEmail({ icon, label, email }: InfoItemEmailProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-default-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-tiny text-default-400">{label}</p>
        <EmailLink email={email} className="text-sm" />
      </div>
    </div>
  );
}

interface InfoItemPhoneProps {
  icon: React.ReactNode;
  label: string;
  phone: string | null | undefined;
}

export function InfoItemPhone({ icon, label, phone }: InfoItemPhoneProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-default-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-tiny text-default-400">{label}</p>
        <PhoneLink phone={phone} className="text-sm" />
      </div>
    </div>
  );
}

interface DocumentItemProps {
  label: string;
  file: FileData | null | undefined;
}

export function DocumentItem({ label, file }: DocumentItemProps) {
  function handleViewFile() {
    if (file?.url) {
      window.open(file.url, '_blank');
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-content2 rounded-lg">
      <div className="flex items-center gap-3">
          <Icon icon={DocumentValidationIcon} className="icon-md text-default-400" />
        <div>
          <span className="text-sm">{label}</span>
          {file && (
            <p className="text-tiny text-default-500">{file.originalFileName}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {file ? (
          <>
            <TimeRemaining 
              expiresAt={file.expiresAt} 
              tooltip="Tempo restante para visualizar o arquivo" 
            />
            <Button isIconOnly size="sm" variant="secondary" onPress={handleViewFile}>
              <Icon icon={ViewIcon} className="icon-sm" />
            </Button>
            <Chip variant="soft" color="success" size="sm">Enviado</Chip>
          </>
        ) : (
          <Chip variant="soft" color="default" size="sm">Não enviado</Chip>
        )}
      </div>
    </div>
  );
}

export const PendingIcons = {
  Buildings: <Icon icon={Building02Icon} className="icon-sm" />,
  Letter: <Icon icon={MailOpen01Icon} className="icon-sm" />,
  Phone: <Icon icon={CallingIcon} className="icon-sm" />,
  MapPoint: <Icon icon={MapPinIcon} className="icon-sm" />,
  Briefcase: <Icon icon={Briefcase01Icon} className="icon-sm" />,
  DocumentText: <Icon icon={File01Icon} className="icon-sm" />,
  Globe: <Icon icon={GlobalIcon} className="icon-sm" />,
  MoneyBag: <Icon icon={Wallet01Icon} className="icon-sm" />,
  User: <Icon icon={UserCircleIcon} className="icon-sm" />,
};

export function formatDocumentType(type?: MerchantKycDocumentType | null): string | null {
  if (!type) return null;
  return merchantDocumentTypeParse[type].label;
}

export function formatIdentityDocumentType(type?: MerchantIdentityDocumentType | null): string | null {
  if (!type) return null;
  return merchantIdentityDocumentTypeParse[type].label;
}

export function formatOperationType(type?: MerchantKycOperationType | null): string | null {
  if (!type) return null;
  return merchantOperationTypeParse[type].label;
}

