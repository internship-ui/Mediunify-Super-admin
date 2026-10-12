'use client';

import React, { useState, useEffect } from 'react';
import { radiologyBookingsRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/ui/Select';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import { ScanLine, Building2, Clock, CheckCircle2, Eye, FileText, Trash2 } from 'lucide-react';

export default function RadiologyPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState('Scan Completed');
  const [deleteTarget, setDeleteTarget] = useState(null);

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
  } = useLocalFilters([], { defaultSortField: 'appointmentDate', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadRadiology() {
      setLoading(true);
      const res = await radiologyBookingsRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadRadiology();
  }, [setData]);

  const handleUpdateStatus = async () => {
    if (!selectedScan) return;
    const updated = await radiologyBookingsRepository.updateScanStatus(selectedScan.id, nextStatus);
    setData(data.map((s) => (s.id === updated.id ? updated : s)));
    setIsStatusModalOpen(false);
    notify(`Updated scan ${updated.bookingRef} to ${nextStatus}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await radiologyBookingsRepository.delete(deleteTarget.id);
      setData(data.filter((r) => r.id !== deleteTarget.id));
      notify(`Deleted radiology scan ${deleteTarget.bookingRef} (${deleteTarget.testName})`, 'success');
    } catch (err) {
      notify(`Failed to delete scan: ${err.message}`, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportToCSV('mediunify_radiology_scans', data, [
      { header: 'Booking Ref', accessorKey: 'bookingRef' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Test Name', accessorKey: 'testName' },
      { header: 'Modality', accessorKey: 'modalityType' },
      { header: 'Imaging Center', accessorKey: 'centerName' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Date', accessorKey: 'appointmentDate' },
      { header: 'Price', accessorKey: 'price' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  const columns = [
    {
      header: 'Scan & Modality',
      accessorKey: 'bookingRef',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.bookingRef}
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 max-w-xs">{row.testName}</p>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            {row.modalityType}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.patientName}</span>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5">{row.uhid}</p>
        </div>
      ),
    },
    {
      header: 'Imaging Hub & Location',
      accessorKey: 'centerName',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.centerName}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{row.location}, {row.city}</p>
        </div>
      ),
    },
    {
      header: 'Appointment Slot',
      accessorKey: 'appointmentDate',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.appointmentDate}</span>
          <p className="text-[10px] text-slate-400">{row.timeSlot}</p>
        </div>
      ),
    },
    {
      header: 'Scan Price',
      accessorKey: 'price',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.price)}</span>
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
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => {
              setSelectedScan(row);
              setNextStatus(row.status);
              setIsStatusModalOpen(true);
            }}
          >
            Update Scan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Scan Record"
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Radiology & Advanced Imaging
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            3T MRI, 128-Slice CT, 2D Echo, Ultrasound, and Digital X-Ray bookings across accredited imaging hubs in Karnataka.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by scan ref, patient, center, modality..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Slot Booked', 'Scan Scheduled', 'Scan Completed', 'Report Published']}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={['MRI Scan', 'CT Scan', 'Ultrasound / USG', 'Digital X-Ray']}
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

      {/* Update Scan Modal */}
      {selectedScan && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Radiology Scan: ${selectedScan.bookingRef}`}
          subtitle={`${selectedScan.testName} for ${selectedScan.patientName}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleUpdateStatus}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <Select
              label="Radiology Workflow Stage"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              options={['Slot Booked', 'Scan Scheduled', 'Scan Completed', 'Report Under Review', 'Report Published']}
            />
            {selectedScan.instructions && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <strong>Patient Prep Instructions:</strong> {selectedScan.instructions}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Radiology Scan"
        description={`Are you sure you want to delete scan record ${deleteTarget?.bookingRef} (${deleteTarget?.testName}) for patient ${deleteTarget?.patientName}? This action cannot be undone.`}
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}
