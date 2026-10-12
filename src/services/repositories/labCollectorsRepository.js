import { mockDataProvider } from '@/services/mock/MockDataProvider';

class LabCollectorsRepository {
  // =====================
  // ACTIVE LAB TEST COLLECTORS
  // =====================
  async getAll() {
    const list = mockDataProvider.getLabCollectors();
    return { data: list, total: list.length };
  }

  async getById(id) {
    const list = mockDataProvider.getLabCollectors();
    return list.find((c) => c.id === id || c.collectorId === id) || null;
  }

  async create(data) {
    const list = mockDataProvider.getLabCollectors();
    const newId = `ltc-${Date.now()}`;
    const autoCollectorId = `LTC-${100 + list.length + 1}`;
    const newCollector = {
      id: newId,
      collectorId: data.collectorId || autoCollectorId,
      fullName: data.fullName,
      badgeTitle: data.badgeTitle || 'Field Phlebotomist',
      mobileNumber: data.mobileNumber,
      email: data.email || '',
      residentialAddress: data.residentialAddress,
      city: data.city,
      collectionServiceArea: data.collectionServiceArea,
      idProofType: data.idProofType || 'Aadhaar Card',
      idProofNumber: data.idProofNumber || '',
      qualification: data.qualification || 'DMLT',
      experienceYears: data.experienceYears ? parseFloat(data.experienceYears) : 2,
      certifiedPhlebotomist: data.certifiedPhlebotomist !== undefined ? data.certifiedPhlebotomist : true,
      affiliatedCenterName: data.affiliatedCenterName || `MediUnify ${data.city} Diagnostic Hub`,
      profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      registrationDate: data.registrationDate || new Date().toISOString().slice(0, 10),
      status: data.status || 'Active',
      registrationSource: 'Admin Added',
      activeAssignedTasksCount: 0,
      completedCollectionsCount: 0,
      rating: 5.0,
    };

    list.unshift(newCollector);
    mockDataProvider.setCollection('lab_collectors', list);
    return newCollector;
  }

  async update(id, data) {
    const list = mockDataProvider.getLabCollectors();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Lab collector ${id} not found`);

    list[index] = { ...list[index], ...data };
    mockDataProvider.setCollection('lab_collectors', list);
    return list[index];
  }

  async activate(id) {
    return this.update(id, { status: 'Active' });
  }

  async deactivate(id) {
    return this.update(id, { status: 'Inactive' });
  }

  async delete(id) {
    const list = mockDataProvider.getLabCollectors();
    const collector = list.find((c) => c.id === id);
    if (!collector) throw new Error(`Lab collector ${id} not found`);

    const updated = list.filter((c) => c.id !== id);
    mockDataProvider.setCollection('lab_collectors', updated);
    return { success: true, deletedCollector: collector };
  }

  // =====================
  // SELF-REGISTRATION REQUESTS
  // =====================
  async getRequests() {
    const requests = mockDataProvider.getLabCollectorRequests();
    return { data: requests, total: requests.length };
  }

  async getRequestById(id) {
    const requests = mockDataProvider.getLabCollectorRequests();
    return requests.find((r) => r.id === id || r.applicationId === id) || null;
  }

  async approveRequest(id, reviewer = 'Namith Gowda (Super Admin)') {
    const requests = mockDataProvider.getLabCollectorRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);
    if (req.status === 'Approved') throw new Error(`Request ${req.applicationId} is already approved.`);

    // 1. Update request status
    req.status = 'Approved';
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();
    mockDataProvider.setCollection('lab_collector_requests', requests);

    // 2. Prevent duplicate creation in collector directory
    const collectors = mockDataProvider.getLabCollectors();
    const alreadyExists = collectors.find(
      (c) => c.mobileNumber === req.mobileNumber || c.fullName.toLowerCase() === req.fullName.toLowerCase()
    );

    let activeRecord = alreadyExists;
    if (!alreadyExists) {
      const autoCollectorId = `LTC-${100 + collectors.length + 1}`;
      activeRecord = {
        id: `ltc-auto-${Date.now()}`,
        collectorId: autoCollectorId,
        fullName: req.fullName,
        badgeTitle: 'Certified Field Phlebotomist',
        mobileNumber: req.mobileNumber,
        email: req.email || '',
        residentialAddress: req.residentialAddress,
        city: req.city,
        collectionServiceArea: req.collectionServiceArea,
        idProofType: req.idProofType,
        idProofNumber: req.idProofNumber,
        qualification: req.qualification,
        experienceYears: req.experienceYears || 2,
        certifiedPhlebotomist: true,
        affiliatedCenterName: req.affiliatedCenterName || `MediUnify ${req.city} Diagnostic Hub`,
        profilePhoto: req.profilePhoto,
        registrationDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
        registrationSource: 'Self Registered',
        activeAssignedTasksCount: 0,
        completedCollectionsCount: 0,
        rating: 5.0,
        linkedApplicationId: req.applicationId,
      };
      collectors.unshift(activeRecord);
      mockDataProvider.setCollection('lab_collectors', collectors);
    } else {
      activeRecord.status = 'Active';
      mockDataProvider.setCollection('lab_collectors', collectors);
    }

    return { request: req, collector: activeRecord };
  }

  async rejectRequest(id, rejectionReason, reviewer = 'Namith Gowda (Super Admin)') {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed rejection reason is mandatory for compliance archives.');
    }
    const requests = mockDataProvider.getLabCollectorRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Rejected';
    req.rejectionReason = rejectionReason.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('lab_collector_requests', requests);
    return req;
  }

  async requestAdditionalInfo(id, remarks, reviewer = 'Namith Gowda (Super Admin)') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Please specify what additional phlebotomy documents or credentials are required.');
    }
    const requests = mockDataProvider.getLabCollectorRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Additional Information Required';
    req.adminRemarks = remarks.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('lab_collector_requests', requests);
    return req;
  }

  async deleteRequest(id) {
    const requests = mockDataProvider.getLabCollectorRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    const updated = requests.filter((r) => r.id !== id);
    mockDataProvider.setCollection('lab_collector_requests', updated);
    return { success: true, deletedRequest: req };
  }

  async getDashboardCounts() {
    const list = mockDataProvider.getLabCollectors();
    const requests = mockDataProvider.getLabCollectorRequests();
    return {
      activeCollectors: list.filter((c) => c.status === 'Active').length,
      totalCollectors: list.length,
      pendingRequests: requests.filter((r) => r.status === 'Pending Review').length,
    };
  }
}

export const labCollectorsRepository = new LabCollectorsRepository();
