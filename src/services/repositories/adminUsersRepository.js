import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('admin_users', () => mockDataProvider.getAdminUsers());

export const adminUsersRepository = {
  ...baseRepo,
};
