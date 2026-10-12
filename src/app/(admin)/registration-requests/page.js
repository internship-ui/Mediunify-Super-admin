'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { registrationRequestsRepository, doctorsRepository, providersRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatCard } from '@/components/dashboard/StatCard';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  UserCheck,
  Building2,
  Stethoscope,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Download,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

const ADMIN_REVIEWERS = [
  { id: 'adm-001', name: 'Namith Gowda', role: 'Super Admin', permissions: ['all'] },
  { id: 'adm-002', name: 'Dr. Sharath Chandra', role: 'Clinical Director', permissions: ['doctors:verify', 'registrations:approve'] },
  { id: 'adm-005', name: 'Pooja Venkatesh', role: 'Support Agent', permissions: ['patients:view'] },
];

export default function RegistrationRequestsPage() {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'centres'
  const [currentReviewer, setCurrentReviewer] = useState(ADMIN_REVIEWERS[0]);
  const [counts, setCounts] = useState({
    pendingDoctors: 0,
    pendingCentres: 0,
    totalPending: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  // Raw data stores
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [centreRequests, setCentreRequests] = useState([]);

  // Modals state
  const [selectedDoctorApp, setSelectedDoctorApp] = useState(null);
  const [selectedCentreApp, setSelectedCentreApp] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  // Approval confirmation modal
  const [approvalTarget, setApprovalTarget] = useState(null); // { type: 'doctor' | 'centre', item: object }
  const [isApproving, setIsApproving] = useState(false);

  // Rejection modal
  const [rejectionTarget, setRejectionTarget] = useState(null); // { type: 'doctor' | 'centre', item: object }
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Additional info modal
  const [infoRequestTarget, setInfoRequestTarget] = useState(null); // { type: 'doctor' | 'centre', item: object }
  const [infoRemarks, setInfoRemarks] = useState('');
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);

  // Local filters for Doctors
  const doctorFilters = useLocalFilters(doctorRequests, {
    defaultSortField: 'submissionDate',
    defaultSortDirection: 'desc',
  });

  // Local filters for Centres
  const centreFilters = useLocalFilters(centreRequests, {
    defaultSortField: 'submissionDate',
    defaultSortDirection: 'desc',
  });

  const activeFilters = activeTab === 'doctors' ? doctorFilters : centreFilters;

  // Load all registration requests
  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, centres, kpis] = await Promise.all([
        registrationRequestsRepository.getDoctorRequests(),
        registrationRequestsRepository.getCentreRequests(),
        registrationRequestsRepository.getDashboardCounts(),
      ]);
      setDoctorRequests(docs);
      doctorFilters.setData(docs);
      setCentreRequests(centres);
      centreFilters.setData(centres);
      setCounts(kpis);
    } catch (err) {
      notify(`Failed to load registration requests: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check if current active reviewer has permission
  const hasPermission = registrationRequestsRepository.isAuthorized(currentReviewer);

  const handleActionPermissionCheck = () => {
    if (!hasPermission) {
      notify(
        `Action Restricted: User ${currentReviewer.name} (${currentReviewer.role}) does not have administrative permissions to approve or reject registration licenses.`,
        'error'
      );
      return false;
    }
    return true;
  };

  // ------------------ APPROVE ------------------
  const handleConfirmApproval = async () => {
    if (!approvalTarget) return;
    if (!handleActionPermissionCheck()) return;

    setIsApproving(true);
    try {
      if (approvalTarget.type === 'doctor') {
        const { request, doctor } = await registrationRequestsRepository.approveDoctorRequest(
          approvalTarget.item.id,
          currentReviewer
        );
        notify(`Approved & Empaneled ${request.doctorName} (${doctor.doctorCode}) into Doctor Management!`, 'success');
      } else {
        const { request, provider } = await registrationRequestsRepository.approveCentreRequest(
          approvalTarget.item.id,
          currentReviewer
        );
        notify(`Approved & Empaneled ${request.centreName} (${provider.providerCode}) into Healthcare Centre Network!`, 'success');
      }
      setApprovalTarget(null);
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // ------------------ REJECT ------------------
  const handleConfirmRejection = async () => {
    if (!rejectionTarget || !rejectionReason.trim()) return;
    if (!handleActionPermissionCheck()) return;

    setIsRejecting(true);
    try {
      if (rejectionTarget.type === 'doctor') {
        const updated = await registrationRequestsRepository.rejectDoctorRequest(
          rejectionTarget.item.id,
          rejectionReason,
          currentReviewer
        );
        notify(`Rejected registration application for ${updated.doctorName}. Record retained in audit history.`, 'warning');
      } else {
        const updated = await registrationRequestsRepository.rejectCentreRequest(
          rejectionTarget.item.id,
          rejectionReason,
          currentReviewer
        );
        notify(`Rejected registration application for ${updated.centreName}. Record retained in audit history.`, 'warning');
      }
      setRejectionTarget(null);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  // ------------------ REQUEST ADDITIONAL INFO ------------------
  const handleConfirmInfoRequest = async () => {
    if (!infoRequestTarget || !infoRemarks.trim()) return;
    if (!handleActionPermissionCheck()) return;

    setIsRequestingInfo(true);
    try {
      if (infoRequestTarget.type === 'doctor') {
        const updated = await registrationRequestsRepository.requestDoctorAdditionalInfo(
          infoRequestTarget.item.id,
          infoRemarks,
          currentReviewer
        );
        notify(`Requested clarification/documents from ${updated.doctorName}.`, 'success');
      } else {
        const updated = await registrationRequestsRepository.requestCentreAdditionalInfo(
          infoRequestTarget.item.id,
          infoRemarks,
          currentReviewer
        );
        notify(`Requested clarification/documents from ${updated.centreName}.`, 'success');
      }
      setInfoRequestTarget(null);
      setInfoRemarks('');
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsRequestingInfo(false);
    }
  };

  // Export handlers
  const handleExportDoctors = () => {
    exportToCSV('mediunify_doctor_registration_requests', doctorFilters.data, [
      { header: 'Application ID', accessorKey: 'applicationId' },
      { header: 'Doctor Name', accessorKey: 'doctorName' },
      { header: 'Specialization', accessorKey: 'specialization' },
      { header: 'License No', accessorKey: 'medicalRegistrationNo' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Phone', accessorKey: 'phone' },
      { header: 'Email', accessorKey: 'email' },
      { header: 'Submission Date', accessorKey: 'submissionDate' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Rejection Reason', accessorKey: 'rejectionReason' },
    ]);
  };

  const handleExportCentres = () => {
    exportToCSV('mediunify_healthcare_centre_requests', centreFilters.data, [
      { header: 'Application ID', accessorKey: 'applicationId' },
      { header: 'Centre Name', accessorKey: 'centreName' },
      { header: 'Category', accessorKey: 'category' },
      { header: 'License No', accessorKey: 'licenseNumber' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Contact Person', accessorKey: 'contactPerson' },
      { header: 'Phone', accessorKey: 'phone' },
      { header: 'Submission Date', accessorKey: 'submissionDate' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Rejection Reason', accessorKey: 'rejectionReason' },
    ]);
  };

  // ------------------ DOCTOR TABLE COLUMNS ------------------
  const doctorColumns = [
    {
      header: 'Application & Date',
      accessorKey: 'applicationId',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.applicationId}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> {row.submissionDate}
          </p>
          <span className="text-[10px] text-slate-400">{row.registrationAuthority || 'Karnataka Medical Council'}</span>
        </div>
      ),
    },
    {
      header: 'Doctor Credentials',
      accessorKey: 'doctorName',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-900 dark:text-slate-100">{row.doctorName}</p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium line-clamp-1">{row.qualifications}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.experienceYears} Years Clinical Experience</p>
        </div>
      ),
    },
    {
      header: 'Specialization & City',
      accessorKey: 'specialization',
      cell: ({ row }) => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50">
            {row.specialization}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" /> {row.city}
          </p>
        </div>
      ),
    },
    {
      header: 'KMC License No',
      accessorKey: 'medicalRegistrationNo',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {row.medicalRegistrationNo}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">{row.documents?.length || 0} Certificates Uploaded</p>
        </div>
      ),
    },
    {
      header: 'Proposed Fees & Modes',
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300">
            In-Clinic: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(row.proposedInPersonFee || 0)}</strong>
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Video Call: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(row.proposedVideoFee || 0)}</strong>
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-600 hover:text-teal-600"
            title="View Doctor Application"
            onClick={() => setSelectedDoctorApp(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {row.status !== 'Approved' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Approve & Empanel Doctor"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setApprovalTarget({ type: 'doctor', item: row });
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}

          {row.status !== 'Rejected' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Reject Application"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setRejectionTarget({ type: 'doctor', item: row });
                  setRejectionReason('');
                }
              }}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}

          {row.status === 'Pending Review' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              title="Request Additional Information"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setInfoRequestTarget({ type: 'doctor', item: row });
                  setInfoRemarks('');
                }
              }}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ------------------ HEALTHCARE CENTRE TABLE COLUMNS ------------------
  const centreColumns = [
    {
      header: 'Application & Date',
      accessorKey: 'applicationId',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.applicationId}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> {row.submissionDate}
          </p>
        </div>
      ),
    },
    {
      header: 'Centre Facility',
      accessorKey: 'centreName',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" /> {row.centreName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{row.centreType || row.category}</p>
          <span className="text-[10px] text-teal-600 font-semibold">{row.accreditations}</span>
        </div>
      ),
    },
    {
      header: 'Contact & City',
      accessorKey: 'city',
      cell: ({ row }) => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/50">
            {row.city}
          </span>
          <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 mt-1">{row.contactPerson}</p>
          <p className="text-[10px] text-slate-400">{row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Licence & Beds',
      accessorKey: 'licenseNumber',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {row.licenseNumber}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {row.bedsCapacity > 0 ? `${row.bedsCapacity} Inpatient Beds` : 'Outpatient / Imaging'}
          </p>
        </div>
      ),
    },
    {
      header: 'Requested Services',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(row.requestedServices || []).slice(0, 3).map((s, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded"
            >
              {s}
            </span>
          ))}
          {(row.requestedServices || []).length > 3 && (
            <span className="text-[10px] text-slate-400 font-semibold">
              +{(row.requestedServices || []).length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-600 hover:text-teal-600"
            title="View Centre Application"
            onClick={() => setSelectedCentreApp(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {row.status !== 'Approved' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Approve & Empanel Healthcare Centre"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setApprovalTarget({ type: 'centre', item: row });
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}

          {row.status !== 'Rejected' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Reject Application"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setRejectionTarget({ type: 'centre', item: row });
                  setRejectionReason('');
                }
              }}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}

          {row.status === 'Pending Review' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              title="Request Additional Information"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setInfoRequestTarget({ type: 'centre', item: row });
                  setInfoRemarks('');
                }
              }}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Role Permissions Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#152e72] to-teal-800 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[11px] font-bold border border-teal-300/30">
              Provider Licensing & Governance
            </span>
            <span className="text-xs text-slate-300">Karnataka State Council Verification</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Doctor & Healthcare Centre Registration Requests
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl">
            Review, verify statutory qualifications, inspect accreditation documents, and approve new medical practices and healthcare centres into the active MediUnify provider network.
          </p>
        </div>

        {/* Role-Based Permission Control Switcher */}
        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 space-y-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
            <Shield className="w-4 h-4 text-teal-300" />
            <span>Active Reviewer (RBAC Guard)</span>
          </div>
          <select
            value={currentReviewer.id}
            onChange={(e) => {
              const selected = ADMIN_REVIEWERS.find((a) => a.id === e.target.value);
              if (selected) {
                setCurrentReviewer(selected);
                notify(`Switched active reviewer to ${selected.name} (${selected.role})`, 'info');
              }
            }}
            className="w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-slate-900/80 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {ADMIN_REVIEWERS.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name} — {admin.role} {admin.role === 'Support Agent' ? '(Unauthorized Demo)' : '(Authorized)'}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-300">
            {hasPermission ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Full approval & rejection authority active
              </span>
            ) : (
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Read-only mode: Approval restricted for this role
              </span>
            )}
          </p>
        </div>
      </div>

      {/* KPI Dashboard Summary Cards (Section D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Doctor Requests"
          value={counts.pendingDoctors}
          change="Awaiting KMC Audit"
          isPositive={counts.pendingDoctors === 0}
          icon={Stethoscope}
          accentColor="teal"
          description="Physicians & specialists"
        />
        <StatCard
          title="Pending Centre Requests"
          value={counts.pendingCentres}
          change="NABH / KPME Verification"
          isPositive={counts.pendingCentres === 0}
          icon={Building2}
          accentColor="navy"
          description="Hospitals, labs & imaging"
        />
        <StatCard
          title="Approved This Month"
          value={counts.approvedThisMonth}
          change="Active in Network"
          isPositive={true}
          icon={CheckCircle2}
          accentColor="green"
          description="Empaneled providers"
        />
        <StatCard
          title="Rejected This Month"
          value={counts.rejectedThisMonth}
          change="Retained for History"
          isPositive={false}
          icon={XCircle}
          accentColor="coral"
          description="Audited compliance fails"
        />
      </div>

      {/* Tabs & Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-4 gap-4 bg-slate-50/50 dark:bg-slate-950/20">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`pb-3.5 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'doctors'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Registration Requests</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
              {doctorRequests.filter((d) => d.status === 'Pending Review' || d.status === 'Additional Information Required').length} Pending
            </span>
          </button>

          <button
            onClick={() => setActiveTab('centres')}
            className={`pb-3.5 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'centres'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Healthcare Centre Requests</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {centreRequests.filter((c) => c.status === 'Pending Review' || c.status === 'Additional Information Required').length} Pending
            </span>
          </button>
        </div>

        {/* Toolbar with Search & Filters */}
        <TableToolbar
          search={activeFilters.search}
          onSearchChange={activeFilters.setSearch}
          searchPlaceholder={
            activeTab === 'doctors'
              ? 'Search doctor by name, application ID, KMC license, specialization...'
              : 'Search centre by name, KPME license, contact person, city...'
          }
          statusFilter={activeFilters.statusFilter}
          onStatusChange={activeFilters.setStatusFilter}
          statusOptions={['Pending Review', 'Additional Information Required', 'Approved', 'Rejected']}
          cityFilter={activeFilters.cityFilter}
          onCityChange={activeFilters.setCityFilter}
          categoryFilter={activeFilters.categoryFilter}
          onCategoryChange={activeFilters.setCategoryFilter}
          categoryOptions={
            activeTab === 'doctors'
              ? ['Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'General Medicine']
              : ['Hospital', 'Diagnostic Center', 'Surgery Center', 'Ayurveda & Wellness']
          }
          onExport={activeTab === 'doctors' ? handleExportDoctors : handleExportCentres}
          onReset={activeFilters.resetFilters}
        />

        {/* Data Table */}
        <DataTable
          columns={activeTab === 'doctors' ? doctorColumns : centreColumns}
          data={activeFilters.paginatedData}
          isLoading={loading}
          sortField={activeFilters.sortField}
          sortDirection={activeFilters.sortDirection}
          onSort={(field) => {
            activeFilters.setSortField(field);
            activeFilters.setSortDirection(activeFilters.sortDirection === 'asc' ? 'desc' : 'asc');
          }}
        />

        {/* Pagination */}
        <Pagination
          currentPage={activeFilters.page}
          totalPages={activeFilters.totalPages}
          onPageChange={activeFilters.setPage}
          pageSize={activeFilters.pageSize}
          onPageSizeChange={activeFilters.setPageSize}
          totalItems={activeFilters.totalRecords}
        />
      </div>

      {/* ------------------ MODAL: DOCTOR APPLICATION DETAILS & DOCUMENTS ------------------ */}
      {selectedDoctorApp && (
        <Modal
          isOpen={Boolean(selectedDoctorApp)}
          onClose={() => setSelectedDoctorApp(null)}
          title={`Doctor Registration Application: ${selectedDoctorApp.applicationId}`}
          subtitle={`${selectedDoctorApp.doctorName} — ${selectedDoctorApp.specialization}`}
          maxWidth="max-w-4xl"
          footer={
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <span className="text-xs text-slate-500">
                Submitted on {selectedDoctorApp.submissionDate} via Doctor Onboarding Portal
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDoctorApp(null)}>
                  Close
                </Button>
                {selectedDoctorApp.status !== 'Approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      if (handleActionPermissionCheck()) {
                        setApprovalTarget({ type: 'doctor', item: selectedDoctorApp });
                        setSelectedDoctorApp(null);
                      }
                    }}
                  >
                    Approve Doctor
                  </Button>
                )}
                {selectedDoctorApp.status !== 'Rejected' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (handleActionPermissionCheck()) {
                        setRejectionTarget({ type: 'doctor', item: selectedDoctorApp });
                        setRejectionReason('');
                        setSelectedDoctorApp(null);
                      }
                    }}
                  >
                    Reject Application
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Status Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Badge status={selectedDoctorApp.status} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Application Status: {selectedDoctorApp.status}
                </span>
              </div>
              <span className="font-mono text-slate-500">
                License: {selectedDoctorApp.medicalRegistrationNo} ({selectedDoctorApp.registrationAuthority})
              </span>
            </div>

            {/* Rejection / Additional Info Alert if present */}
            {selectedDoctorApp.rejectionReason && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" /> Formal Rejection Reason Recorded:
                </p>
                <p className="mt-1 text-xs leading-relaxed">{selectedDoctorApp.rejectionReason}</p>
              </div>
            )}

            {selectedDoctorApp.additionalInfoRemarks && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" /> Information / Query Raised:
                </p>
                <p className="mt-1 text-xs leading-relaxed">{selectedDoctorApp.additionalInfoRemarks}</p>
              </div>
            )}

            {/* Section: Professional & Clinical Profile */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Clinical Qualifications & Contact Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Doctor Full Name</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedDoctorApp.doctorName}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Specialization & Sub-Specialty</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedDoctorApp.specialization} ({selectedDoctorApp.subSpecialty || 'General'})
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Degrees & Qualifications</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedDoctorApp.qualifications}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact Email & Phone</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedDoctorApp.phone}</p>
                  <p className="text-[11px] text-slate-500">{selectedDoctorApp.email}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">City & Preferred OPD Location</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedDoctorApp.city}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{selectedDoctorApp.preferredLocation}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Proposed Fees</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    In-Clinic: {formatCurrency(selectedDoctorApp.proposedInPersonFee || 800)} | Video: {formatCurrency(selectedDoctorApp.proposedVideoFee || 600)}
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Uploaded Certificates & Supporting Documents */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Uploaded Regulatory Certificates & Supporting Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(selectedDoctorApp.documents || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 hover:border-teal-400 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {doc.type} • {doc.size} • <span className="font-mono">{doc.fileNumber}</span>
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Status: {doc.status}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 h-8 px-2.5"
                      onClick={() => setViewingDocument({ ...doc, applicantName: selectedDoctorApp.doctorName })}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-teal-600" /> Inspect
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Audit Trail & Review History */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Administrative Review History & Audit Log
              </h4>
              <div className="space-y-2">
                {(selectedDoctorApp.reviewHistory || []).map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {rev.action} by <span className="text-teal-600">{rev.reviewer}</span> ({rev.role})
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{rev.notes}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{rev.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------ MODAL: HEALTHCARE CENTRE APPLICATION DETAILS ------------------ */}
      {selectedCentreApp && (
        <Modal
          isOpen={Boolean(selectedCentreApp)}
          onClose={() => setSelectedCentreApp(null)}
          title={`Healthcare Centre Registration: ${selectedCentreApp.applicationId}`}
          subtitle={`${selectedCentreApp.centreName} (${selectedCentreApp.city})`}
          maxWidth="max-w-4xl"
          footer={
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <span className="text-xs text-slate-500">
                Submitted on {selectedCentreApp.submissionDate} via Healthcare Centre Empanelment
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedCentreApp(null)}>
                  Close
                </Button>
                {selectedCentreApp.status !== 'Approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      if (handleActionPermissionCheck()) {
                        setApprovalTarget({ type: 'centre', item: selectedCentreApp });
                        setSelectedCentreApp(null);
                      }
                    }}
                  >
                    Approve Centre
                  </Button>
                )}
                {selectedCentreApp.status !== 'Rejected' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (handleActionPermissionCheck()) {
                        setRejectionTarget({ type: 'centre', item: selectedCentreApp });
                        setRejectionReason('');
                        setSelectedCentreApp(null);
                      }
                    }}
                  >
                    Reject Application
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Status Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Badge status={selectedCentreApp.status} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Application Status: {selectedCentreApp.status}
                </span>
              </div>
              <span className="font-mono text-slate-500">
                Statutory License: {selectedCentreApp.licenseNumber}
              </span>
            </div>

            {/* Rejection / Additional Info Alert if present */}
            {selectedCentreApp.rejectionReason && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" /> Formal Rejection Reason:
                </p>
                <p className="mt-1 text-xs leading-relaxed">{selectedCentreApp.rejectionReason}</p>
              </div>
            )}

            {selectedCentreApp.additionalInfoRemarks && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" /> Information Requested from Centre:
                </p>
                <p className="mt-1 text-xs leading-relaxed">{selectedCentreApp.additionalInfoRemarks}</p>
              </div>
            )}

            {/* Centre Facility Profile */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Healthcare Centre Facility & Infrastructure Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Facility Name</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedCentreApp.centreName}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Category & Accreditations</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedCentreApp.category} • {selectedCentreApp.accreditations}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact Person & Phone</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedCentreApp.contactPerson}</p>
                  <p className="text-[11px] text-slate-500">{selectedCentreApp.phone}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Facility Address & City</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedCentreApp.city}</p>
                  <p className="text-[11px] text-slate-500">{selectedCentreApp.address}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">License / KPME Reg No</span>
                  <p className="font-mono font-bold text-teal-600 mt-0.5">{selectedCentreApp.licenseNumber}</p>
                  <p className="text-[11px] text-slate-500">Inpatient Beds: {selectedCentreApp.bedsCapacity}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Commission Agreement</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedCentreApp.commissionRate || '12%'}</p>
                  <p className="text-[11px] text-slate-400">Subject to monthly settlement</p>
                </div>
              </div>
            </div>

            {/* Requested Healthcare Services */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                Requested Healthcare Services for Empanelment
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedCentreApp.requestedServices || []).map((srv, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                  >
                    ✓ {srv}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                * Note: Approving the centre registers the entity into Healthcare Centre Management. Visibility of individual services to patients remains strictly governed by the city-wise service availability settings.
              </p>
            </div>

            {/* Uploaded Documents */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Uploaded Statutory Licenses & Hospital Clearances
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(selectedCentreApp.documents || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 hover:border-teal-400 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {doc.type} • {doc.size} • <span className="font-mono">{doc.fileNumber}</span>
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Status: {doc.status}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 h-8 px-2.5"
                      onClick={() => setViewingDocument({ ...doc, applicantName: selectedCentreApp.centreName })}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-teal-600" /> Inspect
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Review History */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Administrative Review History & Audit Log
              </h4>
              <div className="space-y-2">
                {(selectedCentreApp.reviewHistory || []).map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {rev.action} by <span className="text-teal-600">{rev.reviewer}</span> ({rev.role})
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{rev.notes}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{rev.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------ MODAL: DOCUMENT VIEWER / INSPECTION ------------------ */}
      {viewingDocument && (
        <Modal
          isOpen={Boolean(viewingDocument)}
          onClose={() => setViewingDocument(null)}
          title={`Document Verification: ${viewingDocument.name}`}
          subtitle={`Applicant: ${viewingDocument.applicantName}`}
          maxWidth="max-w-2xl"
          footer={
            <Button variant="primary" size="sm" onClick={() => setViewingDocument(null)}>
              Done Inspecting
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">
                  File Ref: {viewingDocument.fileNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {viewingDocument.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Type: <strong>{viewingDocument.type}</strong> | File Size: <strong>{viewingDocument.size}</strong>
              </p>
            </div>

            {/* Mock Certificate Preview Canvas */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Official Verification Document Preview
                </h5>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                  Digital watermark authenticating {viewingDocument.name} registered under {viewingDocument.fileNumber}.
                </p>
              </div>
              <div className="inline-block p-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                SHA-256 Checksum: 8f9b41...e319 (Cryptographically Signed)
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------ MODAL: CONFIRM APPROVAL ------------------ */}
      {approvalTarget && (
        <ConfirmDialog
          isOpen={Boolean(approvalTarget)}
          onClose={() => setApprovalTarget(null)}
          onConfirm={handleConfirmApproval}
          isLoading={isApproving}
          title={
            approvalTarget.type === 'doctor'
              ? `Approve Doctor: ${approvalTarget.item.doctorName}`
              : `Approve Healthcare Centre: ${approvalTarget.item.centreName}`
          }
          description={
            approvalTarget.type === 'doctor'
              ? `Are you sure you want to approve Dr. ${approvalTarget.item.doctorName} (License: ${approvalTarget.item.medicalRegistrationNo})? This will immediately create an active, verified doctor record in the Doctor Management module with consultation fees and city assignments.`
              : `Are you sure you want to approve ${approvalTarget.item.centreName} (License: ${approvalTarget.item.licenseNumber})? This will immediately add and activate the facility in Healthcare Centre Management. (Individual service availability will follow city-wise configuration).`
          }
          confirmText="Confirm & Empanel"
          variant="primary"
        />
      )}

      {/* ------------------ MODAL: REJECT APPLICATION ------------------ */}
      {rejectionTarget && (
        <Modal
          isOpen={Boolean(rejectionTarget)}
          onClose={() => setRejectionTarget(null)}
          title={
            rejectionTarget.type === 'doctor'
              ? `Reject Application: ${rejectionTarget.item.doctorName}`
              : `Reject Application: ${rejectionTarget.item.centreName}`
          }
          subtitle="A mandatory formal rejection reason will be permanently archived in the audit logs."
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setRejectionTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim()}
                isLoading={isRejecting}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              Rejected applications are <strong>never permanently deleted</strong>. They are retained in administrative history for compliance and auditing.
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Detailed Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Failed State Medical Council verification, credentials mismatch with national registry, or missing AERB/NABL accreditation certificates..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------ MODAL: REQUEST ADDITIONAL INFORMATION ------------------ */}
      {infoRequestTarget && (
        <Modal
          isOpen={Boolean(infoRequestTarget)}
          onClose={() => setInfoRequestTarget(null)}
          title={
            infoRequestTarget.type === 'doctor'
              ? `Request Additional Info: ${infoRequestTarget.item.doctorName}`
              : `Request Additional Info: ${infoRequestTarget.item.centreName}`
          }
          subtitle="Specify the additional documents or clarifications required before empanelment."
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setInfoRequestTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmInfoRequest}
                disabled={!infoRemarks.trim()}
                isLoading={isRequestingInfo}
              >
                Send Request
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Clarification / Information Required <span className="text-blue-500">*</span>
              </label>
              <textarea
                value={infoRemarks}
                onChange={(e) => setInfoRemarks(e.target.value)}
                placeholder="e.g. Please provide updated 5-year Medical Council registration renewal acknowledgment and current Medical Indemnity Insurance copy..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
