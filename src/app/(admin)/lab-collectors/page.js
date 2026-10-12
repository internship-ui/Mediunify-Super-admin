'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { labCollectorsRepository } from '@/services/repositories';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { exportToCSV } from '@/services/exportService';
import { useNotification } from '@/providers/AppProviders';
import {
  FlaskConical,
  TestTube2,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Search,
  Check,
  Clock,
  Award,
  Info,
} from 'lucide-react';

export default function LabCollectorsPage() {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'requests'
  const [loading, setLoading] = useState(true);

  // Data states
  const [collectorsList, setCollectorsList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);

  // Filters for Directory
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters for Requests
  const [reqSearch, setReqSearch] = useState('');
  const [reqCityFilter, setReqCityFilter] = useState('All');
  const [reqStatusFilter, setReqStatusFilter] = useState('All');
  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingCollector, setEditingCollector] = useState(null);
  const [viewingCollector, setViewingCollector] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Requests Modal states
  const [viewingRequest, setViewingRequest] = useState(null);
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestingInfoRequest, setRequestingInfoRequest] = useState(null);
  const [infoRemarks, setInfoRemarks] = useState('');

  // Form State
  const initialFormState = {
    fullName: '',
    badgeTitle: 'Field Phlebotomist',
    mobileNumber: '',
    email: '',
    residentialAddress: '',
    city: 'Mysuru',
    collectionServiceArea: '',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    qualification: 'Diploma in Medical Laboratory Technology (DMLT)',
    experienceYears: '3',
    certifiedPhlebotomist: true,
    affiliatedCenterName: 'Unnathi Central Diagnostic Laboratory',
    status: 'Active',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [colRes, reqRes] = await Promise.all([
        labCollectorsRepository.getAll(),
        labCollectorsRepository.getRequests(),
      ]);
      setCollectorsList(colRes.data || []);
      setRequestsList(reqRes.data || []);
    } catch (err) {
      console.error('Failed to load lab collectors:', err);
      notify('Failed to load lab test collector records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Directory Data
  const filteredCollectors = useMemo(() => {
    return collectorsList.filter((c) => {
      const matchesSearch =
        search === '' ||
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.collectorId.toLowerCase().includes(search.toLowerCase()) ||
        c.mobileNumber.includes(search) ||
        c.qualification.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === 'All' || c.city === cityFilter;
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [collectorsList, search, cityFilter, statusFilter]);

  const paginatedCollectors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCollectors.slice(start, start + pageSize);
  }, [filteredCollectors, page, pageSize]);

  // Filtered Requests Data
  const filteredRequests = useMemo(() => {
    return requestsList.filter((r) => {
      const matchesSearch =
        reqSearch === '' ||
        r.fullName.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.applicationId.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.mobileNumber.includes(reqSearch);
      const matchesCity = reqCityFilter === 'All' || r.city === reqCityFilter;
      const matchesStatus = reqStatusFilter === 'All' || r.status === reqStatusFilter;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [requestsList, reqSearch, reqCityFilter, reqStatusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (reqPage - 1) * reqPageSize;
    return filteredRequests.slice(start, start + reqPageSize);
  }, [filteredRequests, reqPage, reqPageSize]);

  const pendingRequestsCount = useMemo(() => {
    return requestsList.filter((r) => r.status === 'Pending Review').length;
  }, [requestsList]);

  // Handlers for Collector CRUD
  const handleOpenRegister = () => {
    setEditingCollector(null);
    setFormData(initialFormState);
    setIsRegisterModalOpen(true);
  };

  const handleOpenEdit = (collector) => {
    setEditingCollector(collector);
    setFormData({
      fullName: collector.fullName || '',
      badgeTitle: collector.badgeTitle || 'Field Phlebotomist',
      mobileNumber: collector.mobileNumber || '',
      email: collector.email || '',
      residentialAddress: collector.residentialAddress || '',
      city: collector.city || 'Mysuru',
      collectionServiceArea: collector.collectionServiceArea || '',
      idProofType: collector.idProofType || 'Aadhaar Card',
      idProofNumber: collector.idProofNumber || '',
      qualification: collector.qualification || '',
      experienceYears: collector.experienceYears?.toString() || '3',
      certifiedPhlebotomist: collector.certifiedPhlebotomist !== undefined ? collector.certifiedPhlebotomist : true,
      affiliatedCenterName: collector.affiliatedCenterName || '',
      status: collector.status || 'Active',
    });
    setIsRegisterModalOpen(true);
  };

  const handleSaveCollector = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.qualification) {
      notify('Please fill all mandatory fields (Name, Mobile, Qualifications).', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingCollector) {
        const updated = await labCollectorsRepository.update(editingCollector.id, formData);
        setCollectorsList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        notify(`Updated collector profile for ${updated.fullName}`, 'success');
      } else {
        const created = await labCollectorsRepository.create(formData);
        setCollectorsList((prev) => [created, ...prev]);
        notify(`Registered lab test collector: ${created.fullName} (${created.collectorId})`, 'success');
      }
      setIsRegisterModalOpen(false);
    } catch (err) {
      notify(err.message || 'Operation failed', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (collector) => {
    try {
      if (collector.status === 'Active') {
        const updated = await labCollectorsRepository.deactivate(collector.id);
        setCollectorsList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        notify(`Deactivated ${collector.fullName}. Phlebotomist unavailable for sample collections.`, 'warning');
      } else {
        const updated = await labCollectorsRepository.activate(collector.id);
        setCollectorsList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        notify(`Activated ${collector.fullName}. Available for lab sample collection tasks.`, 'success');
      }
    } catch (err) {
      notify('Failed to update status', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await labCollectorsRepository.delete(deleteTarget.id);
      setCollectorsList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      notify(`Removed lab test collector ${deleteTarget.fullName} (${deleteTarget.collectorId})`, 'success');
    } catch (err) {
      notify(`Delete failed: ${err.message}`, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Handlers for Request Approvals
  const handleApprove = async () => {
    if (!approvingRequest) return;
    try {
      const res = await labCollectorsRepository.approveRequest(approvingRequest.id);
      setRequestsList((prev) => prev.map((r) => (r.id === res.request.id ? res.request : r)));
      setCollectorsList((prev) => {
        const exists = prev.some((c) => c.id === res.collector.id);
        if (exists) return prev.map((c) => (c.id === res.collector.id ? res.collector : c));
        return [res.collector, ...prev];
      });
      notify(`Approved ${approvingRequest.fullName}. Added to active lab test collectors!`, 'success');
    } catch (err) {
      notify(`Approval failed: ${err.message}`, 'error');
    } finally {
      setApprovingRequest(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingRequest || !rejectionReason.trim()) {
      notify('Please enter a rejection reason.', 'error');
      return;
    }
    try {
      const updated = await labCollectorsRepository.rejectRequest(rejectingRequest.id, rejectionReason);
      setRequestsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
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
      const updated = await labCollectorsRepository.requestAdditionalInfo(requestingInfoRequest.id, infoRemarks);
      setRequestsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      notify(`Additional info requested from ${requestingInfoRequest.fullName}.`, 'success');
    } catch (err) {
      notify(`Failed to update: ${err.message}`, 'error');
    } finally {
      setRequestingInfoRequest(null);
      setInfoRemarks('');
    }
  };

  const handleExportCollectors = () => {
    exportToCSV('lab_test_collectors_directory', filteredCollectors, [
      { header: 'Collector ID', accessorKey: 'collectorId' },
      { header: 'Full Name', accessorKey: 'fullName' },
      { header: 'Mobile Number', accessorKey: 'mobileNumber' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Collection Area', accessorKey: 'collectionServiceArea' },
      { header: 'Qualification', accessorKey: 'qualification' },
      { header: 'Experience (Years)', accessorKey: 'experienceYears' },
      { header: 'Affiliated Lab', accessorKey: 'affiliatedCenterName' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Completed Collections', accessorKey: 'completedCollectionsCount' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 text-[11px] font-bold border border-blue-300/30">
              Pathology & Diagnostic Field Staff
            </span>
            <span className="text-xs text-slate-300">Independent Phlebotomy Operations</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <TestTube2 className="w-7 h-7 text-blue-400" />
            Lab Test Collector Management
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl">
            Register certified phlebotomists, verify DMLT/MLT credentials, and assign doorstep blood and urine sample collections. Independent from pharmacy fleet operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/lab-tests">
            <Button
              variant="outline"
              size="sm"
              icon={FlaskConical}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
            >
              Lab Test Bookings
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenRegister}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20"
          >
            Register Lab Collector
          </Button>
        </div>
      </div>

      {/* Operational Policy Banner (Strict Earnings Restriction) */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Strict Clinical Operational Isolation Policy</p>
          <p className="mt-0.5 opacity-90">
            Lab Test Collectors are governed exclusively for home sample collections, cold-chain transport, and barcode specimen tracking. As per platform architecture, lab collectors do not have delivery earnings, salary balances, or payout records and do not appear in the Pharmacy Delivery Boy Earnings & Payouts module.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TestTube2 className="w-4 h-4" />
          Active Lab Collectors Directory
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {collectorsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Collector Self-Registrations
          {pendingRequestsCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold animate-pulse">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE LAB COLLECTORS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              <div className="relative min-w-[260px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by Phlebotomist name, LTC ID, phone, qualifications..."
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="w-40">
                <Select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setPage(1);
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
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
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

            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={handleExportCollectors}
              className="text-xs shrink-0"
            >
              Export CSV
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Collector & ID</th>
                    <th className="py-3 px-4">Qualifications & Experience</th>
                    <th className="py-3 px-4">Contact & Mobile</th>
                    <th className="py-3 px-4">City & Collection Hub</th>
                    <th className="py-3 px-4">Affiliated Lab Center</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedCollectors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No lab test collectors found matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedCollectors.map((collector) => (
                      <tr
                        key={collector.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={collector.profilePhoto}
                              alt={collector.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {collector.fullName}
                              </p>
                              <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                {collector.collectorId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {collector.qualification}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {collector.experienceYears} Years Exp • {collector.completedCollectionsCount} samples drawn
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{collector.mobileNumber}</p>
                          <p className="text-[11px] text-slate-400">{collector.email || 'No email'}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            {collector.city}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[200px] truncate" title={collector.collectionServiceArea}>
                            {collector.collectionServiceArea}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {collector.affiliatedCenterName}
                          </p>
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 ${
                              collector.registrationSource === 'Self Registered'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {collector.registrationSource}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={collector.status === 'Active' ? 'success' : 'neutral'}>
                            {collector.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingCollector(collector)}
                              title="View Details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(collector)}
                              title="Edit Collector"
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(collector)}
                              title={collector.status === 'Active' ? 'Deactivate Collector' : 'Activate Collector'}
                              className={`p-1.5 rounded-lg ${
                                collector.status === 'Active'
                                  ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                  : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(collector)}
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
                currentPage={page}
                totalRecords={filteredCollectors.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENDING COLLECTOR SELF-REGISTRATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
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
                  placeholder="Search application ID, applicant name, mobile..."
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

          {/* Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Application ID & Candidate</th>
                    <th className="py-3 px-4">Qualification & Institution</th>
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
                        No collector self-registration applications found.
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
                          <p className="text-[11px] text-slate-400">{req.experienceYears} Years Field Experience</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{req.mobileNumber}</p>
                          <p className="text-[11px] text-slate-400">{req.email || 'No email'}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            {req.city}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[200px] truncate" title={req.collectionServiceArea}>
                            {req.collectionServiceArea}
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
      {/* MODAL: REGISTER / EDIT LAB COLLECTOR */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={editingCollector ? `Edit Collector: ${editingCollector.fullName}` : 'Register New Lab Test Collector'}
        size="lg"
      >
        <form onSubmit={handleSaveCollector} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <Input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Raghavendra K."
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number *
              </label>
              <Input
                required
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+91 97412 XXXXX"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="phlebo@mediunify.org"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                City *
              </label>
              <Select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                Collection Service Area / Coverage Zone *
              </label>
              <Input
                required
                value={formData.collectionServiceArea}
                onChange={(e) => setFormData({ ...formData, collectionServiceArea: e.target.value })}
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
                value={formData.residentialAddress}
                onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
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
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g. Diploma in Medical Lab Technology (DMLT)"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Field Experience (Years)
              </label>
              <Input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                placeholder="3"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Affiliated Diagnostic Laboratory Hub
              </label>
              <Input
                value={formData.affiliatedCenterName}
                onChange={(e) => setFormData({ ...formData, affiliatedCenterName: e.target.value })}
                placeholder="Unnathi Central Diagnostic Laboratory"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="text-xs"
              >
                <option value="Active">Active (Ready for Assignments)</option>
                <option value="Inactive">Inactive (Off-Duty / Leave)</option>
                <option value="Suspended">Suspended</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={formSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingCollector ? 'Save Changes' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VIEW LAB COLLECTOR DETAILS */}
      {/* ========================================================================= */}
      {viewingCollector && (
        <Modal
          isOpen={!!viewingCollector}
          onClose={() => setViewingCollector(null)}
          title={`Collector Profile: ${viewingCollector.fullName} (${viewingCollector.collectorId})`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={viewingCollector.profilePhoto}
                alt={viewingCollector.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md"
              />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {viewingCollector.fullName}
                </h3>
                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  Collector ID: {viewingCollector.collectorId}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Designation: <span className="font-semibold">{viewingCollector.badgeTitle}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingCollector.mobileNumber}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Email</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingCollector.email || 'None'}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Qualifications & Credentials</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingCollector.qualification}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{viewingCollector.experienceYears} Years Verified Phlebotomy Experience</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Collection Hub & Diagnostic Centre</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingCollector.city} — {viewingCollector.collectionServiceArea}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Affiliated Lab: {viewingCollector.affiliatedCenterName}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Operational History</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingCollector.completedCollectionsCount} Completed Collections | {viewingCollector.activeAssignedTasksCount} Active Tasks
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingCollector(null)}>
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
          title={`Collector Application: ${viewingRequest.fullName}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={viewingRequest.profilePhoto}
                alt={viewingRequest.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md"
              />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {viewingRequest.fullName}
                </h3>
                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  Application ID: {viewingRequest.applicationId}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Submitted on: {viewingRequest.submissionDate}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Candidate Overview</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  Mobile: {viewingRequest.mobileNumber} | Email: {viewingRequest.email || 'None'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Location: {viewingRequest.city} ({viewingRequest.collectionServiceArea})
                </p>
                <p className="text-slate-500 mt-1">Address: {viewingRequest.residentialAddress}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Qualifications & Background</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{viewingRequest.qualification}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Experience: {viewingRequest.experienceYears} Years | Target Lab: {viewingRequest.affiliatedCenterName}
                </p>
              </div>

              {viewingRequest.uploadedDocuments && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Uploaded Supporting Documents</span>
                  <div className="mt-2 space-y-1.5">
                    {viewingRequest.uploadedDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          {doc.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
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
        onConfirm={handleApprove}
        title={`Approve Lab Collector Application: ${approvingRequest?.fullName}`}
        message={`Confirm approval for candidate ${approvingRequest?.fullName} (${approvingRequest?.applicationId})? Upon confirmation, a new certified collector record will be added to the Lab Test Collector Directory and the phlebotomist will be eligible for doorstep blood sample collection tasks.`}
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
              placeholder="e.g. Failed statutory DMLT credential check, unverified clinical internship..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setRejectingRequest(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReject}>
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
            Specify the missing or incomplete verification documents requested from the phlebotomist candidate.
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
              placeholder="e.g. Please upload certified copy of DMLT registration and signed letter from previous pathology lab."
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
      {/* CONFIRMATION: DELETE COLLECTOR RECORD */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Lab Collector: ${deleteTarget?.fullName}`}
        message={`Are you sure you want to permanently delete collector ${deleteTarget?.fullName} (${deleteTarget?.collectorId})? ${
          deleteTarget?.completedCollectionsCount > 0
            ? `WARNING: This phlebotomist has ${deleteTarget.completedCollectionsCount} completed historical sample collections. Deactivating the collector profile instead is strongly recommended to preserve historical patient diagnostic records.`
            : 'This collector has no historical assignments and can be safely removed.'
        }`}
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}
