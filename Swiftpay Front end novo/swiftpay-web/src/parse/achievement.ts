import type { MerchantLevel, AchievementType } from '@/types/merchant/achievements';
import type { TParse } from './types';

export const merchantLevelParse: Record<MerchantLevel, Omit<TParse, 'color'> & { color: string; textColor: string }> = {
  Iron:          { label: 'Iron',          color: '#d4d4d4', textColor: '#737373', description: 'Nível inicial' },
  Bronze:        { label: 'Bronze',        color: '#a3a3a3', textColor: '#525252', description: 'Primeiros passos' },
  Silver:        { label: 'Silver',        color: '#a3a3a3', textColor: '#525252', description: 'Crescimento sólido' },
  GoldStart:     { label: 'Gold Start',    color: '#737373', textColor: '#404040', description: 'Entrando no ouro' },
  GoldPro:       { label: 'Gold Pro',      color: '#525252', textColor: '#262626', description: 'Dominando o ouro' },
  Diamond:       { label: 'Diamond',       color: '#404040', textColor: '#171717', description: 'Nível elite' },
  PlatinumStart: { label: 'Platinum Start', color: '#d4d4d4', textColor: '#737373', description: 'Alta performance' },
  PlatinumPro:   { label: 'Platinum Pro',  color: '#a3a3a3', textColor: '#525252', description: 'Dominando a platina' },
  Titanium:      { label: 'Titanium',      color: '#525252', textColor: '#262626', description: 'Nível superior' },
  Black:         { label: 'Black',         color: '#262626', textColor: '#111111', description: 'Quase lendário' },
  Legend:        { label: 'Legend',        color: '#171717', textColor: '#000000', description: 'O topo absoluto' },
};

export const achievementTypeParse: Record<AchievementType, TParse> = {
  VolumeThreshold: { label: 'Volume',             color: 'accent',  description: 'Conquistado ao atingir um volume de transações' },
  FirstSell:       { label: 'Primeira Venda',     color: 'success', description: 'Conquistado na primeira transação aprovada' },
  FirstCheckout:   { label: 'Primeiro Checkout',  color: 'success', description: 'Conquistado ao receber o primeiro pagamento via checkout' },
};
