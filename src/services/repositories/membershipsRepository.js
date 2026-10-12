import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('memberships', () => mockDataProvider.getMemberships());

export const membershipsRepository = {
  ...baseRepo,
};
