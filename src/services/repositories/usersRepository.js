import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('users', () => mockDataProvider.getUsers());

export const usersRepository = {
  ...baseRepo,
  async getByUhid(uhid) {
    const users = mockDataProvider.getUsers();
    return users.find((u) => u.uhid.toLowerCase() === uhid.toLowerCase()) || null;
  },
  async getFamilyMembers(patientId) {
    const allFamily = mockDataProvider.getFamilyMembers();
    return allFamily.filter((f) => f.patientId === patientId);
  },
};
