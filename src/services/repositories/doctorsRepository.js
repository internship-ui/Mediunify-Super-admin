import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('doctors', () => mockDataProvider.getDoctors());

export const doctorsRepository = {
  ...baseRepo,
  async verifyDoctor(id, status = 'Verified') {
    return baseRepo.update(id, { verificationStatus: status });
  },
};
