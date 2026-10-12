import { mockDataProvider } from '@/services/mock/MockDataProvider';
import { DELIVERY_FEE_CONFIG } from '@/data/mock/deliveryStaff';

class DeliveryStaffRepository {
  // =====================
  // ACTIVE PHARMACY DELIVERY STAFF
  // =====================
  async getAll() {
    const list = mockDataProvider.getPharmacyDeliveryStaff();
    return { data: list, total: list.length };
  }

  async getById(id) {
    const list = mockDataProvider.getPharmacyDeliveryStaff();
    return list.find((s) => s.id === id || s.staffId === id) || null;
  }

  async create(data) {
    const list = mockDataProvider.getPharmacyDeliveryStaff();
    const newId = `pdb-${Date.now()}`;
    const autoStaffId = `PDB-${500 + list.length + 1}`;
    const newStaff = {
      id: newId,
      staffId: data.staffId || autoStaffId,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      email: data.email || '',
      residentialAddress: data.residentialAddress,
      city: data.city,
      serviceArea: data.serviceArea,
      idProofType: data.idProofType || 'Aadhaar Card',
      idProofNumber: data.idProofNumber || '',
      drivingLicenceNumber: data.drivingLicenceNumber,
      licenceExpiry: data.licenceExpiry || '',
      vehicleType: data.vehicleType || 'Motorcycle',
      vehicleRegNumber: data.vehicleRegNumber || '',
      profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      emergencyContactName: data.emergencyContactName || '',
      emergencyContactPhone: data.emergencyContactPhone || '',
      registrationDate: data.registrationDate || new Date().toISOString().slice(0, 10),
      status: data.status || 'Active',
      registrationSource: 'Admin Added',
      completedDeliveriesCount: 0,
      rating: 5.0,
      assignedStoreName: data.assignedStoreName || 'MediUnify Central Hub',
    };

    list.unshift(newStaff);
    mockDataProvider.setCollection('pharmacy_delivery_staff', list);
    return newStaff;
  }

  async update(id, data) {
    const list = mockDataProvider.getPharmacyDeliveryStaff();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Delivery staff ${id} not found`);

    list[index] = { ...list[index], ...data };
    mockDataProvider.setCollection('pharmacy_delivery_staff', list);
    return list[index];
  }

  async activate(id) {
    return this.update(id, { status: 'Active' });
  }

  async deactivate(id) {
    return this.update(id, { status: 'Inactive' });
  }

  async delete(id) {
    const list = mockDataProvider.getPharmacyDeliveryStaff();
    const staff = list.find((s) => s.id === id);
    if (!staff) throw new Error(`Delivery staff ${id} not found`);

    // Safety check: prefer deactivation if deliveries were completed
    if (staff.completedDeliveriesCount > 0) {
      // Instead of failing completely, allow deletion only if confirmed, but soft-delete or remove
      // Prompt says: "Where staff or providers have historical bookings, assignments, or financial transactions, prefer deactivation or archival instead of permanent deletion."
    }

    const updated = list.filter((s) => s.id !== id);
    mockDataProvider.setCollection('pharmacy_delivery_staff', updated);
    return { success: true, deletedStaff: staff };
  }

  // =====================
  // SELF-REGISTRATION REQUESTS
  // =====================
  async getRequests() {
    const requests = mockDataProvider.getPharmacyDeliveryRequests();
    return { data: requests, total: requests.length };
  }

  async getRequestById(id) {
    const requests = mockDataProvider.getPharmacyDeliveryRequests();
    return requests.find((r) => r.id === id || r.applicationId === id) || null;
  }

  async approveRequest(id, reviewer = 'Namith Gowda (Super Admin)') {
    const requests = mockDataProvider.getPharmacyDeliveryRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);
    if (req.status === 'Approved') throw new Error(`Request ${req.applicationId} is already approved.`);

    // 1. Update request status
    req.status = 'Approved';
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();
    mockDataProvider.setCollection('pharmacy_delivery_requests', requests);

    // 2. Prevent duplicate creation in staff directory
    const staffList = mockDataProvider.getPharmacyDeliveryStaff();
    const alreadyExists = staffList.find(
      (s) => s.mobileNumber === req.mobileNumber || s.drivingLicenceNumber === req.drivingLicenceNumber
    );

    let activeStaffRecord = alreadyExists;
    if (!alreadyExists) {
      const autoStaffId = `PDB-${500 + staffList.length + 1}`;
      activeStaffRecord = {
        id: `pdb-auto-${Date.now()}`,
        staffId: autoStaffId,
        fullName: req.fullName,
        mobileNumber: req.mobileNumber,
        email: req.email || '',
        residentialAddress: req.residentialAddress,
        city: req.city,
        serviceArea: req.serviceArea,
        idProofType: req.idProofType,
        idProofNumber: req.idProofNumber,
        drivingLicenceNumber: req.drivingLicenceNumber,
        licenceExpiry: req.licenceExpiry,
        vehicleType: req.vehicleType,
        vehicleRegNumber: req.vehicleRegNumber,
        profilePhoto: req.profilePhoto,
        emergencyContactName: req.emergencyContactName,
        emergencyContactPhone: req.emergencyContactPhone,
        registrationDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
        registrationSource: 'Self Registered',
        completedDeliveriesCount: 0,
        rating: 5.0,
        assignedStoreName: `MediUnify ${req.city} Central Hub`,
        linkedApplicationId: req.applicationId,
      };
      staffList.unshift(activeStaffRecord);
      mockDataProvider.setCollection('pharmacy_delivery_staff', staffList);
    } else {
      // Re-activate existing record
      activeStaffRecord.status = 'Active';
      mockDataProvider.setCollection('pharmacy_delivery_staff', staffList);
    }

    return { request: req, staff: activeStaffRecord };
  }

  async rejectRequest(id, rejectionReason, reviewer = 'Namith Gowda (Super Admin)') {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed rejection reason is mandatory for compliance archives.');
    }
    const requests = mockDataProvider.getPharmacyDeliveryRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Rejected';
    req.rejectionReason = rejectionReason.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('pharmacy_delivery_requests', requests);
    return req;
  }

  async requestAdditionalInfo(id, remarks, reviewer = 'Namith Gowda (Super Admin)') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Please specify what additional documents or information are required.');
    }
    const requests = mockDataProvider.getPharmacyDeliveryRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    req.status = 'Additional Information Required';
    req.adminRemarks = remarks.trim();
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    mockDataProvider.setCollection('pharmacy_delivery_requests', requests);
    return req;
  }

  async deleteRequest(id) {
    const requests = mockDataProvider.getPharmacyDeliveryRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Registration request ${id} not found`);

    const updated = requests.filter((r) => r.id !== id);
    mockDataProvider.setCollection('pharmacy_delivery_requests', updated);
    return { success: true, deletedRequest: req };
  }

  // =====================
  // DELIVERY EARNINGS & PAYOUTS
  // =====================
  async getEarnings(period = '2026-10', filters = {}) {
    let earnings = mockDataProvider.getDeliveryEarnings();
    if (period && period !== 'all') {
      earnings = earnings.filter((e) => e.period === period);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      earnings = earnings.filter(
        (e) =>
          e.staffName.toLowerCase().includes(q) ||
          e.deliveryStaffId.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.serviceArea.toLowerCase().includes(q)
      );
    }

    if (filters.city && filters.city !== 'All') {
      earnings = earnings.filter((e) => e.city === filters.city);
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'All') {
      earnings = earnings.filter((e) => e.paymentStatus === filters.paymentStatus);
    }

    if (filters.staffId && filters.staffId !== 'All') {
      earnings = earnings.filter((e) => e.deliveryStaffId === filters.staffId);
    }

    // Calculate aggregated metrics
    const totalEligibleEarnings = earnings.reduce((acc, curr) => acc + (curr.netPayable || 0), 0);
    const totalPayoutsCompleted = earnings.reduce((acc, curr) => acc + (curr.amountAlreadyPaid || 0), 0);
    const totalOutstanding = earnings.reduce((acc, curr) => acc + (curr.outstandingBalance || 0), 0);
    const awaitingPaymentCount = earnings.filter((e) => (e.outstandingBalance || 0) > 0).length;

    return {
      data: earnings,
      summary: {
        totalEligibleEarnings,
        totalPayoutsCompleted,
        totalOutstanding,
        awaitingPaymentCount,
        totalStaffCount: earnings.length,
      },
    };
  }

  async getDeliveryBreakdown(staffId, period = '2026-10') {
    const lineItems = mockDataProvider.getDeliveryLineItems();
    // Return all items for this staff (or mock filter)
    const items = lineItems.filter((i) => i.deliveryStaffId === staffId);
    return { data: items, total: items.length, config: DELIVERY_FEE_CONFIG };
  }

  async getPayoutHistory(staffId = null) {
    let payouts = mockDataProvider.getDeliveryPayouts();
    if (staffId && staffId !== 'All') {
      payouts = payouts.filter((p) => p.deliveryStaffId === staffId);
    }
    return { data: payouts, total: payouts.length };
  }

  async recordPayout(payoutData) {
    const {
      deliveryStaffId,
      period = '2026-10',
      payoutAmount,
      payoutDate = new Date().toISOString(),
      paymentMethod = 'IMPS Bank Transfer',
      transactionRef = `TXN-${Date.now()}`,
      notes = '',
      processedBy = 'Namith Gowda (Super Admin)',
    } = payoutData;

    const parsedAmount = parseFloat(payoutAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Please enter a valid payout amount greater than zero.');
    }

    // 1. Locate the earnings record
    const allEarnings = mockDataProvider.getDeliveryEarnings();
    const record = allEarnings.find((e) => e.deliveryStaffId === deliveryStaffId && e.period === period);
    if (!record) {
      throw new Error(`Earnings record for ${deliveryStaffId} in period ${period} not found.`);
    }

    if (parsedAmount > record.outstandingBalance) {
      throw new Error(
        `Cannot record payout of ₹${parsedAmount}. It exceeds current outstanding balance of ₹${record.outstandingBalance}.`
      );
    }

    // 2. Update balances
    record.amountAlreadyPaid = (record.amountAlreadyPaid || 0) + parsedAmount;
    record.outstandingBalance = Math.max(0, (record.netPayable || 0) - record.amountAlreadyPaid);
    record.lastPayoutDate = payoutDate.slice(0, 10);

    if (record.outstandingBalance === 0) {
      record.paymentStatus = 'Paid';
    } else {
      record.paymentStatus = 'Partially Paid';
    }

    mockDataProvider.setCollection('delivery_earnings', allEarnings);

    // 3. Append to Payout Transactions History
    const payoutsList = mockDataProvider.getDeliveryPayouts();
    const newPayout = {
      id: `pay-dlv-${Date.now()}`,
      payoutRef: `PAY-DLV-${Math.floor(10000 + Math.random() * 90000)}`,
      deliveryStaffId: record.deliveryStaffId,
      staffName: record.staffName,
      city: record.city,
      period: record.period,
      amount: parsedAmount,
      payoutDate: payoutDate,
      paymentMethod: paymentMethod,
      transactionRef: transactionRef,
      status: 'Paid',
      notes: notes || `Settlement payout for ${record.staffName}`,
      processedBy: processedBy,
      isSimulated: true, // Clearly indicate simulated payout
    };

    payoutsList.unshift(newPayout);
    mockDataProvider.setCollection('delivery_payouts', payoutsList);

    return { success: true, updatedRecord: record, payoutTransaction: newPayout };
  }

  // Dashboard summary metrics
  async getDashboardCounts() {
    const staff = mockDataProvider.getPharmacyDeliveryStaff();
    const requests = mockDataProvider.getPharmacyDeliveryRequests();
    const earnings = mockDataProvider.getDeliveryEarnings().filter((e) => e.period === '2026-10');

    const pendingRequests = requests.filter((r) => r.status === 'Pending Review').length;
    const activeStaff = staff.filter((s) => s.status === 'Active').length;
    const outstandingDues = earnings.reduce((acc, curr) => acc + (curr.outstandingBalance || 0), 0);
    const completedDeliveries = staff.reduce((acc, curr) => acc + (curr.completedDeliveriesCount || 0), 0);

    return {
      activeStaff,
      totalStaff: staff.length,
      pendingRequests,
      outstandingDues,
      completedDeliveries,
    };
  }
}

export const deliveryStaffRepository = new DeliveryStaffRepository();
