import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('orders', () => mockDataProvider.getOrders());

export const ordersRepository = {
  ...baseRepo,
  async approvePrescription(id, pharmacistNotes = 'Verified by Super Admin Pharmacist') {
    return baseRepo.update(id, {
      status: 'Prescription Approved',
      pharmacistNotes,
    });
  },
  async rejectPrescription(id, reason = 'Illegible prescription or dosage mismatch') {
    return baseRepo.update(id, {
      status: 'Prescription Rejected',
      pharmacistNotes: reason,
    });
  },
  async updateDeliveryStatus(id, status, deliveryPartnerName) {
    const updates = { status };
    if (deliveryPartnerName) updates.deliveryPartnerName = deliveryPartnerName;
    return baseRepo.update(id, updates);
  },
};
