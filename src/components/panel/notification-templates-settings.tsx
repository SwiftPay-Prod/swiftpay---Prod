'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Input,
  Label,
  Skeleton,
  TextArea,
  TextField,
  toast,
} from '@heroui/react';
import {
  Alert01Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  Notification01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import {
  deleteNotificationTemplate,
  getNotificationTemplates,
  upsertNotificationTemplate,
} from '@/app/actions/user';
import { Icon } from '@/components/ui/icon';
import type {
  NotificationTemplateData,
  NotificationTemplatesData,
} from '@/types/user/notifications';

const PLACEHOLDER_REGEX = /\{([^{}]*)\}/g;
const PREVIEW_VALUES: Record<string, string> = {
  amount: 'R$ 500,00',
  netAmount: 'R$ 495,00',
  customerName: 'Maria Silva',
  orderId: 'ORD-1001',
  transactionId: 'TX-ABC123',
  pixKey: '***.***.***-**',
};

type TemplateDraft = {
  title: string;
  body: string;
};

type TemplateSettingsState = {
  status: 'loading' | 'ready' | 'error';
  data: NotificationTemplatesData | null;
  error: string | null;
  expandedKey: string | null;
  drafts: Record<string, TemplateDraft>;
  operationKey: string | null;
  rowMessages: Record<string, { tone: 'success' | 'danger'; text: string }>;
};

const INITIAL_STATE: TemplateSettingsState = {
  status: 'loading',
  data: null,
  error: null,
  expandedKey: null,
  drafts: {},
  operationKey: null,
  rowMessages: {},
};

function getEventKey(template: NotificationTemplateData): string {
  return `${template.type}:${template.statusType}`;
}

function getDraft(state: TemplateSettingsState, template: NotificationTemplateData): TemplateDraft {
  return state.drafts[getEventKey(template)] ?? {
    title: template.titleTemplate ?? '',
    body: template.bodyTemplate ?? '',
  };
}

function validateTemplate(
  value: string,
  allowedPlaceholders: readonly string[],
  maxLength: number,
  fieldName: string,
): string | null {
  if (value.length > maxLength) {
    return `${fieldName} deve ter no máximo ${maxLength} caracteres.`;
  }

  const textWithoutPlaceholders = value.replace(PLACEHOLDER_REGEX, '');
  if (textWithoutPlaceholders.includes('{') || textWithoutPlaceholders.includes('}')) {
    return 'Revise as chaves dos placeholders.';
  }

  for (const match of value.matchAll(PLACEHOLDER_REGEX)) {
    const placeholderName = match[1];
    if (!placeholderName || !allowedPlaceholders.includes(placeholderName)) {
      return `Placeholder {${placeholderName}} não permitido.`;
    }
  }

  return null;
}

function renderPreview(template: string, fallback: string): string {
  const source = template.trim() || fallback;
  return source.replace(PLACEHOLDER_REGEX, (match, placeholderName: string) =>
    PREVIEW_VALUES[placeholderName] ?? match
  );
}


export function NotificationTemplatesSettings() {
  const [state, setState] = useState<TemplateSettingsState>(INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    getNotificationTemplates()
      .then((response) => {
        if (cancelled) return;

        if (response?.data) {
          setState((current) => ({
            ...current,
            status: 'ready',
            data: response.data,
            error: null,
          }));
          return;
        }

        setState((current) => ({
          ...current,
          status: 'error',
          error: response?.error?.message ?? 'Não foi possível carregar os templates.',
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            status: 'error',
            error: 'Não foi possível carregar os templates. Verifique sua conexão e tente novamente.',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function retryLoad() {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    startTransition(async () => {
      try {
        const response = await getNotificationTemplates();
        if (!response?.data) {
          setState((current) => ({
            ...current,
            status: 'error',
            error: response?.error?.message ?? 'Não foi possível carregar os templates.',
          }));
          return;
        }

        setState((current) => ({
          ...current,
          status: 'ready',
          data: response.data,
          error: null,
        }));
      } catch {
        setState((current) => ({
          ...current,
          status: 'error',
          error: 'Não foi possível carregar os templates. Verifique sua conexão e tente novamente.',
        }));
      }
    });
  }

  function toggleExpanded(template: NotificationTemplateData) {
    const key = getEventKey(template);
    setState((current) => ({
      ...current,
      expandedKey: current.expandedKey === key ? null : key,
    }));
  }

  function updateDraft(
    template: NotificationTemplateData,
    field: keyof TemplateDraft,
    value: string,
  ) {
    const key = getEventKey(template);
    setState((current) => {
      const draft = getDraft(current, template);
      const remainingMessages = { ...current.rowMessages };
      delete remainingMessages[key];
      return {
        ...current,
        drafts: {
          ...current.drafts,
          [key]: { ...draft, [field]: value },
        },
        rowMessages: remainingMessages,
      };
    });
  }

  function saveTemplate(template: NotificationTemplateData) {
    if (!state.data) return;

    const key = getEventKey(template);
    const draft = getDraft(state, template);
    const titleTemplate = draft.title.trim();
    const bodyTemplate = draft.body.trim();
    const titleError = validateTemplate(
      draft.title,
      state.data.allowedPlaceholders,
      80,
      'O título',
    );
    const bodyError = validateTemplate(
      draft.body,
      state.data.allowedPlaceholders,
      240,
      'A mensagem',
    );

    if (titleError || bodyError || (!titleTemplate && !bodyTemplate)) {
      setState((current) => ({
        ...current,
        rowMessages: {
          ...current.rowMessages,
          [key]: {
            tone: 'danger',
            text: titleError ?? bodyError ?? 'Preencha o título ou a mensagem antes de salvar.',
          },
        },
      }));
      return;
    }

    setState((current) => ({ ...current, operationKey: key }));
    startTransition(async () => {
      try {
        const response = await upsertNotificationTemplate({
          type: template.type,
          statusType: template.statusType,
          titleTemplate: titleTemplate || null,
          bodyTemplate: bodyTemplate || null,
        });

        if (!response?.data) {
          setState((current) => ({
            ...current,
            operationKey: null,
            rowMessages: {
              ...current.rowMessages,
              [key]: {
                tone: 'danger',
                text: response?.error?.message ?? 'Não foi possível salvar a personalização.',
              },
            },
          }));
          return;
        }
        const savedTemplate = response.data;

        setState((current) => ({
          ...current,
          data: current.data ? {
            ...current.data,
            items: current.data.items.map((item) =>
              getEventKey(item) === key ? savedTemplate : item
            ),
          } : current.data,
          drafts: Object.fromEntries(
            Object.entries(current.drafts).filter(([draftKey]) => draftKey !== key)
          ),
          operationKey: null,
          rowMessages: {
            ...current.rowMessages,
            [key]: { tone: 'success', text: 'Personalização salva.' },
          },
        }));
        toast('Personalização salva', { variant: 'success' });
      } catch {
        setState((current) => ({
          ...current,
          operationKey: null,
          rowMessages: {
            ...current.rowMessages,
            [key]: {
              tone: 'danger',
              text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
            },
          },
        }));
      }
    });
  }

  function resetTemplate(template: NotificationTemplateData) {
    const key = getEventKey(template);
    setState((current) => ({ ...current, operationKey: key }));
    startTransition(async () => {
      try {
        const response = await deleteNotificationTemplate(template.type, template.statusType);
        if (response?.error) {
          const errorMessage = response.error.message ?? 'Não foi possível restaurar o padrão.';
          setState((current) => ({
            ...current,
            operationKey: null,
            rowMessages: {
              ...current.rowMessages,
              [key]: { tone: 'danger', text: errorMessage },
            },
          }));
          return;
        }

        const resetItem: NotificationTemplateData = {
          ...template,
          titleTemplate: null,
          bodyTemplate: null,
          updatedAt: null,
          isCustom: false,
        };
        setState((current) => ({
          ...current,
          data: current.data ? {
            ...current.data,
            items: current.data.items.map((item) =>
              getEventKey(item) === key ? resetItem : item
            ),
          } : current.data,
          drafts: Object.fromEntries(
            Object.entries(current.drafts).filter(([draftKey]) => draftKey !== key)
          ),
          operationKey: null,
          rowMessages: {
            ...current.rowMessages,
            [key]: { tone: 'success', text: 'Template padrão restaurado.' },
          },
        }));
        toast('Template padrão restaurado', { variant: 'success' });
      } catch {
        setState((current) => ({
          ...current,
          operationKey: null,
          rowMessages: {
            ...current.rowMessages,
            [key]: {
              tone: 'danger',
              text: 'Não foi possível restaurar o padrão. Tente novamente.',
            },
          },
        }));
      }
    });
  }

  if (state.status === 'loading') {
    return (
      <Card className="rounded-[20px] border border-white/12 bg-card">
        <Card.Header>
          <div className="flex flex-col gap-2">
            <Card.Title>Personalização das notificações</Card.Title>
            <Description>Carregando modelos disponíveis…</Description>
          </div>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-16 w-full rounded-xl" />
          ))}
        </Card.Content>
      </Card>
    );
  }

  if (state.status === 'error' || !state.data) {
    return (
      <Card className="rounded-[20px] border border-white/12 bg-card">
        <Card.Header>
          <Card.Title>Personalização das notificações</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-4 rounded-xl border border-danger/30 bg-danger/10 p-4" role="alert">
            <div className="flex items-start gap-2">
              <Icon icon={Alert01Icon} className="icon-sm mt-0.5 shrink-0 text-danger" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Templates indisponíveis</p>
                <p className="text-sm text-white/70">{state.error}</p>
              </div>
            </div>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              isPending={isPending}
              onPress={retryLoad}
            >
              <Icon icon={RefreshIcon} className="icon-sm" />
              Tentar novamente
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const templatesData = state.data;

  return (
    <Card className="rounded-[20px] border border-white/12 bg-card">
      <Card.Header>
        <div className="flex flex-col gap-2">
          <Card.Title>Personalização das notificações</Card.Title>
          <Description>
            Ajuste o texto do push por evento. A notificação no painel continua usando a mensagem padrão.
          </Description>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-medium text-white">Placeholders disponíveis</p>
          <div className="flex flex-wrap gap-2">
            {templatesData.allowedPlaceholders.map((placeholder) => (
              <Chip key={placeholder} size="sm" variant="soft" color="default">
                <span className="font-mono">{`{${placeholder}}`}</span>
              </Chip>
            ))}
          </div>
          <p className="text-xs text-white/50">
            O preview abaixo usa dados ilustrativos; no envio, cada placeholder recebe o valor real do evento.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {templatesData.items.map((template) => {
            const key = getEventKey(template);
            const draft = getDraft(state, template);
            const isExpanded = state.expandedKey === key;
            const titleError = validateTemplate(
              draft.title,
              templatesData.allowedPlaceholders,
              80,
              'O título',
            );
            const bodyError = validateTemplate(
              draft.body,
              templatesData.allowedPlaceholders,
              240,
              'A mensagem',
            );
            const isOperating = state.operationKey === key && isPending;
            const rowMessage = state.rowMessages[key];

            return (
              <section key={key} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <button
                  type="button"
                  className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent"
                  aria-expanded={isExpanded}
                  aria-controls={`template-editor-${key}`}
                  onClick={() => toggleExpanded(template)}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                      <Icon icon={Notification01Icon} className="icon-sm text-white/70" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{template.label}</span>
                      <span className="block truncate text-xs text-white/50">{template.defaultTitle}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Chip size="sm" variant="soft" color={template.isCustom ? 'success' : 'default'}>
                      {template.isCustom ? 'Personalizado' : 'Padrão'}
                    </Chip>
                    <Icon
                      icon={ArrowDown01Icon}
                      className={`icon-sm text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>

                {isExpanded ? (
                  <div id={`template-editor-${key}`} className="flex flex-col gap-4 border-t border-white/10 p-4">
                    <div className="flex flex-col gap-2 rounded-xl bg-black/40 p-4" aria-live="polite">
                      <span className="text-xs font-medium text-white/50">Pré-visualização do push</span>
                      <span className="break-words text-sm font-semibold text-white">
                        {renderPreview(draft.title, template.defaultTitle)}
                      </span>
                      <span className="break-words text-sm text-white/70">
                        {renderPreview(draft.body, template.defaultBody)}
                      </span>
                    </div>

                    <TextField
                      variant="secondary"
                      value={draft.title}
                      onChange={(value) => updateDraft(template, 'title', value)}
                      isInvalid={titleError != null}
                    >
                      <Label>Título personalizado</Label>
                      <Input
                        variant="secondary"
                        className="h-14 rounded-[12px]"
                        placeholder={template.defaultTitle}
                        maxLength={80}
                      />
                      {titleError ? <FieldError>{titleError}</FieldError> : null}
                      <Description>{draft.title.length}/80 caracteres</Description>
                    </TextField>

                    <TextField
                      variant="secondary"
                      value={draft.body}
                      onChange={(value) => updateDraft(template, 'body', value)}
                      isInvalid={bodyError != null}
                    >
                      <Label>Mensagem personalizada</Label>
                      <TextArea
                        variant="secondary"
                        className="min-h-28 rounded-[12px]"
                        placeholder={template.defaultBody}
                        maxLength={240}
                        rows={3}
                      />
                      {bodyError ? <FieldError>{bodyError}</FieldError> : null}
                      <Description>{draft.body.length}/240 caracteres</Description>
                    </TextField>

                    {rowMessage ? (
                      <div
                        className={`flex items-center gap-2 text-sm ${rowMessage.tone === 'success' ? 'text-success' : 'text-danger'}`}
                        role={rowMessage.tone === 'danger' ? 'alert' : 'status'}
                      >
                        <Icon
                          icon={rowMessage.tone === 'success' ? CheckmarkCircle02Icon : Alert01Icon}
                          className="icon-sm shrink-0"
                        />
                        {rowMessage.text}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        className="w-full sm:w-auto"
                        variant="primary"
                        isPending={isOperating}
                        isDisabled={titleError != null || bodyError != null || state.operationKey != null}
                        onPress={() => saveTemplate(template)}
                      >
                        Salvar personalização
                      </Button>
                      <Button
                        className="w-full sm:w-auto"
                        variant="secondary"
                        isPending={isOperating}
                        isDisabled={!template.isCustom || state.operationKey != null}
                        onPress={() => resetTemplate(template)}
                      >
                        Restaurar padrão
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}
