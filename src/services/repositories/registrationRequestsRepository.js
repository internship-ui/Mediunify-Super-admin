import { mockDataProvider } from '../mock/MockDataProvider';
import { doctorsRepository } from './doctorsRepository';
import { providersRepository } from './providersRepository';

const STORAGE_KEYS = {
  DOCTORS: 'mediunify_admin_doctor_registration_requests',
  CENTRES: 'mediunify_admin_centre_registration_requests',
};

function getDoctorList() {
  return mockDataProvider.getDoctorRegistrationRequests();
}

function getCentreList() {
  return mockDataProvider.getCentreRegistrationRequests();
}

function saveDoctorList(list) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(list));
  }
}

function saveCentreList(list) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CENTRES, JSON.stringify(list));
  }
}

export const registrationRequestsRepository = {
  // Check permission helper
  isAuthorized(user) {
    if (!user) return false;
    const role = user.role || '';
    const permissions = user.permissions || [];
    return (
      role === 'Super Admin' ||
      role === 'Clinical Director' ||
      role === 'Operations Manager' ||
      permissions.includes('all') ||
      permissions.includes('doctors:verify') ||
      permissions.includes('registrations:approve')
    );
  },

  async getDoctorRequests() {
    return getDoctorList();
  },

  async getCentreRequests() {
    return getCentreList();
  },

  async getDoctorRequestById(id) {
    const list = getDoctorList();
    return list.find((r) => r.id === id || r.applicationId === id) || null;
  },

  async getCentreRequestById(id) {
    const list = getCentreList();
    return list.find((r) => r.id === id || r.applicationId === id) || null;
  },

  // Approve Doctor Registration
  async approveDoctorRequest(requestId, reviewer = { name: 'Namith Gowda', role: 'Super Admin' }) {
    if (!this.isAuthorized(reviewer)) {
      throw new Error(`Unauthorized: User ${reviewer.name} (${reviewer.role}) does not have permission to approve registrations.`);
    }

    const list = getDoctorList();
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Doctor registration request not found.');

    const request = list[index];

    // Check if doctor already exists in Doctor Management to avoid duplicates
    const existingDoctorsRes = await doctorsRepository.getAll();
    const existingDoctors = existingDoctorsRes.data || [];
    let existing = existingDoctors.find(
      (d) =>
        (d.medicalRegistrationNo && d.medicalRegistrationNo.toLowerCase() === request.medicalRegistrationNo.toLowerCase()) ||
        (d.email && d.email.toLowerCase() === request.email.toLowerCase())
    );

    let doctorRecord = existing;
    if (!doctorRecord) {
      // Create new doctor in Doctor Management
      doctorRecord = await doctorsRepository.create({
        doctorCode: `DOC-${Math.floor(100 + Math.random() * 900)}`,
        name: request.doctorName,
        email: request.email,
        phone: request.phone,
        specialization: request.specialization,
        subSpecialty: request.subSpecialty || request.specialization,
        experienceYears: Number(request.experienceYears) || 5,
        qualifications: request.qualifications,
        medicalRegistrationNo: request.medicalRegistrationNo,
        verificationStatus: 'Verified',
        status: 'Active',
        city: request.city,
        consultationModes: request.consultationModes || ['In-Clinic', 'Video Call'],
        inClinicEnabled: request.consultationModes?.includes('In-Clinic') ?? true,
        inPersonFee: Number(request.proposedInPersonFee) || 800,
        inClinicFee: Number(request.proposedInPersonFee) || 800,
        inClinicTimings: '09:30 AM - 01:30 PM',
        inClinicDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        inClinicRoom: 'Consultation Room 102',
        clinic: {
          name: request.preferredLocation || `${request.doctorName}'s Healthcare Clinic`,
          address: `${request.preferredLocation || 'Main Hub'}, ${request.city}`,
          city: request.city,
          pincode: '570001',
          phone: request.phone,
        },
        videoCallEnabled: request.consultationModes?.includes('Video Call') ?? true,
        videoFee: Number(request.proposedVideoFee) || 600,
        videoCallTimings: '05:30 PM - 08:30 PM',
        videoCallDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        videoPlatform: 'MediUnify WebRTC 1080p HD',
        rating: 5.0,
        reviewsCount: 0,
        consultationsCount: 0,
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250',
        bio: `${request.qualifications}. ${request.specialization} specialist with ${request.experienceYears} years of clinical practice.`,
        joinedDate: new Date().toISOString().slice(0, 10),
      });
    } else {
      // Activate existing if suspended or inactive
      await doctorsRepository.update(doctorRecord.id, {
        status: 'Active',
        verificationStatus: 'Verified',
      });
    }

    const updatedRequest = {
      ...request,
      status: 'Approved',
      approvedDoctorId: doctorRecord.id,
      rejectionReason: null,
      additionalInfoRemarks: null,
      reviewHistory: [
        {
          reviewer: reviewer.name,
          role: reviewer.role,
          action: 'Approved & Empaneled',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          notes: `Doctor credentials verified against ${request.registrationAuthority || 'State Medical Council'}. Activated in Doctor Directory (${doctorRecord.doctorCode}).`,
        },
        ...(request.reviewHistory || []),
      ],
    };

    list[index] = updatedRequest;
    saveDoctorList(list);
    return { request: updatedRequest, doctor: doctorRecord };
  },

  // Reject Doctor Registration
  async rejectDoctorRequest(requestId, rejectionReason, reviewer = { name: 'Namith Gowda', role: 'Super Admin' }) {
    if (!this.isAuthorized(reviewer)) {
      throw new Error(`Unauthorized: User ${reviewer.name} (${reviewer.role}) does not have permission to reject registrations.`);
    }
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed rejection reason is required.');
    }

    const list = getDoctorList();
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Doctor registration request not found.');

    const request = list[index];
    const updatedRequest = {
      ...request,
      status: 'Rejected',
      rejectionReason: rejectionReason.trim(),
      reviewHistory: [
        {
          reviewer: reviewer.name,
          role: reviewer.role,
          action: 'Application Rejected',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          notes: rejectionReason.trim(),
        },
        ...(request.reviewHistory || []),
      ],
    };

    list[index] = updatedRequest;
    saveDoctorList(list);
    return updatedRequest;
  },

  // Request Doctor Additional Information
  async requestDoctorAdditionalInfo(requestId, remarks, reviewer = { name: 'Namith Gowda', role: 'Super Admin' }) {
    if (!this.isAuthorized(reviewer)) {
      throw new Error(`Unauthorized: User ${reviewer.name} (${reviewer.role}) cannot request information.`);
    }
    if (!remarks || !remarks.trim()) {
      throw new Error('Please enter the queries or information required from the applicant.');
    }

    const list = getDoctorList();
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Doctor registration request not found.');

    const request = list[index];
    const updatedRequest = {
      ...request,
      status: 'Additional Information Required',
      additionalInfoRemarks: remarks.trim(),
      reviewHistory: [
        {
          reviewer: reviewer.name,
          role: reviewer.role,
          action: 'Additional Information Requested',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          notes: remarks.trim(),
        },
        ...(request.reviewHistory || []),
      ],
    };

    list[index] = updatedRequest;
    saveDoctorList(list);
    return updatedRequest;
  },

  // Approve Healthcare Centre Registration
  async approveCentreRequest(requestId, reviewer = { name: 'Namith Gowda', role: 'Super Admin' }) {
    if (!this.isAuthorized(reviewer)) {
      throw new Error(`Unauthorized: User ${reviewer.name} (${reviewer.role}) does not have permission to approve healthcare centres.`);
    }

    const list = getCentreList();
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Healthcare centre registration request not found.');

    const request = list[index];

    // Check if provider already exists in Providers to avoid duplicates
    const existingProvidersRes = await providersRepository.getAll();
    const existingProviders = existingProvidersRes.data || [];
    let existing = existingProviders.find(
      (p) =>
        (p.name && p.name.toLowerCase() === request.centreName.toLowerCase()) ||
        (p.licenseNumber && p.licenseNumber === request.licenseNumber)
    );

    let providerRecord = existing;
    if (!providerRecord) {
      providerRecord = await providersRepository.create({
        providerCode: `PRV-${Math.floor(100 + Math.random() * 900)}`,
        name: request.centreName,
        type: request.category || 'Hospital',
        category: request.centreType || 'Tertiary Care Super-Speciality Hospital',
        address: request.address,
        city: request.city,
        contactPerson: request.contactPerson,
        phone: request.phone,
        email: request.email,
        licenseNumber: request.licenseNumber,
        accreditations: request.accreditations,
        bedsCapacity: Number(request.bedsCapacity) || 0,
        commissionRate: request.commissionRate || '12%',
        status: 'Active',
        rating: 4.9,
        servicesProvided: request.requestedServices || ['Consultation', 'Diagnostics', 'Emergency Care'],
      });
    } else {
      await providersRepository.update(providerRecord.id, {
        status: 'Active',
      });
    }

    const updatedRequest = {
      ...request,
      status: 'Approved',
      approvedProviderId: providerRecord.id,
      rejectionReason: null,
      additionalInfoRemarks: null,
      reviewHistory: [
        {
          reviewer: reviewer.name,
          role: reviewer.role,
          action: 'Approved & Empaneled',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          notes: `Centre verified with license ${request.licenseNumber}. Activated in Hospital & Partners network (${providerRecord.providerCode}). Services remain subject to City-Wise Availability configurations.`,
        },
        ...(request.reviewHistory || []),
      ],
    };

    list[index] = updatedRequest;
    saveCentreList(list);
    return { request: updatedRequest, provider: providerRecord };
  },

  // Reject Healthcare Centre Registration
  async rejectCentreRequest(requestId, rejectionReason, reviewer = { name: 'Namith Gowda', role: 'Super Admin' }) {
    if (!this.isAuthorized(reviewer)) {
      throw new Error(`Unauthorized: User ${reviewer.name} (${reviewer.role}) does not have permission to reject healthcare centres.`);
    }
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed rejection reason is required.');
    }

    const list = getCentreList();
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Healthcare centre registration request not found.');

    const request = list[index];
    const updatedRequest = {
      ...request,
      status: 'Rejected',
      rejectionReason: rejectionReason.trim(),
      reviewHistory: [
        {
          reviewer: reviewer.name,
          role: reviewer.role,
          action: 'Application Rejected',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          notes: rejectionReason.trim(),
        },
        ...(request.reviewHistory || []),
      ],
    };

    list[index] = updatedRequest;
    saveCentreList(list);
    return updatedRequest;
  },

  // Request Healthcare Centre Additional Information
  async requestCentreAdditionalInfo(requestId, remarks, reviewer = { name: 'Namith Gowda', role: 'Super Admin' }) {
    if (!this.isAuthorized(reviewer)) {
      throw new Error(`Unauthorized: User ${reviewer.name} (${reviewer.role}) cannot request information.`);
    }
    if (!remarks || !remarks.trim()) {
      throw new Error('Please enter the queries or documentation required from the centre.');
    }

    const list = getCentreList();
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Healthcare centre registration request not found.');

    const request = list[index];
    const updatedRequest = {
      ...request,
      status: 'Additional Information Required',
      additionalInfoRemarks: remarks.trim(),
      reviewHistory: [
        {
          reviewer: reviewer.name,
          role: reviewer.role,
          action: 'Additional Information Requested',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          notes: remarks.trim(),
        },
        ...(request.reviewHistory || []),
      ],
    };

    list[index] = updatedRequest;
    saveCentreList(list);
    return updatedRequest;
  },

  // Dashboard KPI metrics
  async getDashboardCounts() {
    const doctors = getDoctorList();
    const centres = getCentreList();

    const pendingDoctors = doctors.filter((r) => r.status === 'Pending Review' || r.status === 'Additional Information Required').length;
    const pendingCentres = centres.filter((r) => r.status === 'Pending Review' || r.status === 'Additional Information Required').length;

    const approvedDoctors = doctors.filter((r) => r.status === 'Approved').length;
    const approvedCentres = centres.filter((r) => r.status === 'Approved').length;

    const rejectedDoctors = doctors.filter((r) => r.status === 'Rejected').length;
    const rejectedCentres = centres.filter((r) => r.status === 'Rejected').length;

    return {
      pendingDoctors,
      pendingCentres,
      totalPending: pendingDoctors + pendingCentres,
      approvedThisMonth: approvedDoctors + approvedCentres,
      rejectedThisMonth: rejectedDoctors + rejectedCentres,
    };
  },
};
