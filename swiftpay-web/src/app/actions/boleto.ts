'use server';

import axios from 'axios';
import type { ApiResponse } from '@/types/common';
import type { BoletoData } from '@/types/boleto';

const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function getBoletoData(paymentId: string): Promise<ApiResponse<BoletoData>> {
  try {
    const response = await axios.get<ApiResponse<BoletoData>>(`${apiUrl}/v1/boleto/${paymentId}`, {
      timeout: 10000,
    });
    return response.data;
  } catch {
    return {
      data: null,
      message: null,
      error: { message: 'Erro ao buscar dados do boleto.' },
    };
  }
}
