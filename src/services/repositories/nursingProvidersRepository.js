import { mockDataProvider } from '@/services/mock/MockDataProvider';

class NursingProvidersRepository {
  // =====================
  // REGISTERED NURSING PROVIDERS
  // =====================
  async getAll() {
    const list = mockDataProvider.getNursingProviders();
    return { data: list, total: list.length };
  }

  async getById(id) {
    const list = mockDataProvider.getNursingProviders();
    return list.find((p) => p.id === id || p.providerId === id) || null;
  }

  async create(data) {
    const list = mockDataProvider.getNursingProviders();
    const newId = `nur-prv-${Date.now()}`;
    const autoProviderId = `NUR-REG-${200 + list.length + 1}`;
    const newProvider = {
      id: newId,
      providerId: data.providerId || autoProviderId,
      fullName: data.fullName,
      badgeTitle: data.badgeTitle || `${data.qualification || 'B.Sc Nursing'} (Registered Staff Nurse)`,
      mobileNumber: data.mobileNumber,
      email: data.email || '',
      residentialAddress: data.residentialAddress,
      city: data.city,
      serviceArea: data.serviceArea,
      qualification: data.qualification || 'B.Sc Nursing (RGUHS)',
      kncRegistrationNo: data.kncRegistrationNo || 'KNC-Pending',
      experienceYears: data.experienceYears ? parseFloat(data.experienceYears) : 3,
      specializations: Array.isArray(data.specializations)
        ? data.specializations
        : data.specializations
        ? data.specializations.split(',').map((s) => s.trim())
        : ['Wound Care', 'Post-Op Nursing', 'Vitals Monitoring'],
      availability: data.availability || 'Full-Time (Day Shifts)',
      serviceTypes: Array.isArray(data.serviceTypes)
        ? data.serviceTypes
        : data.serviceTypes
        ? data.serviceTypes.split(',').map((s) => s.trim())
        : ['Procedure Visits', 'Wound Dressing'],
      idProofType: data.idProofType || 'Aadhaar Card',
      idProofNumber: data.idProofNumber || '',
      profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1594824813512-2c6c06a86c67?auto=format&fit=crop&q=80&w=250',
      registrationDate: data.registrationDate || new Date().toISOString().slice(0, 10),
      status: data.status || 'Active',
      registrationSource: 'Admin Added',
      activeAssignmentsCount: 0,
      completedVisitsCount: 0,
      rating: 5.0,
    };

    list.unshift(newProvider);
    mockDataProvider.setCollection('nursing_providers', list);
    return newProvider;
  }

  async update(id, data) {
    const list = mockDataProvider.getNursingProviders();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Nursing provider ${id} not found`);

    list[index] = { ...list[index], ...data };
    mockDataProvider.setCollection('nursing_providers', list);
    return list[index];
  }

  async activate(id) {
    return this.update(id, { status: 'Active' });
  }

  async deactivate(id) {
    return this.update(id, { status: 'Inactive' });
  }

  async delete(id) {
    const list = mockDataProvider.getNursingProviders();
    const provider = list.find((p) => p.id === id);
    if (!provider) throw new Error(`Nursing provider ${id} not found`);

    const updated = list.filter((p) => p.id !== id);
    mockDataProvider.setCollection('nursing_providers', updated);
    return { success: true, deletedProvider: provider };
  }

  // =====================
  // SELF-REGISTRATION REQUESTS
  // =====================
  async getRequests() {
    const requests = mockDataProvider.getNursingRequests();
    return { data: requests, total: requests.length };
  }

  async getRequestById(id) {
    const requests = mockDataProvider.getNursingRequests();
    return requests.find((r) => r.id === id || r.applicationId === id) || null;
  }

  async approveRequest(id, reviewer = 'Namith Gowda (Super Admin)') {
    const requests = mockDataProvider.getNursingRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);
    if (req.status === 'Approved') throw new Error(`Request ${req.applicationId} is already approved.`);

    // 1. Update request status
    req.status = 'Approved';
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();
    mockDataProvider.setCollection('nursing_requests', requests);

    // 2. Prevent duplicate creation in nursing provider directory
    const providers = mockDataProvider.getNursingProviders();
    const alreadyExists = providers.find(
      (p) => p.kncRegistrationNo === req.kncRegistrationNo || p.mobileNumber === req.mobileNumber
    );

    let activeRecord = alreadyExists;
    if (!alreadyExists) {
      const autoProviderId = `NUR-REG-${200 + providers.length + 1}`;
      activeRecord = {
        id: `nur-prv-auto-${Date.now()}`,
        providerId: autoProviderId,
        fullName: req.fullName,
        badgeTitle: `${req.qualification} (KNC Verified)`,
        mobileNumber: req.mobileNumber,
        email: req.email || '',
        residentialAddress: req.residentialAddress,
        city: req.city,
        serviceArea: req.serviceArea,
        qualification: req.qualification,
        kncRegistrationNo: req.kncRegistrationNo,
        experienceYears: req.experienceYears || 3,
        specializations: req.specializations || ['General Clinical Care'],
        availability: req.availability || 'Full-Time',
        serviceTypes: req.serviceTypes || ['Procedure Visits'],
        idProofType: req.idProofType,
        idProofNumber: req.idProofNumber,
        profilePhoto: req.profilePhoto,
        registrationDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
        registrationSource: 'Self Registered',
        activeAssignmentsCount: 0,
        completedVisitsCount: 0,
        rating: 5.0,
        linkedApplicationId: req.applicationId,
      };
      providers.unshift(activeRecord);
      mockDataProvider.setCollection('nursing_providers', providers);
    } else {
      activeRecord.status = 'Active';
      mockDataProvider.setCollection('nursing_providers', providers);
    }

    return { request: req, provider: activeRecord };
  }

  async rejectRequest(id, rejectionReason, reviewer = 'Namith Gowda (Super Admin)') {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed rejection reason is mandatory for clinical audit trail.');
    }
    const requests = mockDataProvider.getNursingRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Rejected';
    req.rejectionReason = rejectionReason.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('nursing_requests', requests);
    return req;
  }

  async requestAdditionalInfo(id, remarks, reviewer = 'Namith Gowda (Super Admin)') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Please specify what nursing council documents or credentials are required.');
    }
    const requests = mockDataProvider.getNursingRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Additional Information Required';
    req.adminRemarks = remarks.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('nursing_requests', requests);
    return req;
  }

  async deleteRequest(id) {
    const requests = mockDataProvider.getNursingRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    const updated = requests.filter((r) => r.id !== id);
    mockDataProvider.setCollection('nursing_requests', updated);
    return { success: true, deletedRequest: req };
  }

  async getDashboardCounts() {
    const list = mockDataProvider.getNursingProviders();
    const requests = mockDataProvider.getNursingRequests();
    return {
      activeProviders: list.filter((p) => p.status === 'Active').length,
      totalProviders: list.length,
      pendingRequests: requests.filter((r) => r.status === 'Pending Review').length,
    };
  }
}

export const nursingProvidersRepository = new NursingProvidersRepository();
