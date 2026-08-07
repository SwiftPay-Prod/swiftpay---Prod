'use client';

import { useActionState, useMemo, useTransition } from 'react';
import { Alert, Button, Card, Description, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon, CancelCircleIcon, Wallet01Icon } from '@hugeicons/core-free-icons';
import { NumericFormat } from 'react-number-format';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { Icon } from '@/components/ui/icon';
import type {
  AdminCreateReferralCommissionPaymentRequest,
  AdminUserDetails,
  AdminUserReferralCommissionPaymentHistory,
} from '@/types/admin/users';
import { adminCreateReferralCommissionPayment } from '@/app/actions/admin/users';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { currencyFormatProps } from '@/utils/input-masks';
import { pixKeyTypeParse } from '@/parse';

interface ReferralCommissionTabProps {
  user: AdminUserDetails;
  onSaved?: () => void;
}

interface FormState {
  error: string | null;
}

function getColumns(): DataTableColumn<AdminUserReferralCommissionPaymentHistory>[] {
  return [
    {
      key: 'paidAt',
      header: 'Pago em',
      render: (item) => <span className="text-sm text-muted">{formatDate(item.paidAt)}</span>,
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (item) => <span className="font-medium">{formatCurrency(item.amount)}</span>,
    },
    {
      key: 'paidByUserName',
      header: 'Pago por',
      render: (item) => <span>{item.paidByUserName || '—'}</span>,
    },
    {
      key: 'notes',
      header: 'Observações',
      render: (item) => <span className="text-sm text-muted">{item.notes || '—'}</span>,
    },
  ];
}

function renderMobileCommissionHistoryCard(item: AdminUserReferralCommissionPaymentHistory) {
  return (
    <div className="rounded-xl border border-divider bg-surface p-3 overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-medium text-sm">{formatCurrency(item.amount)}</span>
        <span className="text-xs text-muted">{formatDate(item.paidAt)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted">Pago por</span>
          <span className="text-sm">{item.paidByUserName || '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted">Observações</span>
          <span className="text-sm text-muted">{item.notes || '—'}</span>
        </div>
      </div>
    </div>
  );
}

export function ReferralCommissionTab({ user, onSaved }: ReferralCommissionTabProps) {
  const [isRefreshing, startTransition] = useTransition();
  const columns = useMemo(() => getColumns(), []);

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const rawAmount = String(formData.get('amount') ?? '').trim();
      const notes = String(formData.get('notes') ?? '').trim();
      const amount = Number.parseInt(rawAmount.replace(/\D/g, ''), 10);

      if (!rawAmount || Number.isNaN(amount) || amount <= 0) {
        return { error: 'Informe um valor válido para pagamento.' };
      }

      const payload: AdminCreateReferralCommissionPaymentRequest = {
        amount,
        notes: notes || null,
      };

      const response = await adminCreateReferralCommissionPayment(user.id, payload);

      if (response.error) {
        toast('Erro ao registrar pagamento', {
          description: response.error.message,
          variant: 'danger',
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
        });
        return { error: response.error.message };
      }

      toast('Pagamento registrado', {
        description: 'O pagamento manual da comissão foi registrado com sucesso.',
        variant: 'success',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      });

      startTransition(() => {
        onSaved?.();
      });

      return { error: null };
    },
    { error: null }
  );

  const pixKeyType = user.referralPayoutPixKeyType
    ? pixKeyTypeParse[user.referralPayoutPixKeyType]?.label ?? user.referralPayoutPixKeyType
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Icon icon={Wallet01Icon} className="icon-md text-accent" />
            <Card.Title>Saldo de comissão</Card.Title>
          </div>
        </Card.Header>
        <Card.Content className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-divider bg-surface p-4">
            <p className="text-xs text-muted">Comissão total estimada</p>
            <p className="text-lg font-semibold">{formatCurrency(user.referralCommission.estimatedCommissionTotal)}</p>
          </div>
          <div className="rounded-xl border border-divider bg-surface p-4">
            <p className="text-xs text-muted">Comissão já paga</p>
            <p className="text-lg font-semibold">{formatCurrency(user.referralCommission.paidCommissionTotal)}</p>
          </div>
          <div className="rounded-xl border border-accent-soft bg-accent-soft p-4">
            <p className="text-xs text-accent">Saldo disponível</p>
            <p className="text-lg font-semibold text-accent">
              {formatCurrency(user.referralCommission.availableCommissionBalance)}
            </p>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Card.Title>Chave PIX do usuário</Card.Title>
            <Description>Usada como referência para pagamento manual da comissão.</Description>
          </div>
        </Card.Header>
        <Card.Content className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-divider bg-surface p-3">
            <span className="text-xs text-muted">Tipo da chave</span>
            <p className="text-sm font-medium">{pixKeyType ?? 'Não informado'}</p>
          </div>
          <div className="rounded-xl border border-divider bg-surface p-3">
            <span className="text-xs text-muted">Chave PIX</span>
            <p className="text-sm font-medium break-all">{user.referralPayoutPixKey || 'Não informado'}</p>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Card.Title>Registrar pagamento manual</Card.Title>
            <Description>
              Apenas Admin/God podem registrar pagamentos. O valor não pode ultrapassar o saldo disponível.
            </Description>
          </div>
        </Card.Header>
        <Card.Content>
          {(!user.referralPayoutPixKeyType || !user.referralPayoutPixKey) && (
            <Alert status="warning" className="mb-4">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Usuário sem chave PIX cadastrada</Alert.Title>
                <Alert.Description>
                  Solicite ao usuário o cadastro da chave PIX na tela de Indique e Ganhe antes de registrar o pagamento.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <Form action={formAction} className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
            <TextField variant="secondary" name="amount" validate={() => state.error}>
              <Label>Valor a pagar (R$)</Label>
              <NumericFormat customInput={Input} {...currencyFormatProps} placeholder="0,00" />
              <FieldError />
            </TextField>

            <TextField variant="secondary" name="notes">
              <Label>Observações</Label>
              <Input variant="secondary" placeholder="Opcional" />
            </TextField>

            <Button
              type="submit"
              variant="primary"
              isPending={isPending || isRefreshing}
              isDisabled={user.referralCommission.availableCommissionBalance <= 0}
            >
              {isPending || isRefreshing ? 'Salvando...' : 'Registrar pagamento'}
            </Button>
          </Form>
        </Card.Content>
      </Card>

      <DataTable
        columns={columns}
        data={user.referralCommission.paymentHistory}
        keyExtractor={(item) => item.id}
        renderMobileCard={renderMobileCommissionHistoryCard}
        emptyMessage="Nenhum pagamento de comissão registrado"
        minWidth="min-w-180"
      />
    </div>
  );
}
