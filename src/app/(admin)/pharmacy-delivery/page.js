'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { deliveryStaffRepository } from '@/services/repositories';
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
  Truck,
  Bike,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  User,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Search,
  Check,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function PharmacyDeliveryPage() {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'requests'
  const [loading, setLoading] = useState(true);

  // Data states
  const [staffList, setStaffList] = useState([]);
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
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
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
    mobileNumber: '',
    email: '',
    residentialAddress: '',
    city: 'Mysuru',
    serviceArea: '',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    drivingLicenceNumber: '',
    licenceExpiry: '',
    vehicleType: 'Motorcycle',
    vehicleRegNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    assignedStoreName: 'MediUnify Central Hub',
    status: 'Active',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, requestsRes] = await Promise.all([
        deliveryStaffRepository.getAll(),
        deliveryStaffRepository.getRequests(),
      ]);
      setStaffList(staffRes.data || []);
      setRequestsList(requestsRes.data || []);
    } catch (err) {
      console.error('Failed to load pharmacy delivery staff:', err);
      notify('Failed to load pharmacy delivery records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Directory Data
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        search === '' ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.staffId.toLowerCase().includes(search.toLowerCase()) ||
        s.mobileNumber.includes(search) ||
        (s.vehicleRegNumber && s.vehicleRegNumber.toLowerCase().includes(search.toLowerCase()));
      const matchesCity = cityFilter === 'All' || s.city === cityFilter;
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [staffList, search, cityFilter, statusFilter]);

  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, page, pageSize]);

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

  // Handlers for Staff CRUD
  const handleOpenRegister = () => {
    setEditingStaff(null);
    setFormData(initialFormState);
    setIsRegisterModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName || '',
      mobileNumber: staff.mobileNumber || '',
      email: staff.email || '',
      residentialAddress: staff.residentialAddress || '',
      city: staff.city || 'Mysuru',
      serviceArea: staff.serviceArea || '',
      idProofType: staff.idProofType || 'Aadhaar Card',
      idProofNumber: staff.idProofNumber || '',
      drivingLicenceNumber: staff.drivingLicenceNumber || '',
      licenceExpiry: staff.licenceExpiry || '',
      vehicleType: staff.vehicleType || 'Motorcycle',
      vehicleRegNumber: staff.vehicleRegNumber || '',
      emergencyContactName: staff.emergencyContactName || '',
      emergencyContactPhone: staff.emergencyContactPhone || '',
      assignedStoreName: staff.assignedStoreName || 'MediUnify Central Hub',
      status: staff.status || 'Active',
    });
    setIsRegisterModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.drivingLicenceNumber) {
      notify('Please fill all mandatory fields (Name, Mobile, Driving Licence).', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingStaff) {
        const updated = await deliveryStaffRepository.update(editingStaff.id, formData);
        setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        notify(`Updated delivery staff profile for ${updated.fullName}`, 'success');
      } else {
        const created = await deliveryStaffRepository.create(formData);
        setStaffList((prev) => [created, ...prev]);
        notify(`Registered pharmacy delivery boy: ${created.fullName} (${created.staffId})`, 'success');
      }
      setIsRegisterModalOpen(false);
    } catch (err) {
      notify(err.message || 'Operation failed', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      if (staff.status === 'Active') {
        const updated = await deliveryStaffRepository.deactivate(staff.id);
        setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        notify(`Deactivated ${staff.fullName}. Provider cannot receive new dispatches.`, 'warning');
      } else {
        const updated = await deliveryStaffRepository.activate(staff.id);
        setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        notify(`Activated ${staff.fullName}. Available for pharmacy dispatch assignments.`, 'success');
      }
    } catch (err) {
      notify('Failed to update status', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deliveryStaffRepository.delete(deleteTarget.id);
      setStaffList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      notify(`Removed delivery staff record ${deleteTarget.fullName} (${deleteTarget.staffId})`, 'success');
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
      const res = await deliveryStaffRepository.approveRequest(approvingRequest.id);
      setRequestsList((prev) => prev.map((r) => (r.id === res.request.id ? res.request : r)));
      // Add or refresh in staffList
      setStaffList((prev) => {
        const exists = prev.some((s) => s.id === res.staff.id);
        if (exists) return prev.map((s) => (s.id === res.staff.id ? res.staff : s));
        return [res.staff, ...prev];
      });
      notify(`Approved ${approvingRequest.fullName}. Added to active pharmacy delivery staff!`, 'success');
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
      const updated = await deliveryStaffRepository.rejectRequest(rejectingRequest.id, rejectionReason);
      setRequestsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      notify(`Application ${rejectingRequest.applicationId} rejected. Retained in compliance archive.`, 'warning');
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
      const updated = await deliveryStaffRepository.requestAdditionalInfo(requestingInfoRequest.id, infoRemarks);
      setRequestsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      notify(`Additional information requested from ${requestingInfoRequest.fullName}.`, 'success');
    } catch (err) {
      notify(`Failed to update: ${err.message}`, 'error');
    } finally {
      setRequestingInfoRequest(null);
      setInfoRemarks('');
    }
  };

  const handleExportStaff = () => {
    exportToCSV('pharmacy_delivery_staff_directory', filteredStaff, [
      { header: 'Staff ID', accessorKey: 'staffId' },
      { header: 'Full Name', accessorKey: 'fullName' },
      { header: 'Mobile Number', accessorKey: 'mobileNumber' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Service Area', accessorKey: 'serviceArea' },
      { header: 'Vehicle Number', accessorKey: 'vehicleRegNumber' },
      { header: 'DL Number', accessorKey: 'drivingLicenceNumber' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Registration Source', accessorKey: 'registrationSource' },
      { header: 'Completed Deliveries', accessorKey: 'completedDeliveriesCount' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[11px] font-bold border border-teal-300/30">
              Fleet Operations & Compliance
            </span>
            <span className="text-xs text-slate-300">Independent Delivery Fleet</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-teal-400" />
            Pharmacy Delivery Boy Management
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl">
            Register, verify, and dispatch pharmacy delivery riders across Karnataka hubs. Manage driving licences, two-wheelers, background checks, and self-registration requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/delivery-payouts">
            <Button
              variant="outline"
              size="sm"
              icon={CreditCard}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
            >
              Delivery Earnings & Payouts
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenRegister}
            className="bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold shadow-lg shadow-teal-500/20"
          >
            Register Delivery Boy
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'directory'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Bike className="w-4 h-4" />
          Active Delivery Staff Directory
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {staffList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Self-Registration Requests
          {pendingRequestsCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold animate-pulse">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE DELIVERY STAFF DIRECTORY */}
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
                  placeholder="Search by Rider name, PDB ID, phone, vehicle..."
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
              onClick={handleExportStaff}
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
                    <th className="py-3 px-4">Rider & Staff ID</th>
                    <th className="py-3 px-4">Contact & Mobile</th>
                    <th className="py-3 px-4">City & Service Area</th>
                    <th className="py-3 px-4">Vehicle & DL Details</th>
                    <th className="py-3 px-4">Source & Deliveries</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No pharmacy delivery staff found matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((staff) => (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={staff.profilePhoto}
                              alt={staff.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {staff.fullName}
                              </p>
                              <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                                {staff.staffId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{staff.mobileNumber}</p>
                          <p className="text-[11px] text-slate-400">{staff.email || 'No email'}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {staff.city}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[200px] truncate" title={staff.serviceArea}>
                            {staff.serviceArea}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-700 dark:text-slate-300">{staff.vehicleType}</p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {staff.vehicleRegNumber || 'RC Pending'}
                          </p>
                          <p className="text-[10px] text-slate-400">DL: {staff.drivingLicenceNumber}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              staff.registrationSource === 'Self Registered'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {staff.registrationSource}
                          </span>
                          <p className="text-[11px] font-bold text-teal-700 dark:text-teal-300 mt-1">
                            {staff.completedDeliveriesCount} deliveries ({staff.rating}★)
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={staff.status === 'Active' ? 'success' : 'neutral'}>
                            {staff.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingStaff(staff)}
                              title="View Details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(staff)}
                              title="Edit Rider Profile"
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              title={staff.status === 'Active' ? 'Deactivate Rider' : 'Activate Rider'}
                              className={`p-1.5 rounded-lg ${
                                staff.status === 'Active'
                                  ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                  : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(staff)}
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
                totalRecords={filteredStaff.length}
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
      {/* TAB 2: PENDING SELF-REGISTRATION REQUESTS */}
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
                    <th className="py-3 px-4">Contact & Mobile</th>
                    <th className="py-3 px-4">City & Service Area</th>
                    <th className="py-3 px-4">Vehicle & Driving Licence</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No self-registration applications found.
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

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{req.vehicleType}</p>
                          <p className="font-mono text-[11px] text-slate-500">DL: {req.drivingLicenceNumber}</p>
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
      {/* MODAL: REGISTER / EDIT PHARMACY DELIVERY BOY */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={editingStaff ? `Edit Delivery Boy: ${editingStaff.fullName}` : 'Register New Pharmacy Delivery Boy'}
        size="lg"
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <Input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rider@mediunify.org"
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
                Service Area / Pharmacy Hub Coverage *
              </label>
              <Input
                required
                value={formData.serviceArea}
                onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                placeholder="e.g. Kuvempunagar, Saraswathipuram & Bogadi Hubs"
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
                placeholder="Full address with pin code"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Driving Licence Number *
              </label>
              <Input
                required
                value={formData.drivingLicenceNumber}
                onChange={(e) => setFormData({ ...formData, drivingLicenceNumber: e.target.value })}
                placeholder="KA-09-2022-0019281"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Licence Expiry Date
              </label>
              <Input
                type="date"
                value={formData.licenceExpiry}
                onChange={(e) => setFormData({ ...formData, licenceExpiry: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Type
              </label>
              <Select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="text-xs"
              >
                <option value="Motorcycle">Motorcycle</option>
                <option value="Scooter (Honda Activa/TVS Jupiter)">Scooter</option>
                <option value="Electric Bike (EV)">Electric Bike (EV)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Registration Number
              </label>
              <Input
                value={formData.vehicleRegNumber}
                onChange={(e) => setFormData({ ...formData, vehicleRegNumber: e.target.value })}
                placeholder="KA-09-EM-4421"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact Name
              </label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="Family member / Spouse"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact Phone
              </label>
              <Input
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 97410 XXXXX"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Store / Hub
              </label>
              <Input
                value={formData.assignedStoreName}
                onChange={(e) => setFormData({ ...formData, assignedStoreName: e.target.value })}
                placeholder="MediUnify Central Pharmacy"
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
                <option value="Active">Active (Ready for Orders)</option>
                <option value="Inactive">Inactive (Off-Duty / Leave)</option>
                <option value="Suspended">Suspended</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={formSubmitting}>
              {editingStaff ? 'Save Changes' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VIEW DELIVERY STAFF DETAILS */}
      {/* ========================================================================= */}
      {viewingStaff && (
        <Modal
          isOpen={!!viewingStaff}
          onClose={() => setViewingStaff(null)}
          title={`Rider Profile: ${viewingStaff.fullName} (${viewingStaff.staffId})`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={viewingStaff.profilePhoto}
                alt={viewingStaff.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-500 shadow-md"
              />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {viewingStaff.fullName}
                </h3>
                <p className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  Staff ID: {viewingStaff.staffId}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source: <span className="font-semibold">{viewingStaff.registrationSource}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingStaff.mobileNumber}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Email</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingStaff.email || 'None'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Driving Licence</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingStaff.drivingLicenceNumber}</p>
                <p className="text-[10px] text-slate-400">Valid Till: {viewingStaff.licenceExpiry || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Vehicle Registration</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingStaff.vehicleRegNumber || 'N/A'}</p>
                <p className="text-[10px] text-slate-400">{viewingStaff.vehicleType}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Coverage & Hub</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingStaff.city} — {viewingStaff.serviceArea}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Assigned to: {viewingStaff.assignedStoreName}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Emergency Contact</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewingStaff.emergencyContactName || 'N/A'} ({viewingStaff.emergencyContactPhone || 'N/A'})
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingStaff(null)}>
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
          title={`Self-Registration Application: ${viewingRequest.fullName}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={viewingRequest.profilePhoto}
                alt={viewingRequest.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-md"
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
                <span className="text-[10px] text-slate-400 font-bold uppercase">Candidate Overview</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  Mobile: {viewingRequest.mobileNumber} | Email: {viewingRequest.email || 'None'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Location: {viewingRequest.city} ({viewingRequest.serviceArea})
                </p>
                <p className="text-slate-500 mt-1">Address: {viewingRequest.residentialAddress}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Licence & Two-Wheeler</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                  DL: {viewingRequest.drivingLicenceNumber} (Expiry: {viewingRequest.licenceExpiry})
                </p>
                <p className="font-mono text-slate-600 dark:text-slate-400 mt-1">
                  Vehicle: {viewingRequest.vehicleType} [{viewingRequest.vehicleRegNumber}]
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
        onConfirm={handleApprove}
        title={`Approve Delivery Staff Application: ${approvingRequest?.fullName}`}
        message={`Confirm approval for candidate ${approvingRequest?.fullName} (${approvingRequest?.applicationId})? Upon confirmation, a new active staff record will be created in the Pharmacy Delivery Boy Directory and the rider will be immediately eligible for dispatch assignments.`}
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
              placeholder="e.g. Invalid or expired driving licence, failed background check..."
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
            Specify the missing or incomplete verification documents requested from the delivery applicant.
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
              placeholder="e.g. Please upload clear front and back color scan of two-wheeler RC card."
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
      {/* CONFIRMATION: DELETE STAFF RECORD */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Delivery Staff: ${deleteTarget?.fullName}`}
        message={`Are you sure you want to permanently delete delivery staff ${deleteTarget?.fullName} (${deleteTarget?.staffId})? ${
          deleteTarget?.completedDeliveriesCount > 0
            ? `WARNING: This rider has ${deleteTarget.completedDeliveriesCount} completed historical deliveries. Deactivating the staff profile instead is strongly recommended to preserve delivery dispatch history.`
            : 'This rider has no historical dispatches and can be safely removed.'
        }`}
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}
