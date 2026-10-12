import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('appointments', () => mockDataProvider.getAppointments());

export const appointmentsRepository = {
  ...baseRepo,
  async getByConsultationType(type) {
    const list = mockDataProvider.getAppointments();
    return list.filter((a) => a.consultationType === type);
  },
  async updateStatus(id, status) {
    return baseRepo.update(id, { status });
  },
};
