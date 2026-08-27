import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { PixEstaticoContent } from './pix-estatico-content';

export default async function PixEstaticoPage() {
  const merchant = await getSelectedMerchant();

  if (!merchant) {
    redirect('/panel/merchant/new');
  }

  return <PixEstaticoContent merchantId={merchant.id} />;
}
