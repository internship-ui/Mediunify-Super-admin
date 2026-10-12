import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('city_hubs', () => mockDataProvider.getCityHubs());

export const cityOperationsRepository = {
  ...baseRepo,
};
