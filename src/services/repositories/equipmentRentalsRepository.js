import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('equipment_rentals', () => mockDataProvider.getEquipmentRentals());

export const equipmentRentalsRepository = {
  ...baseRepo,
  async updateRentalStatus(id, status) {
    return baseRepo.update(id, { status });
  },
};
