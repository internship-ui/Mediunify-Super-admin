import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('lab_bookings', () => mockDataProvider.getLabBookings());

export const labBookingsRepository = {
  ...baseRepo,
  async assignPhlebotomist(id, phlebotomistName, phlebotomistPhone) {
    return baseRepo.update(id, {
      phlebotomistName,
      phlebotomistPhone,
      status: 'Sample Collected',
    });
  },
  async uploadReport(id, reportUrl) {
    return baseRepo.update(id, {
      reportUrl,
      status: 'Report Ready',
    });
  },
};
