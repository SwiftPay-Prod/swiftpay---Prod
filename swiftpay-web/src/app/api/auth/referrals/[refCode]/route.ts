import { NextRequest, NextResponse } from 'next/server';
import { getReferralOwner } from '@/app/actions/auth';

interface Context {
  params: Promise<{ refCode: string }>;
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { refCode } = await context.params;

    if (!refCode?.trim()) {
      return NextResponse.json({ error: { message: 'Código de indicação inválido' } }, { status: 400 });
    }

    const result = await getReferralOwner(refCode.trim());

    if (result?.error || !result?.data) {
      return NextResponse.json({ error: result?.error ?? { message: 'Código de indicação inválido' } }, { status: 404 });
    }

    return NextResponse.json({ data: result.data });
  } catch {
    return NextResponse.json({ error: { message: 'Erro interno do servidor' } }, { status: 500 });
  }
}
