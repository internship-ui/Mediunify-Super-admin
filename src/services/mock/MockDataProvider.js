import { INITIAL_USERS } from '@/data/mock/users';
import { INITIAL_FAMILY_MEMBERS } from '@/data/mock/familyMembers';
import { INITIAL_DOCTORS } from '@/data/mock/doctors';
import { INITIAL_APPOINTMENTS } from '@/data/mock/appointments';
import { INITIAL_ORDERS } from '@/data/mock/orders';
import { INITIAL_LAB_BOOKINGS } from '@/data/mock/labBookings';
import { INITIAL_RADIOLOGY_BOOKINGS } from '@/data/mock/radiologyBookings';
import { INITIAL_NURSE_BOOKINGS } from '@/data/mock/nurseBookings';
import { INITIAL_EQUIPMENT_RENTALS } from '@/data/mock/equipmentRentals';
import { INITIAL_SURGERIES } from '@/data/mock/surgeries';
import { INITIAL_FERTILITY_JOURNEYS } from '@/data/mock/fertilityJourneys';
import { INITIAL_AMBULANCE_DISPATCHES } from '@/data/mock/ambulanceDispatches';
import { INITIAL_WALLET_TRANSACTIONS } from '@/data/mock/walletTransactions';
import { INITIAL_MEMBERSHIPS } from '@/data/mock/memberships';
import { INITIAL_PROVIDERS } from '@/data/mock/providers';
import { INITIAL_CITY_HUBS } from '@/data/mock/cityOperations';
import { INITIAL_ADMIN_USERS } from '@/data/mock/adminUsers';
import { INITIAL_AUDIT_LOGS } from '@/data/mock/auditLogs';
import { INITIAL_DOCTOR_PAYMENTS } from '@/data/mock/doctorPayments';
import { INITIAL_CITY_CONFIGURATIONS } from '@/data/mock/cityServices';
import {
  INITIAL_DOCTOR_REGISTRATION_REQUESTS,
  INITIAL_CENTRE_REGISTRATION_REQUESTS,
} from '@/data/mock/registrationRequests';
import {
  INITIAL_PHARMACY_DELIVERY_STAFF,
  INITIAL_PHARMACY_DELIVERY_REQUESTS,
  INITIAL_DELIVERY_EARNINGS,
  INITIAL_DELIVERY_LINE_ITEMS,
  INITIAL_DELIVERY_PAYOUTS,
} from '@/data/mock/deliveryStaff';
import {
  INITIAL_LAB_COLLECTORS,
  INITIAL_LAB_COLLECTOR_REQUESTS,
} from '@/data/mock/labCollectors';
import {
  INITIAL_NURSING_PROVIDERS,
  INITIAL_NURSING_REQUESTS,
} from '@/data/mock/nursingProviders';
import {
  INITIAL_EQUIPMENT_PROVIDERS,
  INITIAL_EQUIPMENT_REQUESTS,
} from '@/data/mock/equipmentProviders';

class MockDataProvider {
  constructor() {
    this.storagePrefix = 'mediunify_admin_';
    this.isBrowser = typeof window !== 'undefined';
  }

  getCollection(key, initialData) {
    if (!this.isBrowser) {
      return [...initialData];
    }
    try {
      const stored = localStorage.getItem(this.storagePrefix + key);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(initialData));
      return [...initialData];
    } catch (e) {
      return [...initialData];
    }
  }

  setCollection(key, data) {
    if (this.isBrowser) {
      try {
        localStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
      } catch (e) {
        console.warn(`Failed to persist collection ${key}`, e);
      }
    }
  }

  resetAll() {
    if (this.isBrowser) {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(this.storagePrefix)) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error('Reset failed', e);
      }
    }
  }

  // Pre-configured getters for all collections
  getUsers() { return this.getCollection('users', INITIAL_USERS); }
  getFamilyMembers() { return this.getCollection('family_members', INITIAL_FAMILY_MEMBERS); }
  getDoctors() { return this.getCollection('doctors', INITIAL_DOCTORS); }
  getAppointments() { return this.getCollection('appointments', INITIAL_APPOINTMENTS); }
  getOrders() { return this.getCollection('orders', INITIAL_ORDERS); }
  getLabBookings() { return this.getCollection('lab_bookings', INITIAL_LAB_BOOKINGS); }
  getRadiologyBookings() { return this.getCollection('radiology_bookings', INITIAL_RADIOLOGY_BOOKINGS); }
  getNurseBookings() { return this.getCollection('nurse_bookings', INITIAL_NURSE_BOOKINGS); }
  getEquipmentRentals() { return this.getCollection('equipment_rentals', INITIAL_EQUIPMENT_RENTALS); }
  getSurgeries() { return this.getCollection('surgeries', INITIAL_SURGERIES); }
  getFertilityJourneys() { return this.getCollection('fertility_journeys', INITIAL_FERTILITY_JOURNEYS); }
  getAmbulanceDispatches() { return this.getCollection('ambulance_dispatches', INITIAL_AMBULANCE_DISPATCHES); }
  getWalletTransactions() { return this.getCollection('wallet_transactions', INITIAL_WALLET_TRANSACTIONS); }
  getMemberships() { return this.getCollection('memberships', INITIAL_MEMBERSHIPS); }
  getProviders() { return this.getCollection('providers', INITIAL_PROVIDERS); }
  getCityHubs() { return this.getCollection('city_hubs', INITIAL_CITY_HUBS); }
  getAdminUsers() { return this.getCollection('admin_users', INITIAL_ADMIN_USERS); }
  getAuditLogs() { return this.getCollection('audit_logs', INITIAL_AUDIT_LOGS); }
  getDoctorPayments() { return this.getCollection('doctor_payments', INITIAL_DOCTOR_PAYMENTS); }
  getCityConfigurations() { return this.getCollection('city_configurations', INITIAL_CITY_CONFIGURATIONS); }
  getDoctorRegistrationRequests() { return this.getCollection('doctor_registration_requests', INITIAL_DOCTOR_REGISTRATION_REQUESTS); }
  getCentreRegistrationRequests() { return this.getCollection('centre_registration_requests', INITIAL_CENTRE_REGISTRATION_REQUESTS); }

  // New modules
  getPharmacyDeliveryStaff() { return this.getCollection('pharmacy_delivery_staff', INITIAL_PHARMACY_DELIVERY_STAFF); }
  getPharmacyDeliveryRequests() { return this.getCollection('pharmacy_delivery_requests', INITIAL_PHARMACY_DELIVERY_REQUESTS); }
  getDeliveryEarnings() { return this.getCollection('delivery_earnings', INITIAL_DELIVERY_EARNINGS); }
  getDeliveryLineItems() { return this.getCollection('delivery_line_items', INITIAL_DELIVERY_LINE_ITEMS); }
  getDeliveryPayouts() { return this.getCollection('delivery_payouts', INITIAL_DELIVERY_PAYOUTS); }

  getLabCollectors() { return this.getCollection('lab_collectors', INITIAL_LAB_COLLECTORS); }
  getLabCollectorRequests() { return this.getCollection('lab_collector_requests', INITIAL_LAB_COLLECTOR_REQUESTS); }

  getNursingProviders() { return this.getCollection('nursing_providers', INITIAL_NURSING_PROVIDERS); }
  getNursingRequests() { return this.getCollection('nursing_requests', INITIAL_NURSING_REQUESTS); }

  getEquipmentProviders() { return this.getCollection('equipment_providers', INITIAL_EQUIPMENT_PROVIDERS); }
  getEquipmentRequests() { return this.getCollection('equipment_requests', INITIAL_EQUIPMENT_REQUESTS); }
}

export const mockDataProvider = new MockDataProvider();
