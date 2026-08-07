import { Chip } from '@heroui/react';
import { TransactionHistoryIcon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import {
  merchantKycPendingItemTypeParse,
  merchantKycPendingItemStatusParse,
  mapParseColorToChipColor,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { MerchantKycPendingItemStatus } from '@/types/enums';
import type { ComplementHistoryAccordionProps } from './types';

export function ComplementHistoryAccordion({
  complementHistory,
  evaluatedItemsMap,
  getPendingFieldLabel,
  getPendingFieldCurrentValue,
}: ComplementHistoryAccordionProps) {
  if (complementHistory.length === 0) {
    return null;
  }

  return (
    <SystemAccordion
      id="org-admin-history"
      defaultExpanded={false}
      icon={TransactionHistoryIcon}
      title={`Histórico de complementos (${complementHistory.length})`}
      summary="Evolução das solicitações, respostas e decisões"
      color="accent"
    >
      <div className="flex flex-col gap-4">
        {complementHistory.map((item) => {
          const typeParse = merchantKycPendingItemTypeParse[item.type as keyof typeof merchantKycPendingItemTypeParse];
          const currentStatus = evaluatedItemsMap[item.id] ?? item.status;
          const itemStatusParse =
            merchantKycPendingItemStatusParse[currentStatus as keyof typeof merchantKycPendingItemStatusParse];
          const newValue = getPendingFieldCurrentValue(item.fieldKey);
          const statusAccentClass =
            currentStatus === MerchantKycPendingItemStatus.Approved
              ? 'border-l-success'
              : currentStatus === MerchantKycPendingItemStatus.Rejected
                ? 'border-l-danger'
                : 'border-l-warning';

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-2 rounded-lg border border-divider bg-content1 p-3 shadow-xs border-l-4 ${statusAccentClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    {typeParse?.icon}
                    <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  </div>
                  {item.description && <p className="text-xs text-foreground">{item.description}</p>}
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Chip variant="soft" size="sm" color="accent">
                      Campo: {getPendingFieldLabel(item.fieldKey)}
                    </Chip>
                  </div>
                </div>
                <Chip variant="soft" size="sm" color={mapParseColorToChipColor(itemStatusParse?.color ?? 'default')}>
                  {itemStatusParse?.label ?? currentStatus}
                </Chip>
              </div>

              {item.respondedAt && (
                <div className="rounded-md border border-divider bg-surface p-2.5">
                  <span className="text-xs font-semibold text-muted">Novo valor informado</span>
                  <p className="mt-0.5 text-xs font-semibold text-foreground">{newValue}</p>

                  <span className="mt-1.5 block text-xs font-medium text-muted">
                    Respondido em {formatDate(item.respondedAt)}
                  </span>
                </div>
              )}

              <span className="text-xs font-medium text-foreground">Solicitado em {formatDate(item.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </SystemAccordion>
  );
}
