'use client';

import React, { useState, useEffect } from 'react';
import { cityServicesRepository, auditLogsRepository } from '@/services/repositories';
import { MEDIUNIFY_SERVICES } from '@/data/mock/cityServices';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { exportToCSV } from '@/services/exportService';
import { useNotification } from '@/providers/AppProviders';
import {
  MapPin,
  Stethoscope,
  Pill,
  FlaskConical,
  ScanLine,
  UserCheck,
  PackageCheck,
  Activity,
  Sparkles,
  AlertTriangle,
  Video,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Smartphone,
  ExternalLink,
  RotateCcw,
  History,
  ShieldCheck,
  Search,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const ICON_COMPONENTS = {
  Pill,
  Video,
  Stethoscope,
  UserCheck,
  PackageCheck,
  Activity,
  FlaskConical,
  ScanLine,
  Sparkles,
  AlertTriangle,
};

export default function CityOperationsPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);

  // Active Top Tab
  // 'cities' (City Management & Overview) | 'toggles' (City-Wise Service Toggles) | 'patient_preview' (Patient App Simulator) | 'audit' (Audit Logs)
  const [activeTab, setActiveTab] = useState('cities');

  // Cities Data
  const [citiesList, setCitiesList] = useState([]);
  const [search, setSearch] = useState('');

  // Selected city for Service Toggles
  const [selectedCityName, setSelectedCityName] = useState('Hassan');
  const [currentCityServices, setCurrentCityServices] = useState([]);
  const [servicesSaving, setServicesSaving] = useState(false);

  // Modals
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [newCityForm, setNewCityForm] = useState({
    cityName: '',
    state: 'Karnataka',
    status: 'Active',
    leadCoordinator: '',
    coverageRadiusKm: 25,
  });

  const [editCity, setEditCity] = useState(null);
  const [deleteTargetCity, setDeleteTargetCity] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Patient Simulator State
  const [patientCity, setPatientCity] = useState('Hassan');
  const [patientSearch, setPatientSearch] = useState('');
  const [simulatedDirectRoute, setSimulatedDirectRoute] = useState(null);

  // Load Cities & Services
  const loadData = async () => {
    setLoading(true);
    try {
      const cities = await cityServicesRepository.getCities();
      setCitiesList(cities);

      // Load services for currently selected city
      const srv = await cityServicesRepository.getCityServices(selectedCityName);
      setCurrentCityServices(srv);
    } catch (err) {
      notify('Failed to load city operations data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCityName]);

  // Handle City Change in Toggle tab
  const handleSelectCityForToggles = async (cityName) => {
    setSelectedCityName(cityName);
    setLoading(true);
    try {
      const srv = await cityServicesRepository.getCityServices(cityName);
      setCurrentCityServices(srv);
    } finally {
      setLoading(false);
    }
  };

  // Toggle single service visibility in state
  const handleToggleService = (serviceId) => {
    setCurrentCityServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          const nextVisible = !s.isVisible;
          return {
            ...s,
            isVisible: nextVisible,
            status: nextVisible ? 'Available' : 'Disabled',
          };
        }
        return s;
      })
    );
  };

  // Update status or remarks for a service in state
  const handleUpdateServiceField = (serviceId, field, value) => {
    setCurrentCityServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  // Save all toggles for selected city
  const handleSaveCityToggles = async () => {
    setServicesSaving(true);
    try {
      const settingsMap = {};
      currentCityServices.forEach((s) => {
        settingsMap[s.id] = {
          isVisible: Boolean(s.isVisible),
          status: s.status,
          remarks: s.remarks,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Super Admin (Dr. Arjun)',
        };
      });

      await cityServicesRepository.saveCityAllServices(
        selectedCityName,
        settingsMap,
        'Super Admin (Dr. Arjun)'
      );

      notify(`Saved healthcare service visibility settings for ${selectedCityName}`, 'success');
      // Refresh city list counts
      const updatedCities = await cityServicesRepository.getCities();
      setCitiesList(updatedCities);
    } catch (err) {
      notify(err.message || 'Failed to save visibility settings', 'error');
    } finally {
      setServicesSaving(false);
    }
  };

  // Create City
  const handleCreateCity = async (e) => {
    e.preventDefault();
    if (!newCityForm.cityName.trim()) {
      notify('Please enter a city name', 'warning');
      return;
    }

    try {
      await cityServicesRepository.addCity(newCityForm);
      notify(`Added new operational hub: ${newCityForm.cityName}`, 'success');
      setIsAddCityOpen(false);
      setNewCityForm({
        cityName: '',
        state: 'Karnataka',
        status: 'Active',
        leadCoordinator: '',
        coverageRadiusKm: 25,
      });
      await loadData();
    } catch (err) {
      notify(err.message || 'Failed to add city', 'error');
    }
  };

  // Delete City with check for active bookings
  const handleDeleteCity = async () => {
    if (!deleteTargetCity) return;
    try {
      await cityServicesRepository.deleteCity(deleteTargetCity.cityName, false);
      notify(`Successfully removed city hub ${deleteTargetCity.cityName}`, 'success');
      setDeleteTargetCity(null);
      setDeleteError(null);
      await loadData();
    } catch (err) {
      setDeleteError(err.message);
      notify(err.message, 'error');
    }
  };

  // Export Cities to CSV
  const handleExportCSV = () => {
    exportToCSV('mediunify_city_service_availability', citiesList, [
      { header: 'City Name', accessorKey: 'cityName' },
      { header: 'State', accessorKey: 'state' },
      { header: 'Operational Status', accessorKey: 'status' },
      { header: 'Available Services', accessorKey: 'availableServicesCount' },
      { header: 'Disabled Services', accessorKey: 'disabledServicesCount' },
      { header: 'Active Bookings', accessorKey: 'activeBookingsCount' },
      { header: 'Lead Coordinator', accessorKey: 'leadCoordinator' },
    ]);
  };

  // Filtered Cities
  const filteredCities = citiesList.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.cityName.toLowerCase().includes(q) ||
      c.leadCoordinator.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  // Patient Simulator visible services for selected patient city
  const patientCityConfig = citiesList.find(
    (c) => c.cityName.toLowerCase() === patientCity.toLowerCase()
  );
  const patientCityServices = MEDIUNIFY_SERVICES.map((s) => {
    const setting = patientCityConfig?.serviceSettings?.[s.id];
    const isVisible = setting ? setting.isVisible !== false : true;
    return {
      ...s,
      isVisible,
      status: setting ? setting.status : 'Available',
      remarks: setting ? setting.remarks : '',
    };
  });

  const visibleToPatient = patientCityServices.filter((s) => {
    if (!s.isVisible || s.status === 'Disabled') return false;
    if (patientSearch) {
      return (
        s.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(patientSearch.toLowerCase())
      );
    }
    return true;
  });

  // Columns for City Management Table
  const cityColumns = [
    {
      header: 'City Hub & State',
      accessorKey: 'cityName',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 border border-teal-200/50">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
              {row.cityName}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {row.state} • {row.coverageRadiusKm || 25} KM Coverage
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Services Availability',
      accessorKey: 'availableServicesCount',
      cell: ({ row }) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {row.availableServicesCount} Visible
            </span>
            {row.disabledServicesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/50 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-500" />
                {row.disabledServicesCount} Hidden
              </span>
            )}
          </div>
          <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full"
              style={{
                width: `${(row.availableServicesCount / (row.totalServices || 10)) * 100}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Hub Coordinator & Bookings',
      accessorKey: 'leadCoordinator',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            {row.leadCoordinator || 'City Lead'}
          </span>
          <span className="text-[10px] text-slate-500">
            {row.activeBookingsCount || 0} Dependent Bookings
          </span>
        </div>
      ),
    },
    {
      header: 'Hub Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            className="text-xs h-7 px-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium"
            onClick={() => {
              handleSelectCityForToggles(row.cityName);
              setActiveTab('toggles');
            }}
            title="Configure Service Visibility"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Manage Services
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            title="Delete City Hub"
            onClick={() => {
              setDeleteTargetCity(row);
              setDeleteError(null);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              City & Service Availability Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50">
              Super Admin Control
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure geographic service visibility by city (e.g., Hassan vs Mysuru). Changes drive patient-facing app listings in real-time.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cities'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Configured Cities ({citiesList.length})
          </button>
          <button
            onClick={() => setActiveTab('toggles')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'toggles'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            City-Wise Service Toggles
          </button>
          <button
            onClick={() => setActiveTab('patient_preview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'patient_preview'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Patient App Simulator
          </button>
        </div>
      </div>

      {/* TAB 1: Configured Cities Overview */}
      {activeTab === 'cities' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Search city hub or lead coordinator..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="text-xs"
                >
                  Export CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold"
                  onClick={() => setIsAddCityOpen(true)}
                >
                  Add Configured City
                </Button>
              </div>
            </div>

            <DataTable
              columns={cityColumns}
              data={filteredCities}
              isLoading={loading}
              emptyTitle="No Configured Cities"
              emptyDescription="No cities match your search filter."
            />
          </div>
        </div>
      )}

      {/* TAB 2: City-Wise Service Toggles */}
      {activeTab === 'toggles' && (
        <div className="space-y-4">
          {/* City Selector Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Configuring Healthcare Services For City Hub:
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    value={selectedCityName}
                    onChange={(e) => handleSelectCityForToggles(e.target.value)}
                    className="text-base font-black text-slate-900 dark:text-slate-100 bg-transparent border-0 focus:outline-none cursor-pointer"
                  >
                    {citiesList.map((c) => (
                      <option key={c.cityName} value={c.cityName} className="text-slate-800 dark:text-slate-200">
                        {c.cityName} ({c.state})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">• Karnataka</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setPatientCity(selectedCityName);
                  setActiveTab('patient_preview');
                }}
              >
                <Smartphone className="w-3.5 h-3.5 mr-1" />
                Preview in Patient App
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Save}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                onClick={handleSaveCityToggles}
                isLoading={servicesSaving}
              >
                Save Changes for {selectedCityName}
              </Button>
            </div>
          </div>

          {/* Service Toggle Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Available MediUnify Healthcare Services ({currentCityServices.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Toggle services on or off for patients in <strong>{selectedCityName}</strong>. Hidden services will be completely omitted from patient listings and searches.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-600">
                  {currentCityServices.filter((s) => s.isVisible).length} Visible
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-bold text-rose-500">
                  {currentCityServices.filter((s) => !s.isVisible).length} Hidden
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentCityServices.map((service) => {
                const IconComponent = ICON_COMPONENTS[service.icon] || Stethoscope;
                return (
                  <div
                    key={service.id}
                    className={`p-4 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      service.isVisible
                        ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                        : 'bg-slate-50/30 dark:bg-slate-950/20'
                    }`}
                  >
                    {/* Left: Icon, Name, Category */}
                    <div className="flex items-start gap-3.5 flex-1 max-w-md">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          service.isVisible
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 border border-teal-200/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {service.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {service.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Admin Remarks Input */}
                    <div className="flex-1 max-w-sm">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Operational Admin Remarks
                      </label>
                      <Input
                        placeholder="e.g. Launching Q1 2027 or Partner pharmacy active"
                        value={service.remarks || ''}
                        onChange={(e) =>
                          handleUpdateServiceField(service.id, 'remarks', e.target.value)
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Right: Status selector and Toggle Switch */}
                    <div className="flex items-center gap-4">
                      {/* Availability status dropdown */}
                      <div className="w-32">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Status
                        </label>
                        <select
                          value={service.status}
                          disabled={!service.isVisible}
                          onChange={(e) =>
                            handleUpdateServiceField(service.id, 'status', e.target.value)
                          }
                          className="w-full text-xs font-semibold p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        >
                          <option value="Available">Available</option>
                          <option value="Coming Soon">Coming Soon</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Disabled">Disabled</option>
                        </select>
                      </div>

                      {/* Instant Toggle Button */}
                      <div className="text-right">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Patient Visibility
                        </label>
                        <button
                          type="button"
                          onClick={() => handleToggleService(service.id)}
                          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            service.isVisible ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              service.isVisible ? 'translate-x-7' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[10px] font-bold block mt-0.5 ${
                            service.isVisible ? 'text-teal-600' : 'text-slate-400'
                          }`}
                        >
                          {service.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Changes will take effect immediately across all patient web and mobile clients for <strong>{selectedCityName}</strong>.
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                onClick={handleSaveCityToggles}
                isLoading={servicesSaving}
              >
                Save All Changes for {selectedCityName}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Patient App Simulator & Direct Route Tester */}
      {activeTab === 'patient_preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Simulator Controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader
                  title="Patient Client Simulator"
                  subtitle="Verify how patient apps render services based on selected city"
                />
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Patient Selected City (Source of Truth):
                    </label>
                    <Select
                      value={patientCity}
                      onChange={(e) => {
                        setPatientCity(e.target.value);
                        setSimulatedDirectRoute(null);
                      }}
                      options={citiesList.map((c) => c.cityName)}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Switching cities instantly updates the visible service catalog for the patient.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Patient In-App Search:
                    </label>
                    <Input
                      placeholder="e.g. Nursing, Doctor, Pharmacy..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                  </div>

                  {/* Direct Route / Bookmark Tester */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      Direct Route & Old Bookmark Tester:
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Simulate a patient clicking a saved bookmark or direct URL to a disabled service in {patientCity}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {MEDIUNIFY_SERVICES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSimulatedDirectRoute(s)}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary of availability */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 space-y-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {patientCity} City Availability Summary:
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Visible to Patient:</span>
                      <strong className="text-teal-600">{visibleToPatient.length} Services</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Hidden / Unavailable:</span>
                      <strong className="text-rose-500">
                        {MEDIUNIFY_SERVICES.length - visibleToPatient.length} Services
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Mock Phone Screen / Patient View */}
            <div className="lg:col-span-2">
              <div className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 shadow-inner">
                {/* Mock Mobile App Shell Header */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#1E3A8A] dark:text-blue-400">
                        Medi<span className="text-[#00B894]">Unify</span> Patient App
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>Delivering to:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 underline">
                          {patientCity}, Karnataka
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      Live Preview
                    </span>
                  </div>
                </div>

                {/* Direct Route Intercept Alert (When a disabled route is tested) */}
                {simulatedDirectRoute && (
                  (() => {
                    const setting = patientCityConfig?.serviceSettings?.[simulatedDirectRoute.id];
                    const isAllowed = setting ? setting.isVisible !== false && setting.status !== 'Disabled' : true;

                    if (!isAllowed) {
                      return (
                        <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 animate-in fade-in">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                                Service Unavailable in {patientCity}
                              </h4>
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                                <strong>{simulatedDirectRoute.name}</strong> is currently not available in <strong>{patientCity}</strong>. {setting?.remarks || 'We are rapidly expanding across Karnataka.'}
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => setSimulatedDirectRoute(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  Explore Available Services in {patientCity}
                                </button>
                                <button
                                  onClick={() => {
                                    handleSelectCityForToggles(patientCity);
                                    setActiveTab('toggles');
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                                >
                                  Super Admin: Enable This Service
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 flex items-center justify-between text-xs">
                          <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                            Direct Route Accessible: {simulatedDirectRoute.name} is enabled and ready in {patientCity}!
                          </span>
                          <button
                            onClick={() => setSimulatedDirectRoute(null)}
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            Dismiss
                          </button>
                        </div>
                      );
                    }
                  })()
                )}

                {/* Patient Service Catalog Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Available Healthcare Modalities ({visibleToPatient.length})
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      Showing services enabled for {patientCity}
                    </span>
                  </div>

                  {visibleToPatient.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border">
                      No services currently enabled for {patientCity}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {visibleToPatient.map((service) => {
                        const IconComp = ICON_COMPONENTS[service.icon] || Stethoscope;
                        return (
                          <div
                            key={service.id}
                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3 hover:border-teal-500 transition-colors"
                          >
                            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 shrink-0">
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {service.name}
                                </h4>
                                <span className="text-[10px] font-bold text-emerald-600">
                                  Available
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {service.category}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {service.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Hidden Services Notice in Simulator */}
                {patientCityServices.some((s) => !s.isVisible) && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-[11px] flex items-center justify-between">
                    <span>
                      Disabled for {patientCity}:{' '}
                      <strong>
                        {patientCityServices
                          .filter((s) => !s.isVisible)
                          .map((s) => s.name)
                          .join(', ')}
                      </strong>{' '}
                      (Hidden from patient search and categories)
                    </span>
                    <button
                      onClick={() => {
                        handleSelectCityForToggles(patientCity);
                        setActiveTab('toggles');
                      }}
                      className="font-bold text-teal-600 hover:underline shrink-0 ml-2"
                    >
                      Configure
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add City */}
      <Modal
        isOpen={isAddCityOpen}
        onClose={() => setIsAddCityOpen(false)}
        maxWidth="max-w-md"
        title="Add Regional City Hub"
        subtitle="Expands MediUnify operations to a new Karnataka district"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddCityOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              onClick={handleCreateCity}
            >
              Add City Hub
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCity} className="space-y-3.5 text-xs">
          <Input
            label="City / Hub Name *"
            required
            placeholder="e.g. Udupi, Shivamogga, Ballari"
            value={newCityForm.cityName}
            onChange={(e) => setNewCityForm({ ...newCityForm, cityName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State"
              value={newCityForm.state}
              disabled
              className="bg-slate-50"
            />
            <Select
              label="Operational Status"
              value={newCityForm.status}
              onChange={(e) => setNewCityForm({ ...newCityForm, status: e.target.value })}
              options={['Active', 'Limited Hub', 'Expanding', 'Planned']}
            />
          </div>

          <Input
            label="Regional Coordinator Lead"
            placeholder="e.g. Anand K. Kumar"
            value={newCityForm.leadCoordinator}
            onChange={(e) =>
              setNewCityForm({ ...newCityForm, leadCoordinator: e.target.value })
            }
          />

          <Input
            label="Coverage Radius (KM)"
            type="number"
            value={newCityForm.coverageRadiusKm}
            onChange={(e) =>
              setNewCityForm({ ...newCityForm, coverageRadiusKm: Number(e.target.value) })
            }
          />

          <p className="text-[11px] text-slate-400">
            Note: All 10 healthcare modalities will be enabled by default upon creation and can be configured immediately.
          </p>
        </form>
      </Modal>

      {/* CONFIRM DIALOG: Delete City */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetCity)}
        onClose={() => {
          setDeleteTargetCity(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteCity}
        title={`Delete City Hub: ${deleteTargetCity?.cityName}?`}
        description={
          deleteError ? (
            <span className="text-rose-600 font-bold block">{deleteError}</span>
          ) : (
            `Are you sure you want to remove ${deleteTargetCity?.cityName}? This city currently has ${deleteTargetCity?.activeBookingsCount || 0} dependent bookings. Deletion is blocked if active bookings exist.`
          )
        }
        confirmText="Confirm Delete"
      />
    </div>
  );
}
