import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('family_members', () => mockDataProvider.getFamilyMembers());

export const familyMembersRepository = {
  ...baseRepo,
  async getByPatientId(patientId) {
    const list = mockDataProvider.getFamilyMembers();
    return list.filter((f) => f.patientId === patientId);
  },
};
