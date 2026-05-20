import type { PixKeyType } from '@/types/enums';
import type { TParse } from './types';

/**
 * PIX Key Type Parse
 * Converts PixKeyType enum to label and description
 */
export const pixKeyTypeParse: Record<PixKeyType, Omit<TParse, 'icon'>> = {
  CPF: {
    label: 'CPF',
    color: 'default',
    description: 'Chave PIX do tipo CPF',
  },
  CNPJ: {
    label: 'CNPJ',
    color: 'default',
    description: 'Chave PIX do tipo CNPJ',
  },
  EMAIL: {
    label: 'E-mail',
    color: 'default',
    description: 'Chave PIX do tipo e-mail',
  },
  PHONE: {
    label: 'Telefone',
    color: 'default',
    description: 'Chave PIX do tipo telefone',
  },
  RANDOM: {
    label: 'Chave Aleatória',
    color: 'default',
    description: 'Chave PIX aleatória',
  },
};
