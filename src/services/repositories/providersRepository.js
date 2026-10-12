import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('providers', () => mockDataProvider.getProviders());

export const providersRepository = {
  ...baseRepo,
  async getByType(type) {
    const list = mockDataProvider.getProviders();
    return list.filter((p) => p.type === type);
  },
};
