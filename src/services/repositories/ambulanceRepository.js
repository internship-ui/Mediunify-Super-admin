import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('ambulance_dispatches', () => mockDataProvider.getAmbulanceDispatches());

export const ambulanceRepository = {
  ...baseRepo,
  async getActiveEmergencyCount() {
    const list = mockDataProvider.getAmbulanceDispatches();
    return list.filter((a) => a.status !== 'Handover Complete' && a.status !== 'False Alarm / Cancelled').length;
  },
  async updateDispatchStatus(id, status) {
    const updates = { status };
    if (status === 'Arrived at Hospital') {
      updates.arrivalTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return baseRepo.update(id, updates);
  },
};
