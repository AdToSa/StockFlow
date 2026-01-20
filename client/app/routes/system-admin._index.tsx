import { redirect } from 'react-router';
import type { Route } from './+types/system-admin._index';

// Redirect to dashboard
export function loader({ request }: Route.LoaderArgs) {
  throw redirect('/system-admin/dashboard');
}

export default function SystemAdminIndex() {
  return null;
}