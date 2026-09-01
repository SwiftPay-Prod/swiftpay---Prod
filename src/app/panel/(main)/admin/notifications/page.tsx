import { getSessionData } from '@/auth/session';
import { NotificationsBroadcastContent } from './notifications-content';

export default async function AdminNotificationsPage() {
  const session = await getSessionData();

  return <NotificationsBroadcastContent currentUserRole={session?.role} />;
}
