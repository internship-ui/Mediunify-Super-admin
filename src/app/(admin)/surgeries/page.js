'use client';

import React, { useState, useEffect } from 'react';
import { surgeriesRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportToCSV } from '@/services/exportService';
import { useNotification } from '@/providers/AppProviders';
import {
  Activity,
  User,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  ShieldCheck,
  FileText,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  Building2,
  Stethoscope,
  Trash2,
  Clock,
} from 'lucide-react';

export default function SurgeriesPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [selectedPatientFile, setSelectedPatientFile] = useState(null);
  const [statusUpdateItem, setStatusUpdateItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
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
  } = useLocalFilters([], { defaultSortField: 'createdDate', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadSurgeries() {
      setLoading(true);
      const res = await surgeriesRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadSurgeries();
  }, [setData]);

  const handleStatusUpdate = async () => {
    if (!statusUpdateItem || !newStatus) return;
    const updated = await surgeriesRepository.updateStatus(statusUpdateItem.id, newStatus);
    setData(data.map((item) => (item.id === updated.id ? updated : item)));
    setStatusUpdateItem(null);
    notify(`Status updated for patient ${updated.patientName} (${updated.surgeryRef}) to ${newStatus}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await surgeriesRepository.delete(deleteTarget.id);
      setData(data.filter((item) => item.id !== deleteTarget.id));
      notify(`Removed surgical record ${deleteTarget.surgeryRef} (${deleteTarget.patientName})`, 'success');
      setDeleteTarget(null);
      if (selectedPatientFile?.id === deleteTarget.id) {
        setSelectedPatientFile(null);
      }
    } catch (err) {
      notify('Failed to delete surgical record.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    exportToCSV('mediunify_surgical_patients', data, [
      { header: 'Ref ID', accessorKey: 'surgeryRef' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'Age', accessorKey: 'patientAge' },
      { header: 'Gender', accessorKey: 'patientGender' },
      { header: 'Blood Group', accessorKey: 'bloodGroup' },
      { header: 'Phone', accessorKey: 'patientPhone' },
      { header: 'Email', accessorKey: 'patientEmail' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Surgery Required', accessorKey: 'surgeryRequired' },
      { header: 'Specialty', accessorKey: 'specialty' },
      { header: 'Preferred Hospital', accessorKey: 'preferredHospital' },
      { header: 'Preferred Surgeon', accessorKey: 'preferredSurgeon' },
      { header: 'Scheduled Date', accessorKey: 'requestedDate' },
      { header: 'Booking Date', accessorKey: 'createdDate' },
      { header: 'Payment Status', accessorKey: 'paymentStatus' },
      { header: 'Insurance Provider', accessorKey: 'insuranceProvider' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Patient Notes', accessorKey: 'patientNotes' },
    ]);
  };

  const columns = [
    {
      header: 'Patient Details',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200/60">
            {row.patientName?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{row.patientName}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {row.patientAge}y • {row.patientGender}
              </span>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200/50">
                {row.bloodGroup}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{row.uhid}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">{row.surgeryRef}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Details',
      accessorKey: 'patientPhone',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{row.patientPhone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">{row.city}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Surgery / Procedure',
      accessorKey: 'surgeryRequired',
      cell: ({ row }) => (
        <div className="max-w-[240px]">
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block line-clamp-2">
            {row.surgeryRequired}
          </span>
          <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/50">
            {row.specialty}
          </span>
        </div>
      ),
    },
    {
      header: 'Hospital & Assigned Doctor',
      accessorKey: 'preferredHospital',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
            {row.preferredHospital}
          </span>
          <p className="text-[10px] text-slate-500 truncate max-w-[200px] mt-0.5">
            {row.preferredSurgeon}
          </p>
        </div>
      ),
    },
    {
      header: 'Scheduled & Booking Date',
      accessorKey: 'requestedDate',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-teal-600" />
            <span>Scheduled: {row.requestedDate}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Booked: {row.createdDate}
          </p>
        </div>
      ),
    },
    {
      header: 'Surgery & Payment Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge status={row.status} size="sm" />
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {row.paymentStatus || row.insuranceType || 'Cashless Pre-Auth'}
          </div>
        </div>
      ),
    },
    {
      header: 'Patient Notes / Documents',
      accessorKey: 'patientNotes',
      cell: ({ row }) => (
        <div className="max-w-[190px]">
          {row.patientNotes ? (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight italic">
              &quot;{row.patientNotes}&quot;
            </p>
          ) : (
            <span className="text-[11px] text-slate-400">No special notes</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-600 hover:text-teal-600"
            onClick={() => setSelectedPatientFile(row)}
            title="Open Complete Patient Surgical File"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2 text-slate-600 dark:text-slate-300"
            onClick={() => {
              setStatusUpdateItem(row);
              setNewStatus(row.status);
            }}
            title="Update Case Status"
          >
            Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Surgery Case"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Surgical Care & Patient Details
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 border border-teal-200">
              Patient View Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive patient demographic files, surgical procedures, clinical co-morbidities, and cashless insurance claims.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Patients</span>
            <User className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{data.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active surgery records</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pre-Op Ready</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {data.filter((d) => d.status.includes('Scheduled') || d.status.includes('Pre-Op')).length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Consultations confirmed</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cashless TPA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {data.filter((d) => d.insuranceType.includes('Cashless')).length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Insurance pre-approved</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">New Inquiries</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {data.filter((d) => d.status === 'Inquiry Received').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending initial callback</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by patient name, UHID, surgery procedure, hospital..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={[
            'Inquiry Received',
            'Patient Contacted',
            'Pre-Op Consultation Scheduled',
            'Surgery Scheduled',
            'Completed',
          ]}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          onExport={handleExport}
          onReset={resetFilters}
        />

        <DataTable
          columns={columns}
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

      {/* Dedicated Patient Surgical File Modal */}
      {selectedPatientFile && (
        <Modal
          isOpen={Boolean(selectedPatientFile)}
          onClose={() => setSelectedPatientFile(null)}
          title={`Patient Surgical File — ${selectedPatientFile.patientName}`}
          subtitle={`UHID: ${selectedPatientFile.uhid} • Case Ref: ${selectedPatientFile.surgeryRef}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => {
                  const target = selectedPatientFile;
                  setDeleteTarget(target);
                }}
              >
                Delete Case
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPatientFile(null)}>
                  Close File
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                  onClick={() => {
                    const target = selectedPatientFile;
                    setStatusUpdateItem(target);
                    setNewStatus(target.status);
                  }}
                >
                  Update Status
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Patient Demographics Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Patient Demographics
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={selectedPatientFile.status} size="sm" />
                  <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded text-xs border border-rose-200">
                    Blood: {selectedPatientFile.bloodGroup}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Legal Name:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedPatientFile.patientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Age & Gender:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.patientAge} Years • {selectedPatientFile.patientGender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Direct Phone:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.patientPhone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.patientEmail}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Residential Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.patientAddress}, {selectedPatientFile.city}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Emergency Attendant:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {selectedPatientFile.emergencyContact}
                  </span>
                </div>
              </div>
            </div>

            {/* Requested Surgery & Hospital Preferences */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
              <div className="flex items-center gap-2 border-b border-blue-200 dark:border-blue-800 pb-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Surgical Procedure Required
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Procedure Name:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                    {selectedPatientFile.surgeryRequired}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Clinical Specialty:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedPatientFile.specialty}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Case Urgency:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {selectedPatientFile.urgency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Preferred Hospital:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedPatientFile.preferredHospital}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Preferred Surgeon:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedPatientFile.preferredSurgeon}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History & Pre-Op Vitals */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Clinical Co-morbidities & Pre-Op Vitals
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.vitals?.bp || '120/80'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Blood Sugar</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.vitals?.sugar || '110 mg/dL'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Pulse Rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.vitals?.pulse || '72 bpm'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Oxygen (SpO2)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedPatientFile.vitals?.spo2 || '99%'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Known Medical History:</span>
                <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  {selectedPatientFile.medicalHistory}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Patient Symptoms & Surgical Notes:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  {selectedPatientFile.patientNotes}
                </p>
              </div>
            </div>

            {/* Insurance & TPA Details */}
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-800 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Insurance & Cashless TPA Authorization
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Mode:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {selectedPatientFile.insuranceType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Insurance TPA:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.insuranceProvider}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Policy Number:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPatientFile.policyNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Update Modal */}
      {statusUpdateItem && (
        <Modal
          isOpen={Boolean(statusUpdateItem)}
          onClose={() => setStatusUpdateItem(null)}
          title="Update Surgical Inquiry Status"
          subtitle={`Patient: ${statusUpdateItem.patientName} (${statusUpdateItem.surgeryRef})`}
          footer={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStatusUpdateItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleStatusUpdate}>
                Save Changes
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select New Status:
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={[
                  { value: 'Inquiry Received', label: 'Inquiry Received' },
                  { value: 'Patient Contacted', label: 'Patient Contacted' },
                  { value: 'Pre-Op Consultation Scheduled', label: 'Pre-Op Consultation Scheduled' },
                  { value: 'Surgery Scheduled', label: 'Surgery Scheduled' },
                  { value: 'Completed', label: 'Completed' },
                ]}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Updating this status updates the patient file and logs the event in the platform audit trail.
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Surgical Patient Case"
        description={`Are you sure you want to permanently remove surgery case ${deleteTarget?.surgeryRef} for patient ${deleteTarget?.patientName} (${deleteTarget?.surgeryRequired})? This action cannot be undone.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
