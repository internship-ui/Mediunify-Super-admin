import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('radiology_bookings', () => mockDataProvider.getRadiologyBookings());

export const radiologyBookingsRepository = {
  ...baseRepo,
  async updateScanStatus(id, status, radiologistName) {
    const updates = { status };
    if (radiologistName) updates.radiologistName = radiologistName;
    return baseRepo.update(id, updates);
  },
};
