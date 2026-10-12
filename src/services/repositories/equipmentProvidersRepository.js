import { mockDataProvider } from '@/services/mock/MockDataProvider';

class EquipmentProvidersRepository {
  // =====================
  // REGISTERED EQUIPMENT PROVIDERS
  // =====================
  async getAll() {
    const list = mockDataProvider.getEquipmentProviders();
    return { data: list, total: list.length };
  }

  async getById(id) {
    const list = mockDataProvider.getEquipmentProviders();
    return list.find((p) => p.id === id || p.providerId === id) || null;
  }

  async create(data) {
    const list = mockDataProvider.getEquipmentProviders();
    const newId = `eqp-prv-${Date.now()}`;
    const autoProviderId = `EQP-PRV-${400 + list.length + 1}`;
    const newProvider = {
      id: newId,
      providerId: data.providerId || autoProviderId,
      providerName: data.providerName,
      contactPerson: data.contactPerson,
      mobileNumber: data.mobileNumber,
      email: data.email || '',
      fullAddress: data.fullAddress,
      city: data.city,
      serviceArea: data.serviceArea,
      gstin: data.gstin || '',
      tradeLicenceNo: data.tradeLicenceNo || '',
      biomedicalCertification: data.biomedicalCertification || 'ISO Calibration Compliant',
      categoriesOffered: Array.isArray(data.categoriesOffered)
        ? data.categoriesOffered
        : data.categoriesOffered
        ? data.categoriesOffered.split(',').map((c) => c.trim())
        : ['Medical Oxygen', 'ICU Beds'],
      availableEquipmentCount: data.availableEquipmentCount ? parseInt(data.availableEquipmentCount) : 10,
      activeRentalsCount: 0,
      registrationDate: data.registrationDate || new Date().toISOString().slice(0, 10),
      status: data.status || 'Active',
      registrationSource: 'Admin Added',
      rating: 5.0,
    };

    list.unshift(newProvider);
    mockDataProvider.setCollection('equipment_providers', list);
    return newProvider;
  }

  async update(id, data) {
    const list = mockDataProvider.getEquipmentProviders();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Equipment provider ${id} not found`);

    list[index] = { ...list[index], ...data };
    mockDataProvider.setCollection('equipment_providers', list);
    return list[index];
  }

  async activate(id) {
    return this.update(id, { status: 'Active' });
  }

  async deactivate(id) {
    return this.update(id, { status: 'Inactive' });
  }

  async delete(id) {
    const list = mockDataProvider.getEquipmentProviders();
    const provider = list.find((p) => p.id === id);
    if (!provider) throw new Error(`Equipment provider ${id} not found`);

    const updated = list.filter((p) => p.id !== id);
    mockDataProvider.setCollection('equipment_providers', updated);
    return { success: true, deletedProvider: provider };
  }

  // =====================
  // SELF-REGISTRATION REQUESTS
  // =====================
  async getRequests() {
    const requests = mockDataProvider.getEquipmentRequests();
    return { data: requests, total: requests.length };
  }

  async getRequestById(id) {
    const requests = mockDataProvider.getEquipmentRequests();
    return requests.find((r) => r.id === id || r.applicationId === id) || null;
  }

  async approveRequest(id, reviewer = 'Namith Gowda (Super Admin)') {
    const requests = mockDataProvider.getEquipmentRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);
    if (req.status === 'Approved') throw new Error(`Request ${req.applicationId} is already approved.`);

    // 1. Update request status
    req.status = 'Approved';
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();
    mockDataProvider.setCollection('equipment_requests', requests);

    // 2. Prevent duplicate creation in equipment provider directory
    const providers = mockDataProvider.getEquipmentProviders();
    const alreadyExists = providers.find(
      (p) => (req.gstin && p.gstin === req.gstin) || p.providerName.toLowerCase() === req.providerName.toLowerCase()
    );

    let activeRecord = alreadyExists;
    if (!alreadyExists) {
      const autoProviderId = `EQP-PRV-${400 + providers.length + 1}`;
      activeRecord = {
        id: `eqp-prv-auto-${Date.now()}`,
        providerId: autoProviderId,
        providerName: req.providerName,
        contactPerson: req.contactPerson,
        mobileNumber: req.mobileNumber,
        email: req.email || '',
        fullAddress: req.fullAddress,
        city: req.city,
        serviceArea: req.serviceArea,
        gstin: req.gstin || '',
        tradeLicenceNo: req.tradeLicenceNo || '',
        biomedicalCertification: 'Verified Bio-Medical Calibration',
        categoriesOffered: req.categoriesOffered || ['Oxygen Concentrators', 'ICU Beds'],
        availableEquipmentCount: 20,
        activeRentalsCount: 0,
        registrationDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
        registrationSource: 'Self Registered',
        rating: 5.0,
        linkedApplicationId: req.applicationId,
      };
      providers.unshift(activeRecord);
      mockDataProvider.setCollection('equipment_providers', providers);
    } else {
      activeRecord.status = 'Active';
      mockDataProvider.setCollection('equipment_providers', providers);
    }

    return { request: req, provider: activeRecord };
  }

  async rejectRequest(id, rejectionReason, reviewer = 'Namith Gowda (Super Admin)') {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed rejection reason is mandatory for commercial compliance archives.');
    }
    const requests = mockDataProvider.getEquipmentRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Rejected';
    req.rejectionReason = rejectionReason.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('equipment_requests', requests);
    return req;
  }

  async requestAdditionalInfo(id, remarks, reviewer = 'Namith Gowda (Super Admin)') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Please specify what equipment calibration documents or certifications are required.');
    }
    const requests = mockDataProvider.getEquipmentRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Additional Information Required';
    req.adminRemarks = remarks.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('equipment_requests', requests);
    return req;
  }

  async deleteRequest(id) {
    const requests = mockDataProvider.getEquipmentRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    const updated = requests.filter((r) => r.id !== id);
    mockDataProvider.setCollection('equipment_requests', updated);
    return { success: true, deletedRequest: req };
  }

  async getDashboardCounts() {
    const list = mockDataProvider.getEquipmentProviders();
    const requests = mockDataProvider.getEquipmentRequests();
    return {
      activeProviders: list.filter((p) => p.status === 'Active').length,
      totalProviders: list.length,
      pendingRequests: requests.filter((r) => r.status === 'Pending Review').length,
    };
  }
}

export const equipmentProvidersRepository = new EquipmentProvidersRepository();
