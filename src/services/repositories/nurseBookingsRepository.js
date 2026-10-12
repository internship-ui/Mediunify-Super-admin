import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('nurse_bookings', () => mockDataProvider.getNurseBookings());

export const nurseBookingsRepository = {
  ...baseRepo,
  async assignNurse(id, nurseName, nursePhone, nurseRegistrationNo) {
    return baseRepo.update(id, {
      assignedNurseName: nurseName,
      nursePhone,
      nurseRegistrationNo,
      status: 'Assigned',
    });
  },
  async completeService(id, clinicalNotes) {
    return baseRepo.update(id, {
      status: 'Completed',
      clinicalNotes,
    });
  },
};
