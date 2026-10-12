'use client';

import React, { useState, useEffect } from 'react';
import { appointmentsRepository } from '@/services/repositories';
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
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import { CalendarCheck, Eye, CheckCircle2, XCircle, Clock, MapPin, Stethoscope, Trash2 } from 'lucide-react';

export default function AppointmentsPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState('');
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
    categoryFilter,
    setCategoryFilter,
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
  } = useLocalFilters([], { defaultSortField: 'date', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      const res = await appointmentsRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadAppointments();
  }, [setData]);

  const handleStatusChange = async () => {
    if (!selectedAppointment || !statusToUpdate) return;
    const updated = await appointmentsRepository.update(selectedAppointment.id, {
      status: statusToUpdate,
    });
    setData(data.map((a) => (a.id === updated.id ? updated : a)));
    setIsStatusModalOpen(false);
    notify(`Appointment ${updated.appointmentRef} updated to ${statusToUpdate}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await appointmentsRepository.delete(deleteTarget.id);
      setData(data.filter((a) => a.id !== deleteTarget.id));
      notify(`Deleted appointment record ${deleteTarget.appointmentRef} (${deleteTarget.patientName})`, 'success');
      setDeleteTarget(null);
      if (selectedAppointment?.id === deleteTarget.id) {
        setSelectedAppointment(null);
      }
    } catch (err) {
      notify('Failed to delete appointment.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    exportToCSV('mediunify_appointments', data, [
      { header: 'Booking Ref', accessorKey: 'appointmentRef' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Doctor Name', accessorKey: 'doctorName' },
      { header: 'Specialization', accessorKey: 'specialization' },
      { header: 'Consultation Type', accessorKey: 'consultationType' },
      { header: 'Date', accessorKey: 'date' },
      { header: 'Slot', accessorKey: 'timeSlot' },
      { header: 'Clinic', accessorKey: 'clinicName' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Fee', accessorKey: 'fee' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Payment Status', accessorKey: 'paymentStatus' },
    ]);
  };

  const columns = [
    {
      header: 'Booking Ref & Type',
      accessorKey: 'appointmentRef',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.appointmentRef}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              row.consultationType === 'Video Consultation'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50'
            }`}>
              {row.consultationType === 'Video Consultation' ? 'Video Call' : 'In-Clinic OPD'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Token #{row.tokenNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.patientName}</span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {row.uhid} • {row.patientPhone}
          </p>
        </div>
      ),
    },
    {
      header: 'Physician & Specialty',
      accessorKey: 'doctorName',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{row.doctorName}</span>
            <p className="text-[10px] text-slate-400">{row.specialization}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Schedule & Clinic',
      accessorKey: 'date',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{row.date} at {row.timeSlot}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{row.clinicName}, {row.city}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Consultation Fee',
      accessorKey: 'fee',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.fee)}</span>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{row.paymentStatus}</p>
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="View Details"
            onClick={() => setSelectedAppointment(row)}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => {
              setSelectedAppointment(row);
              setStatusToUpdate(row.status);
              setIsStatusModalOpen(true);
            }}
          >
            Change Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Appointment Record"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Doctor Appointments Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Physical OPD consultations and hospital visits scheduled across partner clinics and doctors in Karnataka.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by patient, doctor, booking ref, clinic..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Confirmed', 'Scheduled', 'In-Progress', 'Completed', 'Cancelled']}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={['Cardiology', 'Obstetrics & Gynaecology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology']}
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

      {/* Detail Modal */}
      {selectedAppointment && !isStatusModalOpen && (
        <Modal
          isOpen={Boolean(selectedAppointment)}
          onClose={() => setSelectedAppointment(null)}
          title={`Appointment ${selectedAppointment.appointmentRef}`}
          subtitle={`Token #${selectedAppointment.tokenNumber} • ${selectedAppointment.date}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {selectedAppointment.patientName}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">{selectedAppointment.uhid}</p>
                <p className="text-slate-500 mt-1">{selectedAppointment.patientPhone}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Doctor & Clinic</p>
                <p className="font-bold text-blue-700 dark:text-blue-300 text-sm mt-0.5">
                  {selectedAppointment.doctorName}
                </p>
                <p className="text-slate-600 dark:text-slate-400">{selectedAppointment.specialization}</p>
                <p className="text-slate-500 mt-1">
                  {selectedAppointment.clinicName}, {selectedAppointment.city}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Chief Complaint / Symptoms</p>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                {selectedAppointment.chiefComplaint || 'Routine medical evaluation.'}
              </p>
            </div>

            {selectedAppointment.notes && (
              <div className="space-y-2">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Clinical Notes</p>
                <p className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  {selectedAppointment.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Consultation Status"
        subtitle={`Managing status for ${selectedAppointment?.appointmentRef}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleStatusChange}>
              Save Status
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Select
            label="New Appointment Status"
            value={statusToUpdate}
            onChange={(e) => setStatusToUpdate(e.target.value)}
            options={['Confirmed', 'Scheduled', 'In-Progress', 'Completed', 'Cancelled', 'No-Show']}
          />
        </div>
      </Modal>

      {/* Delete Appointment Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Appointment Record"
        description={`Are you sure you want to remove consultation booking ${deleteTarget?.appointmentRef} for patient ${deleteTarget?.patientName} with ${deleteTarget?.doctorName}? This action cannot be undone.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
