import { Alert02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { MerchantOnboardingFieldCorrection } from '../../types/merchant-onboarding.types';

interface CorrectionHintProps {
  corrections: MerchantOnboardingFieldCorrection[];
}

interface CorrectionFieldLabelProps {
  label: string;
  corrections: MerchantOnboardingFieldCorrection[];
}

export function CorrectionFieldLabel({ label, corrections }: CorrectionFieldLabelProps) {
  const hasCorrections = corrections.length > 0;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        hasCorrections ? 'text-warning' : 'text-foreground',
      ].join(' ')}
    >
      {hasCorrections && <Icon icon={Alert02Icon} className="icon-xs shrink-0" />}
      <span>{label}</span>
    </span>
  );
}

export function CorrectionHint({ corrections }: CorrectionHintProps) {
  if (corrections.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-col gap-1">
      {corrections.map((item) => (
        <p key={item.itemId} className="text-xs leading-relaxed text-warning">
          <span className="font-semibold">{item.title}</span>
          {item.description ? `: ${item.description}` : ''}
        </p>
      ))}
    </div>
  );
}
