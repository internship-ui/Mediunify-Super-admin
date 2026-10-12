import { INITIAL_USERS } from '@/data/mock/users';
import PatientDetailView from './PatientDetailView';

export function generateStaticParams() {
  return INITIAL_USERS.map((user) => ({
    id: user.id,
  }));
}

export default function PatientDetailPage({ params }) {
  return <PatientDetailView patientId={params?.id} />;
}
