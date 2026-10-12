import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('fertility_journeys', () => mockDataProvider.getFertilityJourneys());

export const fertilityRepository = {
  ...baseRepo,
  async updateStage(id, currentStage, nextMilestoneDate, notes) {
    const updates = { currentStage };
    if (nextMilestoneDate) updates.nextMilestoneDate = nextMilestoneDate;
    if (notes) updates.notes = notes;
    return baseRepo.update(id, updates);
  },
};
