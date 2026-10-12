'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  equipmentRentalsRepository,
  equipmentProvidersRepository,
} from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  PackageCheck,
  Building2,
  MapPin,
  Clock,
  Phone,
  Calendar,
  Eye,
  Trash2,
  Edit2,
  FileText,
  User,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Power,
  Search,
  Info,
} from 'lucide-react';

export default function EquipmentRentalsPage() {
  const { notify } = useNotification();
  const [activeModuleTab, setActiveModuleTab] = useState('bookings'); // 'bookings' | 'providers' | 'requests'

  // ==========================================
  // TAB 1: RENTAL BOOKINGS STATE
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [viewRental, setViewRental] = useState(null);
  const [statusRental, setStatusRental] = useState(null);
  const [rentalStatus, setRentalStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data,
    setData,
    paginatedData,
    totalRecords,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    cityFilter,
    setCityFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    resetFilters,
  } = useLocalFilters([], { defaultSortField: 'startDate', defaultSortDirection: 'desc' });

  // ==========================================
  // TAB 2: EQUIPMENT PROVIDERS DIRECTORY STATE
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
    providerName: '',
    contactPerson: '',
    mobileNumber: '',
    email: '',
    fullAddress: '',
    city: 'Mysuru',
    serviceArea: '',
    gstin: '',
    tradeLicenceNo: '',
    biomedicalCertification: 'ISO 13485:2016 Certified Bio-Medical Calibrations',
    categoriesOffered: 'Oxygen Concentrators, ICU Hospital Beds, Wheelchairs',
    availableEquipmentCount: '25',
    status: 'Active',
  };
  const [providerFormData, setProviderFormData] = useState(initialProviderForm);
  const [providerSubmitting, setProviderSubmitting] = useState(false);

  // ==========================================
  // TAB 3: SELF-REGISTRATION REQUESTS STATE
  // ==========================================
  const [equipmentRequests, setEquipmentRequests] = useState([]);
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
      setLoading(true);
      try {
        const [rentalsRes, provRes, reqRes] = await Promise.all([
          equipmentRentalsRepository.getAll(),
          equipmentProvidersRepository.getAll(),
          equipmentProvidersRepository.getRequests(),
        ]);
        setData(rentalsRes.data || []);
        setProvidersList(provRes.data || []);
        setEquipmentRequests(reqRes.data || []);
      } catch (err) {
        console.error('Failed to load equipment data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [setData]);

  // Tab 1 Handlers
  const handleUpdateStatus = async () => {
    if (!statusRental || !rentalStatus) return;
    const updated = await equipmentRentalsRepository.updateRentalStatus(statusRental.id, rentalStatus);
    setData(data.map((r) => (r.id === updated.id ? updated : r)));
    notify(`Rental ${updated.rentalRef} status updated to: ${rentalStatus}`, 'success');
    setStatusRental(null);
  };

  const handleDeleteRental = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await equipmentRentalsRepository.delete(deleteTarget.id);
      setData(data.filter((r) => r.id !== deleteTarget.id));
      notify(`Removed equipment rental record ${deleteTarget.rentalRef} (${deleteTarget.patientName})`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      notify('Failed to delete rental record.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportRentals = () => {
    exportToCSV('mediunify_equipment_rentals', data, [
      { header: 'Rental Ref', accessorKey: 'rentalRef' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Selected Equipment', accessorKey: 'equipmentName' },
      { header: 'Category', accessorKey: 'category' },
      { header: 'Duration (Days)', accessorKey: 'durationDays' },
      { header: 'Start Date', accessorKey: 'startDate' },
      { header: 'End Date', accessorKey: 'endDate' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Total Rental Amount', accessorKey: 'totalRentalAmount' },
    ]);
  };

  // Tab 2 Handlers: Provider Directory CRUD
  const filteredProviders = useMemo(() => {
    return providersList.filter((p) => {
      const matchSearch =
        providerSearch === '' ||
        p.providerName.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.providerId.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(providerSearch.toLowerCase()) ||
        (p.gstin && p.gstin.toLowerCase().includes(providerSearch.toLowerCase()));
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
      providerName: provider.providerName || '',
      contactPerson: provider.contactPerson || '',
      mobileNumber: provider.mobileNumber || '',
      email: provider.email || '',
      fullAddress: provider.fullAddress || '',
      city: provider.city || 'Mysuru',
      serviceArea: provider.serviceArea || '',
      gstin: provider.gstin || '',
      tradeLicenceNo: provider.tradeLicenceNo || '',
      biomedicalCertification: provider.biomedicalCertification || '',
      categoriesOffered: Array.isArray(provider.categoriesOffered)
        ? provider.categoriesOffered.join(', ')
        : provider.categoriesOffered || '',
      availableEquipmentCount: provider.availableEquipmentCount?.toString() || '20',
      status: provider.status || 'Active',
    });
    setIsRegisterProviderModalOpen(true);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    if (!providerFormData.providerName || !providerFormData.contactPerson || !providerFormData.mobileNumber) {
      notify('Please fill all mandatory fields (Provider Name, Contact Person, Mobile).', 'error');
      return;
    }

    setProviderSubmitting(true);
    try {
      if (editingProvider) {
        const updated = await equipmentProvidersRepository.update(editingProvider.id, providerFormData);
        setProvidersList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        notify(`Updated provider profile for ${updated.providerName}`, 'success');
      } else {
        const created = await equipmentProvidersRepository.create(providerFormData);
        setProvidersList((prev) => [created, ...prev]);
        notify(`Registered equipment provider: ${created.providerName} (${created.providerId})`, 'success');
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
        const updated = await equipmentProvidersRepository.deactivate(provider.id);
        setProvidersList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        notify(`Deactivated ${provider.providerName}. Equipment inventory unavailable for new bookings.`, 'warning');
      } else {
        const updated = await equipmentProvidersRepository.activate(provider.id);
        setProvidersList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        notify(`Activated ${provider.providerName}. Equipment inventory ready for rentals.`, 'success');
      }
    } catch (err) {
      notify('Failed to update status', 'error');
    }
  };

  const handleConfirmDeleteProvider = async () => {
    if (!deleteProviderTarget) return;
    try {
      await equipmentProvidersRepository.delete(deleteProviderTarget.id);
      setProvidersList((prev) => prev.filter((p) => p.id !== deleteProviderTarget.id));
      notify(`Removed equipment provider ${deleteProviderTarget.providerName} (${deleteProviderTarget.providerId})`, 'success');
    } catch (err) {
      notify(`Delete failed: ${err.message}`, 'error');
    } finally {
      setDeleteProviderTarget(null);
    }
  };

  // Tab 3 Handlers: Self-Registration Approvals
  const filteredRequests = useMemo(() => {
    return equipmentRequests.filter((r) => {
      const matchSearch =
        reqSearch === '' ||
        r.providerName.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.applicationId.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.contactPerson.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.mobileNumber.includes(reqSearch);
      const matchCity = reqCityFilter === 'All' || r.city === reqCityFilter;
      const matchStatus = reqStatusFilter === 'All' || r.status === reqStatusFilter;
      return matchSearch && matchCity && matchStatus;
    });
  }, [equipmentRequests, reqSearch, reqCityFilter, reqStatusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (reqPage - 1) * reqPageSize;
    return filteredRequests.slice(start, start + reqPageSize);
  }, [filteredRequests, reqPage, reqPageSize]);

  const pendingRequestsCount = useMemo(() => {
    return equipmentRequests.filter((r) => r.status === 'Pending Review').length;
  }, [equipmentRequests]);

  const handleApproveRequest = async () => {
    if (!approvingRequest) return;
    try {
      const res = await equipmentProvidersRepository.approveRequest(approvingRequest.id);
      setEquipmentRequests((prev) => prev.map((r) => (r.id === res.request.id ? res.request : r)));
      setProvidersList((prev) => {
        const exists = prev.some((p) => p.id === res.provider.id);
        if (exists) return prev.map((p) => (p.id === res.provider.id ? res.provider : p));
        return [res.provider, ...prev];
      });
      notify(`Approved ${approvingRequest.providerName}. Added to active equipment provider directory!`, 'success');
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
      const updated = await equipmentProvidersRepository.rejectRequest(rejectingRequest.id, rejectionReason);
      setEquipmentRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
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
      const updated = await equipmentProvidersRepository.requestAdditionalInfo(requestingInfoRequest.id, infoRemarks);
      setEquipmentRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      notify(`Additional information requested from ${requestingInfoRequest.providerName}.`, 'success');
    } catch (err) {
      notify(`Failed to update: ${err.message}`, 'error');
    } finally {
      setRequestingInfoRequest(null);
      setInfoRemarks('');
    }
  };

  // Columns for Rentals Table
  const rentalColumns = [
    {
      header: 'Rental Ref & Equipment',
      accessorKey: 'rentalRef',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.rentalRef}
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 line-clamp-1" title={row.equipmentName}>
            {row.equipmentName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold text-slate-500">{row.category}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] text-teal-600 font-mono font-medium">{row.durationDays} Days Tenure</span>
          </div>
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
      header: 'City & Delivery Address',
      accessorKey: 'city',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
            {row.city}
          </div>
          <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[180px]" title={row.deliveryAddress}>
            {row.deliveryAddress}
          </p>
        </div>
      ),
    },
    {
      header: 'Tenure & Cost',
      accessorKey: 'startDate',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
            {formatCurrency(row.totalRentalAmount)}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {row.startDate} to {row.endDate}
          </p>
        </div>
      ),
    },
    {
      header: 'Rental Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.status === 'Active On-Site'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : row.status === 'Dispatched'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewRental(row)}
            className="text-xs h-7 px-2"
          >
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusRental(row);
              setRentalStatus(row.status);
            }}
            className="text-xs h-7 px-2"
          >
            Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Rental Record"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[11px] font-bold border border-teal-300/30">
              Home Medical Devices & Assistive Assets
            </span>
            <span className="text-xs text-slate-300">Biomedical Asset Operations</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <PackageCheck className="w-7 h-7 text-teal-400" />
            Medical Equipment Rental Management
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl">
            Oxygen concentrators, motorized ICU beds, BiPAP/CPAP, and wheelchair rental orders. Empanel authorized biomedical device providers and inspect self-registration requests.
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
            Add Equipment Provider
          </Button>
        </div>
      </div>

      {/* Strict Earnings Restriction Info Card */}
      <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-start gap-3 text-xs text-teal-900 dark:text-teal-200">
        <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Asset Availability & Provider Verification Governance</p>
          <p className="mt-0.5 opacity-90">
            Equipment rental management is strictly focused on provider verification, GSTIN and biomedical calibration compliance, inventory capacity, and patient delivery logistics. As per MediUnify platform specifications, no earnings, commissions, monthly revenue dashboards, or payout buttons are implemented for equipment providers.
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
          Rental Bookings & Orders
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {data.length}
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
          <Building2 className="w-4 h-4" />
          Equipment Providers & Vendors
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
          Pending Provider Registrations
          {pendingRequestsCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold animate-pulse">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RENTAL BOOKINGS */}
      {/* ========================================================================= */}
      {activeModuleTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search rental by ref, equipment, patient, serial..."
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={['Booked & Awaiting Delivery', 'Dispatched', 'Active On-Site', 'Returned & Inspected']}
            cityFilter={cityFilter}
            onCityChange={setCityFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categoryOptions={['Oxygen', 'Hospital Beds', 'Mobility', 'Respiratory Care', 'Patient Monitoring']}
            onExport={handleExportRentals}
            onReset={resetFilters}
          />

          <DataTable
            columns={rentalColumns}
            data={paginatedData}
            isLoading={loading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field) => {
              setSortField(field);
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            }}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalRecords}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EQUIPMENT PROVIDERS DIRECTORY */}
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
                  placeholder="Search provider business name, ID, contact, GSTIN..."
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
                    <th className="py-3 px-4">Provider Agency & ID</th>
                    <th className="py-3 px-4">Categories & Calibration</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">City & Coverage Area</th>
                    <th className="py-3 px-4">Inventory & Active</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedProviders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No equipment providers found matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedProviders.map((provider) => (
                      <tr
                        key={provider.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {provider.providerName}
                            </p>
                            <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                              {provider.providerId}
                            </span>
                            {provider.gstin && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">GSTIN: {provider.gstin}</p>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                            {Array.isArray(provider.categoriesOffered)
                              ? provider.categoriesOffered.join(', ')
                              : provider.categoriesOffered}
                          </p>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                            {provider.biomedicalCertification}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{provider.contactPerson}</p>
                          <p className="text-[11px] text-slate-400">{provider.mobileNumber}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {provider.city}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[180px] truncate" title={provider.serviceArea}>
                            {provider.serviceArea}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {provider.availableEquipmentCount} Units
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {provider.activeRentalsCount || 0} currently on-site
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
                              title="Edit Provider"
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleProviderStatus(provider)}
                              title={provider.status === 'Active' ? 'Deactivate Provider' : 'Activate Provider'}
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
                  placeholder="Search application ID, provider name, contact person..."
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
                    <th className="py-3 px-4">Application ID & Agency</th>
                    <th className="py-3 px-4">GSTIN & Trade Licence</th>
                    <th className="py-3 px-4">Contact Person</th>
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
                        No equipment provider self-registration applications found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {req.providerName}
                            </p>
                            <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              {req.applicationId}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{req.gstin || 'GST Pending'}</p>
                          <span className="text-[10px] text-slate-400">Licence: {req.tradeLicenceNo || 'N/A'}</span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{req.contactPerson}</p>
                          <p className="text-[11px] text-slate-400">{req.mobileNumber}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {req.city}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[180px] truncate" title={req.serviceArea}>
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
      {/* MODAL: ADD / EDIT EQUIPMENT PROVIDER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRegisterProviderModalOpen}
        onClose={() => setIsRegisterProviderModalOpen(false)}
        title={editingProvider ? `Edit Provider: ${editingProvider.providerName}` : 'Register New Equipment Provider'}
        size="lg"
      >
        <form onSubmit={handleSaveProvider} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Provider / Agency Business Name *
              </label>
              <Input
                required
                value={providerFormData.providerName}
                onChange={(e) => setProviderFormData({ ...providerFormData, providerName: e.target.value })}
                placeholder="e.g. MedPulse Bio-Equip Solutions Pvt Ltd"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person *
              </label>
              <Input
                required
                value={providerFormData.contactPerson}
                onChange={(e) => setProviderFormData({ ...providerFormData, contactPerson: e.target.value })}
                placeholder="e.g. Sanjay Kumar (Operations Director)"
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
                placeholder="+91 97414 XXXXX"
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
                placeholder="support@agency.com"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Service Area / Coverage Belt *
              </label>
              <Input
                required
                value={providerFormData.serviceArea}
                onChange={(e) => setProviderFormData({ ...providerFormData, serviceArea: e.target.value })}
                placeholder="e.g. Mysuru Urban & Kuvempunagar"
                className="text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Physical Address *
              </label>
              <Input
                required
                value={providerFormData.fullAddress}
                onChange={(e) => setProviderFormData({ ...providerFormData, fullAddress: e.target.value })}
                placeholder="Industrial warehouse address with pincode"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN Registration Number
              </label>
              <Input
                value={providerFormData.gstin}
                onChange={(e) => setProviderFormData({ ...providerFormData, gstin: e.target.value })}
                placeholder="29AABCM1920D1Z2"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Trade Licence Number
              </label>
              <Input
                value={providerFormData.tradeLicenceNo}
                onChange={(e) => setProviderFormData({ ...providerFormData, tradeLicenceNo: e.target.value })}
                placeholder="MCC/TL/2021/88129"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Available Equipment Units in Inventory
              </label>
              <Input
                type="number"
                value={providerFormData.availableEquipmentCount}
                onChange={(e) => setProviderFormData({ ...providerFormData, availableEquipmentCount: e.target.value })}
                placeholder="25"
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
                <option value="Active">Active (Inventory Available)</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Equipment Categories Offered (Comma-separated)
              </label>
              <Input
                value={providerFormData.categoriesOffered}
                onChange={(e) => setProviderFormData({ ...providerFormData, categoriesOffered: e.target.value })}
                placeholder="Oxygen Concentrators, Motorized Hospital Beds, BiPAP, Wheelchairs"
                className="text-xs"
              />
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
      {/* MODAL: VIEW EQUIPMENT PROVIDER DETAILS */}
      {/* ========================================================================= */}
      {viewingProvider && (
        <Modal
          isOpen={!!viewingProvider}
          onClose={() => setViewingProvider(null)}
          title={`Provider Profile: ${viewingProvider.providerName} (${viewingProvider.providerId})`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {viewingProvider.providerName}
              </h3>
              <p className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                ID: {viewingProvider.providerId} • GSTIN: {viewingProvider.gstin || 'None'}
              </p>
              <p className="text-xs text-slate-500">Contact Person: <span className="font-semibold">{viewingProvider.contactPerson}</span></p>
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
                <span className="text-[10px] text-slate-400 font-bold uppercase">Warehouse Address</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingProvider.fullAddress}, {viewingProvider.city}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Coverage: {viewingProvider.serviceArea}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Biomedical Certification</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{viewingProvider.biomedicalCertification}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Available Categories</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {Array.isArray(viewingProvider.categoriesOffered) ? viewingProvider.categoriesOffered.join(', ') : viewingProvider.categoriesOffered}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Inventory: {viewingProvider.availableEquipmentCount} Units ({viewingProvider.activeRentalsCount || 0} rented)</p>
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
          title={`Equipment Provider Application: ${viewingRequest.providerName}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {viewingRequest.providerName}
              </h3>
              <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                Application ID: {viewingRequest.applicationId}
              </p>
              <p className="text-xs text-slate-500">Submitted on: {viewingRequest.submissionDate}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Business Details</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  Contact: {viewingRequest.contactPerson} ({viewingRequest.mobileNumber})
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Location: {viewingRequest.city} — {viewingRequest.fullAddress}
                </p>
                <p className="text-slate-500 mt-1">GSTIN: {viewingRequest.gstin || 'None'} | Licence: {viewingRequest.tradeLicenceNo || 'N/A'}</p>
              </div>

              {viewingRequest.uploadedDocuments && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Uploaded Compliance Documents</span>
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
        title={`Approve Equipment Provider: ${approvingRequest?.providerName}`}
        message={`Confirm approval for ${approvingRequest?.providerName} (${approvingRequest?.applicationId})? Upon confirmation, the provider will be added to the Equipment Providers directory with city-wise visibility rules applied.`}
        confirmText="Confirm Approval"
        variant="primary"
      />

      {/* ========================================================================= */}
      {/* MODAL: REJECT REQUEST */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title={`Reject Application: ${rejectingRequest?.providerName}`}
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
              placeholder="e.g. Unverified calibration, expired municipal trade licence..."
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
        title={`Request Additional Info: ${requestingInfoRequest?.providerName}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Specify the missing or incomplete verification documents requested from the equipment vendor.
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
              placeholder="e.g. Please upload bio-medical equipment oxygen purity test report."
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
        title={`Delete Equipment Provider: ${deleteProviderTarget?.providerName}`}
        message={`Are you sure you want to permanently delete equipment provider ${deleteProviderTarget?.providerName} (${deleteProviderTarget?.providerId})? ${
          deleteProviderTarget?.activeRentalsCount > 0
            ? `WARNING: This provider has ${deleteProviderTarget.activeRentalsCount} active rentals currently on-site. Deactivating the provider instead is strongly recommended to preserve rental tracking records.`
            : 'This provider has no active on-site rentals and can be safely removed.'
        }`}
        confirmText="Confirm Delete"
        variant="danger"
      />

      {/* ========================================================================= */}
      {/* MODAL: VIEW RENTAL DETAILS (FROM TAB 1) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(viewRental)}
        onClose={() => setViewRental(null)}
        title={`Equipment Rental Booking: ${viewRental?.rentalRef}`}
        subtitle={`Patient: ${viewRental?.patientName} | Booked on ${viewRental?.bookingDate || viewRental?.startDate}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-xs text-slate-400">
              Asset Serial: <strong className="text-slate-700 dark:text-slate-300">{viewRental?.assetSerialNo || 'Standard Fleet'}</strong>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewRental(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                onClick={() => {
                  const target = viewRental;
                  setViewRental(null);
                  setStatusRental(target);
                  setRentalStatus(target.status);
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        }
      >
        {viewRental && (
          <div className="space-y-4 text-xs">
            {/* Patient Information Section */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  Patient Profile & Contact
                </span>
                <span className="font-mono text-teal-600 font-bold">
                  {viewRental.uhid || viewRental.patientId}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {viewRental.patientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewRental.patientPhone || '—'}
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-slate-400 block text-[10px]">Delivery / Service Address</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {viewRental.deliveryAddress}, {viewRental.city}
                </span>
              </div>
            </div>

            {/* Equipment Details Section */}
            <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800 space-y-2">
              <div className="flex items-center justify-between border-b pb-2 border-teal-200/60 dark:border-teal-800">
                <span className="font-bold text-teal-900 dark:text-teal-200 uppercase text-[10px] tracking-wider">
                  Selected Medical Equipment
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                  {viewRental.category}
                </span>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {viewRental.equipmentName}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tenure</span>
                  <span className="font-bold">{viewRental.durationDays} Days</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Daily Rate</span>
                  <span className="font-semibold">{formatCurrency(viewRental.dailyRate || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Security Deposit</span>
                  <span className="font-semibold">{formatCurrency(viewRental.securityDeposit || 0)}</span>
                </div>
              </div>
            </div>

            {/* Schedule & Payment Status */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Tenure Dates</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewRental.startDate} to {viewRental.endDate}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Booked on: {viewRental.bookingDate || viewRental.startDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Booking & Payment Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={viewRental.status === 'Active On-Site' ? 'success' : 'primary'}>
                    {viewRental.status}
                  </Badge>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                  {viewRental.paymentStatus || 'Paid in Full'}
                </span>
              </div>
            </div>

            {/* Patient Provided Notes / Documents */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">
                Patient Documents / Clinical Notes
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic text-[11px]">
                {viewRental.patientNotes || 'No specific doctor prescription or delivery instructions uploaded.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* UPDATE STATUS MODAL (FOR TAB 1) */}
      <Modal
        isOpen={Boolean(statusRental)}
        onClose={() => setStatusRental(null)}
        title="Update Equipment Rental Stage"
        subtitle={`Rental Ref: ${statusRental?.rentalRef}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setStatusRental(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateStatus}>
              Save Status
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-xs">
          <Select
            label="Rental Stage / Booking Status"
            value={rentalStatus}
            onChange={(e) => setRentalStatus(e.target.value)}
            options={[
              'Booked & Awaiting Delivery',
              'Dispatched',
              'Active On-Site',
              'Returned & Inspected',
              'Cancelled',
            ]}
          />
        </div>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG (FOR TAB 1) */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRental}
        isLoading={isDeleting}
        title="Delete Equipment Rental Record"
        description={`Are you sure you want to delete rental record ${deleteTarget?.rentalRef} for patient ${deleteTarget?.patientName} (${deleteTarget?.equipmentName})? This action cannot be undone.`}
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}
