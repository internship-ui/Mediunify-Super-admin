import { sleep } from '@/lib/utils';
import { mockDataProvider } from '../mock/MockDataProvider';
import { MEDIUNIFY_SERVICES } from '@/data/mock/cityServices';

class CityServicesRepository {
  /**
   * Get all configured cities with service availability counts
   */
  async getCities() {
    await sleep(60);
    const cityConfigs = mockDataProvider.getCityConfigurations();

    return cityConfigs.map((city) => {
      const services = city.serviceSettings || {};
      const serviceKeys = Object.keys(services);

      let availableCount = 0;
      let disabledCount = 0;

      MEDIUNIFY_SERVICES.forEach((srv) => {
        const setting = services[srv.id];
        if (setting && setting.isVisible !== false) {
          availableCount++;
        } else {
          disabledCount++;
        }
      });

      return {
        ...city,
        totalServices: MEDIUNIFY_SERVICES.length,
        availableServicesCount: availableCount,
        disabledServicesCount: disabledCount,
      };
    });
  }

  /**
   * Get all services with current visibility and status for a specific city
   * @param {string} cityName
   */
  async getCityServices(cityName) {
    await sleep(50);
    const cityConfigs = mockDataProvider.getCityConfigurations();
    const city = cityConfigs.find(
      (c) => c.cityName.toLowerCase() === cityName.toLowerCase()
    );

    if (!city) {
      // Return default enabled settings if city not yet configured
      return MEDIUNIFY_SERVICES.map((s) => ({
        ...s,
        isVisible: true,
        status: 'Available',
        remarks: 'Default configuration',
      }));
    }

    const citySettings = city.serviceSettings || {};

    return MEDIUNIFY_SERVICES.map((s) => {
      const setting = citySettings[s.id];
      return {
        ...s,
        isVisible: setting ? setting.isVisible !== false : true,
        status: setting ? setting.status : 'Available',
        remarks: setting ? setting.remarks : '',
        lastUpdated: setting?.lastUpdated || null,
        updatedBy: setting?.updatedBy || 'Super Admin',
      };
    });
  }

  /**
   * Update visibility, availability status, or remarks for a specific service in a city
   */
  async updateCityServiceVisibility({
    cityName,
    serviceId,
    isVisible,
    status = 'Available',
    remarks = '',
    updatedBy = 'Super Admin (Dr. Arjun)',
  }) {
    await sleep(100);
    const cityConfigs = mockDataProvider.getCityConfigurations();
    const cityIndex = cityConfigs.findIndex(
      (c) => c.cityName.toLowerCase() === cityName.toLowerCase()
    );

    if (cityIndex === -1) {
      throw new Error(`City "${cityName}" not found.`);
    }

    const city = { ...cityConfigs[cityIndex] };
    const currentSettings = { ...(city.serviceSettings || {}) };

    currentSettings[serviceId] = {
      isVisible: Boolean(isVisible),
      status: isVisible ? (status === 'Disabled' ? 'Available' : status) : 'Disabled',
      remarks: remarks || (isVisible ? 'Service active' : 'Temporarily suspended in this hub'),
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };

    city.serviceSettings = currentSettings;
    cityConfigs[cityIndex] = city;
    mockDataProvider.setCollection('city_configurations', cityConfigs);

    // Record audit trail
    try {
      const auditLogs = mockDataProvider.getAuditLogs();
      const serviceName = MEDIUNIFY_SERVICES.find((s) => s.id === serviceId)?.name || serviceId;
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: updatedBy,
        userRole: 'Super Admin',
        action: 'UPDATE_SERVICE_AVAILABILITY',
        module: 'City Operations & Visibility',
        details: `Toggled "${serviceName}" in ${cityName} to ${isVisible ? 'VISIBLE' : 'HIDDEN'} (${status}). Notes: ${remarks || 'None'}`,
        ipAddress: '10.0.1.42',
      };
      mockDataProvider.setCollection('audit_logs', [newLog, ...auditLogs]);
    } catch (e) {
      console.warn('Failed to record audit log', e);
    }

    return city;
  }

  /**
   * Batch update all service settings for a city
   */
  async saveCityAllServices(cityName, updatedSettings, updatedBy = 'Super Admin (Dr. Arjun)') {
    await sleep(120);
    const cityConfigs = mockDataProvider.getCityConfigurations();
    const cityIndex = cityConfigs.findIndex(
      (c) => c.cityName.toLowerCase() === cityName.toLowerCase()
    );

    if (cityIndex === -1) {
      throw new Error(`City "${cityName}" not found.`);
    }

    const city = { ...cityConfigs[cityIndex] };
    city.serviceSettings = { ...updatedSettings };
    cityConfigs[cityIndex] = city;
    mockDataProvider.setCollection('city_configurations', cityConfigs);

    // Audit log
    try {
      const auditLogs = mockDataProvider.getAuditLogs();
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: updatedBy,
        userRole: 'Super Admin',
        action: 'BULK_UPDATE_CITY_SERVICES',
        module: 'City Operations & Visibility',
        details: `Saved comprehensive service availability matrix for ${cityName}`,
        ipAddress: '10.0.1.42',
      };
      mockDataProvider.setCollection('audit_logs', [newLog, ...auditLogs]);
    } catch (e) {
      console.warn('Failed to record audit log', e);
    }

    return city;
  }

  /**
   * Add a new city to operations
   */
  async addCity({
    cityName,
    state = 'Karnataka',
    leadCoordinator = 'Operations Lead',
    status = 'Expanding',
    coverageRadiusKm = 25,
  }) {
    await sleep(100);
    const cityConfigs = mockDataProvider.getCityConfigurations();

    const exists = cityConfigs.some(
      (c) => c.cityName.toLowerCase() === cityName.toLowerCase().trim()
    );
    if (exists) {
      throw new Error(`City "${cityName}" already exists in configuration.`);
    }

    // Default service settings: all enabled
    const defaultSettings = {};
    MEDIUNIFY_SERVICES.forEach((s) => {
      defaultSettings[s.id] = {
        isVisible: true,
        status: 'Available',
        remarks: `Initialized for ${cityName}`,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Super Admin',
      };
    });

    const newCity = {
      cityName: cityName.trim(),
      state,
      status,
      leadCoordinator,
      activeBookingsCount: 0,
      coverageRadiusKm,
      serviceSettings: defaultSettings,
    };

    const updated = [...cityConfigs, newCity];
    mockDataProvider.setCollection('city_configurations', updated);
    return newCity;
  }

  /**
   * Delete a configured city safely
   */
  async deleteCity(cityName, force = false) {
    await sleep(100);
    const cityConfigs = mockDataProvider.getCityConfigurations();
    const city = cityConfigs.find(
      (c) => c.cityName.toLowerCase() === cityName.toLowerCase()
    );

    if (!city) {
      throw new Error(`City "${cityName}" not found.`);
    }

    if (!force && city.activeBookingsCount > 0) {
      throw new Error(
        `Cannot delete ${cityName} directly: It has ${city.activeBookingsCount} active bookings. Please reassign or deactivate the hub first.`
      );
    }

    const updated = cityConfigs.filter(
      (c) => c.cityName.toLowerCase() !== cityName.toLowerCase()
    );
    mockDataProvider.setCollection('city_configurations', updated);
    return true;
  }

  /**
   * Patient-side API simulator: returns ONLY visible & available services for the selected city
   */
  async getPatientServicesForCity(cityName) {
    const services = await this.getCityServices(cityName);
    return services.filter((s) => s.isVisible && s.status !== 'Disabled');
  }

  /**
   * Check if a specific service is available for a patient in a city
   */
  async isServiceAvailableInCity(serviceId, cityName) {
    const services = await this.getCityServices(cityName);
    const s = services.find((item) => item.id === serviceId);
    return s ? Boolean(s.isVisible && s.status !== 'Disabled') : true;
  }
}

export const cityServicesRepository = new CityServicesRepository();
