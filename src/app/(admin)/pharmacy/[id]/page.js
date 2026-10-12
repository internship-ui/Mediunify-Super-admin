import { INITIAL_ORDERS } from '@/data/mock/orders';
import OrderDetailView from './OrderDetailView';

export function generateStaticParams() {
  return INITIAL_ORDERS.map((order) => ({
    id: order.id,
  }));
}

export default function OrderDetailPage({ params }) {
  return <OrderDetailView orderId={params?.id} />;
}
