'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  nurseBookingsRepository,
  nursingProvidersRepository,
} from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  UserCheck,
  MapPin,
  Clock,
  HeartHandshake,
  Eye,
  Trash2,
  Plus,
  Edit2,
  Power,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ShieldCheck,
  Search,
  Award,
  Info,
  Calendar,
} from 'lucide-react';

export default function NursingPage() {
  const { notify } = useNotification();
  const [activeModuleTab, setActiveModuleTab] = useState('bookings'); // 'bookings' | 'providers' | 'requests'

  // ==========================================
  // TAB 1: EXISTING BOOKINGS STATE & LOGIC
  // ==========================================
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [nurseName, setNurseName] = useState('Sister Geetha Kumari (B.Sc Nursing)');
  const [deleteBookingTarget, setDeleteBookingTarget] = useState(null);

  const {
    data: bookingsData,
    setData: setBookingsData,
    paginatedData: paginatedBookings,
    totalRecords: totalBookingsRecords,
    search: bookingSearch,
    setSearch: setBookingSearch,
    statusFilter: bookingStatusFilter,
    setStatusFilter: setBookingStatusFilter,
    categoryFilter: bookingCategoryFilter,
    setCategoryFilter: setBookingCategoryFilter,
    cityFilter: bookingCityFilter,
    setCityFilter: setBookingCityFilter,
    page: bookingPage,
    setPage: setBookingPage,
    pageSize: bookingPageSize,
    setPageSize: setBookingPageSize,
    totalPages: bookingTotalPages,
    sortField: bookingSortField,
    sortDirection: bookingSortDirection,
    setSortField: setBookingSortField,
    setSortDirection: setBookingSortDirection,
    resetFilters: resetBookingFilters,
  } = useLocalFilters([], { defaultSortField: 'scheduledDate', defaultSortDirection: 'desc' });

  // ==========================================
  // TAB 2: NURSING PROVIDERS DIRECTORY STATE
  // ==========================================
  const [providersList, setProvidersList] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerCityFilter, setProviderCityFilter] = useState('All');
  const [providerStatusFilter, setProviderStatusFilter] = useState('All');
  const [providerPage, setProviderPage] = useState(1);
  const [providerPageSize, setProviderPageSize] = useState(10);

  const [isRegisterProviderModalOpen, setIsRegisterProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [viewingProvider, setViewingProvider] = useState(null);
  const [deleteProviderTarget, setDeleteProviderTarget] = useState(null);

  const initialProviderForm = {
    fullName: '',
    mobileNumber: '',
    email: '',
    residentialAddress: '',
    city: 'Mysuru',
    serviceArea: '',
    qualification: 'B.Sc Nursing (RGUHS)',
    kncRegistrationNo: '',
    experienceYears: '4',
    specializations: 'Post-Surgical Wound Dressing, IV/IM Injections, Vitals Monitoring',
    availability: 'Full-Time (Day Shifts)',
    serviceTypes: 'Procedure Visits, Wound Dressing',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    status: 'Active',
  };
  const [providerFormData, setProviderFormData] = useState(initialProviderForm);
  const [providerSubmitting, setProviderSubmitting] = useState(false);

  // ==========================================
  // TAB 3: SELF-REGISTRATION REQUESTS STATE
  // ==========================================
  const [nursingRequests, setNursingRequests] = useState([]);
  const [reqSearch, setReqSearch] = useState('');
  const [reqCityFilter, setReqCityFilter] = useState('All');
  const [reqStatusFilter, setReqStatusFilter] = useState('All');
  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);

  const [viewingRequest, setViewingRequest] = useState(null);
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestingInfoRequest, setRequestingInfoRequest] = useState(null);
  const [infoRemarks, setInfoRemarks] = useState('');

  // Initial Data Loading
  useEffect(() => {
    async function loadAll() {
      setBookingsLoading(true);
      try {
        const [bookingsRes, provRes, reqRes] = await Promise.all([
          nurseBookingsRepository.getAll(),
          nursingProvidersRepository.getAll(),
          nursingProvidersRepository.getRequests(),
        ]);
        setBookingsData(bookingsRes.data || []);
        setProvidersList(provRes.data || []);
        setNursingRequests(reqRes.data || []);
      } catch (err) {
        console.error('Failed to load nursing data:', err);
      } finally {
        setBookingsLoading(false);
      }
    }
    loadAll();
  }, [setBookingsData]);

  // Tab 1 Handlers: Assign Nurse & Delete Booking
  const handleAssignNurse = async () => {
    if (!selectedBooking) return;
    const updated = await nurseBookingsRepository.assignNurse(
      selectedBooking.id,
      nurseName,
      '+91 98450 77819',
      'KNC-48192'
    );
    setBookingsData(bookingsData.map((n) => (n.id === updated.id ? updated : n)));
    setIsAssignModalOpen(false);
    notify(`Nurse ${nurseName} assigned to ${updated.patientName}`);
  };

  const handleDeleteBooking = async () => {
    if (!deleteBookingTarget) return;
    try {
      await nurseBookingsRepository.delete(deleteBookingTarget.id);
      setBookingsData(bookingsData.filter((n) => n.id !== deleteBookingTarget.id));
      notify(`Deleted home nursing booking ${deleteBookingTarget.bookingRef} for ${deleteBookingTarget.patientName}`, 'success');
    } catch (err) {
      notify(`Failed to delete nursing booking: ${err.message}`, 'error');
    } finally {
      setDeleteBookingTarget(null);
    }
  };

  const handleExportBookings = () => {
    exportToCSV('mediunify_home_nursing', bookingsData, [
      { header: 'Booking Ref', accessorKey: 'bookingRef' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Service Name', accessorKey: 'serviceName' },
      { header: 'Category', accessorKey: 'serviceCategory' },
      { header: 'Address', accessorKey: 'patientAddress' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Assigned Nurse', accessorKey: 'assignedNurseName' },
      { header: 'Price', accessorKey: 'price' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  // Tab 2 Handlers: Provider Directory CRUD
  const filteredProviders = useMemo(() => {
    return providersList.filter((p) => {
      const matchSearch =
        providerSearch === '' ||
        p.fullName.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.providerId.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.mobileNumber.includes(providerSearch) ||
        p.kncRegistrationNo.toLowerCase().includes(providerSearch.toLowerCase());
      const matchCity = providerCityFilter === 'All' || p.city === providerCityFilter;
      const matchStatus = providerStatusFilter === 'All' || p.status === providerStatusFilter;
      return matchSearch && matchCity && matchStatus;
    });
  }, [providersList, providerSearch, providerCityFilter, providerStatusFilter]);

  const paginatedProviders = useMemo(() => {
    const start = (providerPage - 1) * providerPageSize;
    return filteredProviders.slice(start, start + providerPageSize);
  }, [filteredProviders, providerPage, providerPageSize]);

  const handleOpenAddProvider = () => {
    setEditingProvider(null);
    setProviderFormData(initialProviderForm);
    setIsRegisterProviderModalOpen(true);
  };

  const handleOpenEditProvider = (provider) => {
    setEditingProvider(provider);
    setProviderFormData({
      fullName: provider.fullName || '',
      mobileNumber: provider.mobileNumber || '',
      email: provider.email || '',
      residentialAddress: provider.residentialAddress || '',
      city: provider.city || 'Mysuru',
      serviceArea: provider.serviceArea || '',
      qualification: provider.qualification || '',
      kncRegistrationNo: provider.kncRegistrationNo || '',
      experienceYears: provider.experienceYears?.toString() || '4',
      specializations: Array.isArray(provider.specializations)
        ? provider.specializations.join(', ')
        : provider.specializations || '',
      availability: provider.availability || '',
      serviceTypes: Array.isArray(provider.serviceTypes)
        ? provider.serviceTypes.join(', ')
        : provider.serviceTypes || '',
      idProofType: provider.idProofType || 'Aadhaar Card',
      idProofNumber: provider.idProofNumber || '',
      status: provider.status || 'Active',
    });
    setIsRegisterProviderModalOpen(true);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    if (!providerFormData.fullName || !providerFormData.mobileNumber || !providerFormData.kncRegistrationNo) {
      notify('Please fill all mandatory fields (Full Name, Mobile, KNC Registration Number).', 'error');
      return;
    }

    setProviderSubmitting(true);
    try {
      if (editingProvider) {
        const updated = await nursingProvidersRepository.update(editingProvider.id, providerFormData);
        setProvidersList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        notify(`Updated nurse provider details for ${updated.fullName}`, 'success');
      } else {
        const created = await nursingProvidersRepository.create(providerFormData);
        setProvidersList((prev) => [created, ...prev]);
        notify(`Registered nurse caregiver: ${created.fullName} (${created.providerId})`, 'success');
      }
      setIsRegisterProviderModalOpen(false);
    } catch (err) {
      notify(err.message || 'Operation failed', 'error');
    } finally {
      setProviderSubmitting(false);
    }
  };

  const handleToggleProviderStatus = async (provider) => {
    try {
      if (provider.status === 'Active') {
        const updated = await nursingProvidersRepository.deactivate(provider.id);
        setProvidersList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        notify(`Deactivated ${provider.fullName}. Unavailable for patient home visits.`, 'warning');
      } else {
        const updated = await nursingProvidersRepository.activate(provider.id);
        setProvidersList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        notify(`Activated ${provider.fullName}. Available for home nursing care.`, 'success');
      }
    } catch (err) {
      notify('Failed to update status', 'error');
    }
  };

  const handleConfirmDeleteProvider = async () => {
    if (!deleteProviderTarget) return;
    try {
      await nursingProvidersRepository.delete(deleteProviderTarget.id);
      setProvidersList((prev) => prev.filter((p) => p.id !== deleteProviderTarget.id));
      notify(`Removed nurse provider ${deleteProviderTarget.fullName} (${deleteProviderTarget.providerId})`, 'success');
    } catch (err) {
      notify(`Delete failed: ${err.message}`, 'error');
    } finally {
      setDeleteProviderTarget(null);
    }
  };

  // Tab 3 Handlers: Self-Registration Approvals
  const filteredRequests = useMemo(() => {
    return nursingRequests.filter((r) => {
      const matchSearch =
        reqSearch === '' ||
        r.fullName.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.applicationId.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.mobileNumber.includes(reqSearch) ||
        r.kncRegistrationNo.toLowerCase().includes(reqSearch.toLowerCase());
      const matchCity = reqCityFilter === 'All' || r.city === reqCityFilter;
      const matchStatus = reqStatusFilter === 'All' || r.status === reqStatusFilter;
      return matchSearch && matchCity && matchStatus;
    });
  }, [nursingRequests, reqSearch, reqCityFilter, reqStatusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (reqPage - 1) * reqPageSize;
    return filteredRequests.slice(start, start + reqPageSize);
  }, [filteredRequests, reqPage, reqPageSize]);

  const pendingRequestsCount = useMemo(() => {
    return nursingRequests.filter((r) => r.status === 'Pending Review').length;
  }, [nursingRequests]);

  const handleApproveRequest = async () => {
    if (!approvingRequest) return;
    try {
      const res = await nursingProvidersRepository.approveRequest(approvingRequest.id);
      setNursingRequests((prev) => prev.map((r) => (r.id === res.request.id ? res.request : r)));
      setProvidersList((prev) => {
        const exists = prev.some((p) => p.id === res.provider.id);
        if (exists) return prev.map((p) => (p.id === res.provider.id ? res.provider : p));
        return [res.provider, ...prev];
      });
      notify(`Approved ${approvingRequest.fullName}. Added to active nursing providers roster!`, 'success');
    } catch (err) {
      notify(`Approval failed: ${err.message}`, 'error');
    } finally {
      setApprovingRequest(null);
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectingRequest || !rejectionReason.trim()) {
      notify('Please enter a rejection reason.', 'error');
      return;
    }
    try {
      const updated = await nursingProvidersRepository.rejectRequest(rejectingRequest.id, rejectionReason);
      setNursingRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      notify(`Application ${rejectingRequest.applicationId} rejected and archived.`, 'warning');
    } catch (err) {
      notify(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setRejectingRequest(null);
      setRejectionReason('');
    }
  };

  const handleRequestInfo = async () => {
    if (!requestingInfoRequest || !infoRemarks.trim()) {
      notify('Please enter remarks for additional info.', 'error');
      return;
    }
    try {
      const updated = await nursingProvidersRepository.requestAdditionalInfo(requestingInfoRequest.id, infoRemarks);
      setNursingRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      notify(`Additional information requested from ${requestingInfoRequest.fullName}.`, 'success');
    } catch (err) {
      notify(`Failed to update: ${err.message}`, 'error');
    } finally {
      setRequestingInfoRequest(null);
      setInfoRemarks('');
    }
  };

  // Columns for Bookings Table
  const bookingColumns = [
    {
      header: 'Booking Ref & Service',
      accessorKey: 'bookingRef',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.bookingRef}
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{row.serviceName}</p>
          <span className="text-[10px] text-slate-400">{row.serviceCategory}</span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{row.patientName}</p>
          <p className="text-[10px] text-slate-400 font-mono">UHID: {row.uhid}</p>
          <p className="text-[10px] text-slate-400">{row.patientPhone}</p>
        </div>
      ),
    },
    {
      header: 'Location & Address',
      accessorKey: 'city',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
            {row.city}
          </div>
          <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]" title={row.patientAddress}>
            {row.patientAddress}
          </p>
        </div>
      ),
    },
    {
      header: 'Assigned Nurse',
      accessorKey: 'assignedNurseName',
      cell: ({ row }) => (
        <div>
          {row.assignedNurseName ? (
            <div>
              <p className="font-semibold text-teal-700 dark:text-teal-400">{row.assignedNurseName}</p>
              <p className="text-[10px] text-slate-400">{row.nursePhone}</p>
            </div>
          ) : (
            <span className="text-[11px] text-amber-600 font-semibold italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      header: 'Schedule & Fee',
      accessorKey: 'scheduledDate',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{row.scheduledDate}</p>
          <p className="text-[10px] text-slate-400">{row.timeSlot}</p>
          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            {formatCurrency(row.price)}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge variant={row.status === 'Completed' ? 'success' : row.status === 'In Service' ? 'primary' : 'warning'}>{row.status}</Badge>,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBooking(row);
              setIsAssignModalOpen(true);
            }}
            className="text-xs h-7 px-2"
          >
            Assign Nurse
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Nursing Record"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteBookingTarget(row);
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[11px] font-bold border border-teal-300/30">
              Home Healthcare & Attendant Care
            </span>
            <span className="text-xs text-slate-300">Clinical Nursing Roster</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <HeartHandshake className="w-7 h-7 text-teal-400" />
            Nursing & Caregiver Management
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl">
            Manage registered B.Sc & GNM staff nurses, KNC statutory verification, availability, patient home visits, and self-registration requests across Karnataka cities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddProvider}
            className="bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold shadow-lg shadow-teal-500/20"
          >
            Add Nursing Provider
          </Button>
        </div>
      </div>

      {/* Strict Earnings Restriction Info Card */}
      <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-start gap-3 text-xs text-teal-900 dark:text-teal-200">
        <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Clinical Quality & Patient Care Governance</p>
          <p className="mt-0.5 opacity-90">
            Nursing management is strictly dedicated to provider credentials, KNC licence verification, shift availability, and patient booking dispatch. As mandated by MediUnify policy, no earnings, commissions, monthly revenue dashboards, or payout buttons are implemented in this module.
          </p>
        </div>
      </div>

      {/* Module Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveModuleTab('bookings')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeModuleTab === 'bookings'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Home Nursing Bookings
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {bookingsData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModuleTab('providers')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeModuleTab === 'providers'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Nursing Providers & Caregivers
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {providersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModuleTab('requests')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeModuleTab === 'requests'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Nursing Registrations
          {pendingRequestsCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold animate-pulse">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BOOKINGS */}
      {/* ========================================================================= */}
      {activeModuleTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <TableToolbar
            search={bookingSearch}
            onSearchChange={setBookingSearch}
            searchPlaceholder="Search nursing booking by ref, service, nurse, patient..."
            statusFilter={bookingStatusFilter}
            onStatusChange={setBookingStatusFilter}
            statusOptions={['Nurse Requested', 'Assigned', 'In Service', 'Completed']}
            cityFilter={bookingCityFilter}
            onCityChange={setBookingCityFilter}
            categoryFilter={bookingCategoryFilter}
            onCategoryChange={setBookingCategoryFilter}
            categoryOptions={['Procedure', 'Short Visit (1-2 Hours)', 'Day Shift (12 Hours)', '24x7 ICU Nurse']}
            onExport={handleExportBookings}
            onReset={resetBookingFilters}
          />

          <DataTable
            columns={bookingColumns}
            data={paginatedBookings}
            isLoading={bookingsLoading}
            sortField={bookingSortField}
            sortDirection={bookingSortDirection}
            onSort={(field) => {
              setBookingSortField(field);
              setBookingSortDirection(bookingSortDirection === 'asc' ? 'desc' : 'asc');
            }}
          />

          <Pagination
            currentPage={bookingPage}
            totalPages={bookingTotalPages}
            onPageChange={setBookingPage}
            pageSize={bookingPageSize}
            onPageSizeChange={setBookingPageSize}
            totalItems={totalBookingsRecords}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NURSING PROVIDERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeModuleTab === 'providers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              <div className="relative min-w-[260px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={providerSearch}
                  onChange={(e) => {
                    setProviderSearch(e.target.value);
                    setProviderPage(1);
                  }}
                  placeholder="Search by Nurse name, ID, phone, KNC number..."
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="w-40">
                <Select
                  value={providerCityFilter}
                  onChange={(e) => {
                    setProviderCityFilter(e.target.value);
                    setProviderPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="All">All Cities</option>
                  <option value="Mysuru">Mysuru</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hubballi">Hubballi</option>
                  <option value="Hassan">Hassan</option>
                </Select>
              </div>

              <div className="w-36">
                <Select
                  value={providerStatusFilter}
                  onChange={(e) => {
                    setProviderStatusFilter(e.target.value);
                    setProviderPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Providers Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nurse & ID</th>
                    <th className="py-3 px-4">Qualifications & KNC Reg</th>
                    <th className="py-3 px-4">Contact & Mobile</th>
                    <th className="py-3 px-4">City & Coverage Area</th>
                    <th className="py-3 px-4">Availability & Shift</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedProviders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No nursing providers found matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedProviders.map((provider) => (
                      <tr
                        key={provider.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={provider.profilePhoto}
                              alt={provider.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {provider.fullName}
                              </p>
                              <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                                {provider.providerId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{provider.qualification}</p>
                          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Reg: {provider.kncRegistrationNo}
                          </span>
                          <p className="text-[10px] text-slate-400">{provider.experienceYears} Years Exp</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{provider.mobileNumber}</p>
                          <p className="text-[11px] text-slate-400">{provider.email || 'No email'}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {provider.city}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[200px] truncate" title={provider.serviceArea}>
                            {provider.serviceArea}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{provider.availability}</p>
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 ${
                              provider.registrationSource === 'Self Registered'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {provider.registrationSource}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={provider.status === 'Active' ? 'success' : 'neutral'}>
                            {provider.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingProvider(provider)}
                              title="View Details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditProvider(provider)}
                              title="Edit Nurse"
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleProviderStatus(provider)}
                              title={provider.status === 'Active' ? 'Deactivate Nurse' : 'Activate Nurse'}
                              className={`p-1.5 rounded-lg ${
                                provider.status === 'Active'
                                  ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                  : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteProviderTarget(provider)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <Pagination
                currentPage={providerPage}
                totalRecords={filteredProviders.length}
                pageSize={providerPageSize}
                onPageChange={setProviderPage}
                onPageSizeChange={(newSize) => {
                  setProviderPageSize(newSize);
                  setProviderPage(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PENDING SELF-REGISTRATION REQUESTS */}
      {/* ========================================================================= */}
      {activeModuleTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              <div className="relative min-w-[260px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={reqSearch}
                  onChange={(e) => {
                    setReqSearch(e.target.value);
                    setReqPage(1);
                  }}
                  placeholder="Search application ID, applicant name, mobile, KNC..."
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="w-40">
                <Select
                  value={reqCityFilter}
                  onChange={(e) => {
                    setReqCityFilter(e.target.value);
                    setReqPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="All">All Cities</option>
                  <option value="Mysuru">Mysuru</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hubballi">Hubballi</option>
                  <option value="Hassan">Hassan</option>
                </Select>
              </div>

              <div className="w-44">
                <Select
                  value={reqStatusFilter}
                  onChange={(e) => {
                    setReqStatusFilter(e.target.value);
                    setReqPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="All">All Request Statuses</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Additional Information Required">Info Required</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Application ID & Nurse</th>
                    <th className="py-3 px-4">Degree & KNC Registration</th>
                    <th className="py-3 px-4">Contact & Mobile</th>
                    <th className="py-3 px-4">City & Coverage Area</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No nursing self-registration applications found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={req.profilePhoto}
                              alt={req.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {req.fullName}
                              </p>
                              <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                {req.applicationId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{req.qualification}</p>
                          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Reg: {req.kncRegistrationNo}
                          </span>
                          <p className="text-[10px] text-slate-400">{req.experienceYears} Years Exp</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{req.mobileNumber}</p>
                          <p className="text-[11px] text-slate-400">{req.email || 'No email'}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {req.city}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[200px] truncate" title={req.serviceArea}>
                            {req.serviceArea}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {req.submissionDate}
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              req.status === 'Approved'
                                ? 'success'
                                : req.status === 'Rejected'
                                ? 'danger'
                                : req.status === 'Additional Information Required'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {req.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Eye}
                              onClick={() => setViewingRequest(req)}
                              className="text-xs h-8 px-2.5"
                            >
                              View
                            </Button>

                            {req.status === 'Pending Review' || req.status === 'Additional Information Required' ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={CheckCircle2}
                                  onClick={() => setApprovingRequest(req)}
                                  className="text-xs h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={XCircle}
                                  onClick={() => {
                                    setRejectingRequest(req);
                                    setRejectionReason('');
                                  }}
                                  className="text-xs h-8 px-2.5"
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={AlertCircle}
                                  onClick={() => {
                                    setRequestingInfoRequest(req);
                                    setInfoRemarks('');
                                  }}
                                  className="text-xs h-8 px-2 text-amber-600 border-amber-300"
                                >
                                  Info
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <Pagination
                currentPage={reqPage}
                totalRecords={filteredRequests.length}
                pageSize={reqPageSize}
                onPageChange={setReqPage}
                onPageSizeChange={(newSize) => {
                  setReqPageSize(newSize);
                  setReqPage(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT NURSING PROVIDER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRegisterProviderModalOpen}
        onClose={() => setIsRegisterProviderModalOpen(false)}
        title={editingProvider ? `Edit Nurse: ${editingProvider.fullName}` : 'Register New Nursing Provider'}
        size="lg"
      >
        <form onSubmit={handleSaveProvider} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <Input
                required
                value={providerFormData.fullName}
                onChange={(e) => setProviderFormData({ ...providerFormData, fullName: e.target.value })}
                placeholder="e.g. Sister Geetha Kumari"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number *
              </label>
              <Input
                required
                value={providerFormData.mobileNumber}
                onChange={(e) => setProviderFormData({ ...providerFormData, mobileNumber: e.target.value })}
                placeholder="+91 98450 XXXXX"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={providerFormData.email}
                onChange={(e) => setProviderFormData({ ...providerFormData, email: e.target.value })}
                placeholder="nurse@mediunify.org"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                City *
              </label>
              <Select
                value={providerFormData.city}
                onChange={(e) => setProviderFormData({ ...providerFormData, city: e.target.value })}
                className="text-xs"
              >
                <option value="Mysuru">Mysuru</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hubballi">Hubballi</option>
                <option value="Hassan">Hassan</option>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Service Area / Coverage Hub *
              </label>
              <Input
                required
                value={providerFormData.serviceArea}
                onChange={(e) => setProviderFormData({ ...providerFormData, serviceArea: e.target.value })}
                placeholder="e.g. Kuvempunagar, Saraswathipuram & Bogadi"
                className="text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Residential Address *
              </label>
              <Input
                required
                value={providerFormData.residentialAddress}
                onChange={(e) => setProviderFormData({ ...providerFormData, residentialAddress: e.target.value })}
                placeholder="Full residential address"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Qualifications & Degree *
              </label>
              <Input
                required
                value={providerFormData.qualification}
                onChange={(e) => setProviderFormData({ ...providerFormData, qualification: e.target.value })}
                placeholder="B.Sc Nursing / GNM / M.Sc Nursing"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                KNC Registration Number *
              </label>
              <Input
                required
                value={providerFormData.kncRegistrationNo}
                onChange={(e) => setProviderFormData({ ...providerFormData, kncRegistrationNo: e.target.value })}
                placeholder="KNC-48192"
                className="text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Experience (Years)
              </label>
              <Input
                type="number"
                value={providerFormData.experienceYears}
                onChange={(e) => setProviderFormData({ ...providerFormData, experienceYears: e.target.value })}
                placeholder="4"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Availability & Shifts
              </label>
              <Select
                value={providerFormData.availability}
                onChange={(e) => setProviderFormData({ ...providerFormData, availability: e.target.value })}
                className="text-xs"
              >
                <option value="Full-Time (Day Shifts)">Full-Time (Day Shifts)</option>
                <option value="12-Hour Night Shift">12-Hour Night Shift</option>
                <option value="24 Hours Ongoing Shift Rotation">24 Hours On-Site Shift Rotation</option>
                <option value="Short Visit Procedures Only">Short Visit Procedures Only</option>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Specializations & Skills (Comma-separated)
              </label>
              <Input
                value={providerFormData.specializations}
                onChange={(e) => setProviderFormData({ ...providerFormData, specializations: e.target.value })}
                placeholder="Wound Dressing, Tracheostomy, BiPAP monitoring, Injections"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <Select
                value={providerFormData.status}
                onChange={(e) => setProviderFormData({ ...providerFormData, status: e.target.value })}
                className="text-xs"
              >
                <option value="Active">Active (Ready for Patient Visits)</option>
                <option value="Inactive">Inactive (Off-Duty / Leave)</option>
                <option value="Suspended">Suspended</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRegisterProviderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={providerSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white">
              {editingProvider ? 'Save Changes' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VIEW NURSING PROVIDER DETAILS */}
      {/* ========================================================================= */}
      {viewingProvider && (
        <Modal
          isOpen={!!viewingProvider}
          onClose={() => setViewingProvider(null)}
          title={`Nurse Profile: ${viewingProvider.fullName} (${viewingProvider.providerId})`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={viewingProvider.profilePhoto}
                alt={viewingProvider.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-500 shadow-md"
              />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {viewingProvider.fullName}
                </h3>
                <p className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  ID: {viewingProvider.providerId} • Reg: {viewingProvider.kncRegistrationNo}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Designation: <span className="font-semibold">{viewingProvider.badgeTitle}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingProvider.mobileNumber}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Email</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingProvider.email || 'None'}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Degrees & Registration</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingProvider.qualification}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Karnataka Nursing Council Registration: <span className="font-mono font-bold text-emerald-600">{viewingProvider.kncRegistrationNo}</span> ({viewingProvider.experienceYears} Years Exp)
                </p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Service Area & Availability</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingProvider.city} — {viewingProvider.serviceArea}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Shift: {viewingProvider.availability}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Clinical Procedures</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {Array.isArray(viewingProvider.specializations) ? viewingProvider.specializations.join(', ') : viewingProvider.specializations}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingProvider(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW SELF-REGISTRATION APPLICATION */}
      {/* ========================================================================= */}
      {viewingRequest && (
        <Modal
          isOpen={!!viewingRequest}
          onClose={() => setViewingRequest(null)}
          title={`Nursing Application: ${viewingRequest.fullName}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={viewingRequest.profilePhoto}
                alt={viewingRequest.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-500 shadow-md"
              />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {viewingRequest.fullName}
                </h3>
                <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  Application ID: {viewingRequest.applicationId}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Submitted on: {viewingRequest.submissionDate}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Applicant Overview</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  Mobile: {viewingRequest.mobileNumber} | Email: {viewingRequest.email || 'None'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Location: {viewingRequest.city} ({viewingRequest.serviceArea})
                </p>
                <p className="text-slate-500 mt-1">Address: {viewingRequest.residentialAddress}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">KNC Licensing & Qualifications</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{viewingRequest.qualification}</p>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                  KNC Registration No: {viewingRequest.kncRegistrationNo}
                </p>
              </div>

              {viewingRequest.uploadedDocuments && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Uploaded Supporting Documents</span>
                  <div className="mt-2 space-y-1.5">
                    {viewingRequest.uploadedDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          {doc.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingRequest.rejectionReason && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Recorded Rejection Reason</span>
                  <p className="mt-1 font-semibold">{viewingRequest.rejectionReason}</p>
                  <p className="text-[10px] opacity-80 mt-1">
                    Reviewed by {viewingRequest.reviewedBy} on {viewingRequest.reviewedAt}
                  </p>
                </div>
              )}

              {viewingRequest.adminRemarks && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Admin Review Notes</span>
                  <p className="mt-1 font-semibold">{viewingRequest.adminRemarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingRequest(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION: APPROVE REQUEST */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!approvingRequest}
        onClose={() => setApprovingRequest(null)}
        onConfirm={handleApproveRequest}
        title={`Approve Nursing Application: ${approvingRequest?.fullName}`}
        message={`Confirm approval for candidate ${approvingRequest?.fullName} (${approvingRequest?.applicationId})? Upon confirmation, an active nursing provider record will be created and the nurse will be immediately eligible for home nursing booking assignments.`}
        confirmText="Confirm Approval"
        variant="primary"
      />

      {/* ========================================================================= */}
      {/* MODAL: REJECT REQUEST */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title={`Reject Application: ${rejectingRequest?.fullName}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Please enter a formal administrative rejection reason. This record will be permanently retained in the compliance archives.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. KNC registration expired, unverified nursing diploma..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setRejectingRequest(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRejectRequest}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: REQUEST ADDITIONAL INFO */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!requestingInfoRequest}
        onClose={() => setRequestingInfoRequest(null)}
        title={`Request Additional Info: ${requestingInfoRequest?.fullName}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Specify the missing or incomplete verification documents requested from the nurse applicant.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Required Documents / Clarification Notes *
            </label>
            <textarea
              required
              rows={3}
              value={infoRemarks}
              onChange={(e) => setInfoRemarks(e.target.value)}
              placeholder="e.g. Please upload certified copy of valid KNC renewal slip for 2026."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setRequestingInfoRequest(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRequestInfo} className="bg-amber-600 hover:bg-amber-700 text-white">
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* CONFIRMATION: DELETE PROVIDER */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!deleteProviderTarget}
        onClose={() => setDeleteProviderTarget(null)}
        onConfirm={handleConfirmDeleteProvider}
        title={`Delete Nursing Provider: ${deleteProviderTarget?.fullName}`}
        message={`Are you sure you want to permanently delete nursing provider ${deleteProviderTarget?.fullName} (${deleteProviderTarget?.providerId})? ${
          deleteProviderTarget?.completedVisitsCount > 0
            ? `WARNING: This nurse has ${deleteProviderTarget.completedVisitsCount} historical home visits on record. Deactivating the provider instead is strongly recommended to preserve clinical patient care history.`
            : 'This provider has no historical bookings and can be safely removed.'
        }`}
        confirmText="Confirm Delete"
        variant="danger"
      />

      {/* Assign Nurse Modal (for Tab 1) */}
      {selectedBooking && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign Certified Nurse: ${selectedBooking.bookingRef}`}
          subtitle={`${selectedBooking.serviceName} for ${selectedBooking.patientName}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAssignNurse}>
                Confirm Assignment
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <Select
              label="Select Nurse from Agency Roster"
              value={nurseName}
              onChange={(e) => setNurseName(e.target.value)}
              options={
                providersList.length > 0
                  ? providersList.map((p) => `${p.fullName} (${p.qualification} - ${p.kncRegistrationNo})`)
                  : [
                      'Sister Geetha Kumari (B.Sc Nursing - KNC-48192)',
                      'Sister Anita D’Souza (Critical Care Certified - KNC-39201)',
                      'Sister Shilpa R. (General Nursing - KNC-55102)',
                    ]
              }
            />
            <p className="text-slate-500">
              The assigned nurse will be dispatched with sterile dressing packs, infusion consumables, and clinical PPE.
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation (for Tab 1 Bookings) */}
      <ConfirmDialog
        isOpen={Boolean(deleteBookingTarget)}
        onClose={() => setDeleteBookingTarget(null)}
        onConfirm={handleDeleteBooking}
        title="Delete Home Nursing Booking"
        description={`Are you sure you want to delete nursing booking ${deleteBookingTarget?.bookingRef} (${deleteBookingTarget?.serviceName}) for patient ${deleteBookingTarget?.patientName}? This action cannot be undone.`}
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}
