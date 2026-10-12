import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('surgeries', () => mockDataProvider.getSurgeries());

export const surgeriesRepository = {
  ...baseRepo,

  async updateStatus(id, newStatus) {
    return baseRepo.update(id, { status: newStatus });
  },

  async getByUHID(uhid) {
    const all = await baseRepo.getAll();
    return all.data.filter((item) => item.uhid?.toLowerCase() === uhid?.toLowerCase());
  },
};
