import type { MerchantLevel, AchievementType } from '@/types/merchant/achievements';
import type { TParse } from './types';

export const merchantLevelParse: Record<MerchantLevel, Omit<TParse, 'color'> & { color: string; textColor: string }> = {
  Iron:          { label: 'Iron',          color: '#9ca3af', textColor: '#6b7280', description: 'Nível inicial' },
  Bronze:        { label: 'Bronze',        color: '#cd7f32', textColor: '#92400e', description: 'Primeiros passos' },
  Silver:        { label: 'Silver',        color: '#c0c0c0', textColor: '#6b7280', description: 'Crescimento sólido' },
  GoldStart:     { label: 'Gold Start',    color: '#f59e0b', textColor: '#92400e', description: 'Entrando no ouro' },
  GoldPro:       { label: 'Gold Pro',      color: '#d97706', textColor: '#78350f', description: 'Dominando o ouro' },
  Diamond:       { label: 'Diamond',       color: '#3b82f6', textColor: '#1d4ed8', description: 'Nível elite' },
  PlatinumStart: { label: 'Platinum Start', color: '#e2e8f0', textColor: '#475569', description: 'Alta performance' },
  PlatinumPro:   { label: 'Platinum Pro',  color: '#cbd5e1', textColor: '#334155', description: 'Dominando a platina' },
  Titanium:      { label: 'Titanium',      color: '#7c3aed', textColor: '#5b21b6', description: 'Nível superior' },
  Black:         { label: 'Black',         color: '#1f2937', textColor: '#111827', description: 'Quase lendário' },
  Legend:        { label: 'Legend',        color: '#f97316', textColor: '#c2410c', description: 'O topo absoluto' },
};

export const achievementTypeParse: Record<AchievementType, TParse> = {
  VolumeThreshold: { label: 'Volume',             color: 'accent',  description: 'Conquistado ao atingir um volume de transações' },
  FirstSell:       { label: 'Primeira Venda',     color: 'success', description: 'Conquistado na primeira transação aprovada' },
  FirstCheckout:   { label: 'Primeiro Checkout',  color: 'success', description: 'Conquistado ao receber o primeiro pagamento via checkout' },
};
