'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { labBookingsRepository } from '@/services/repositories';
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
import { FlaskConical, User, Home, FileText, CheckCircle2, Clock, AlertTriangle, Trash2, TestTube2 } from 'lucide-react';

export default function LabTestsPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [phlebotomistName, setPhlebotomistName] = useState('Raghavendra K. (Collector #12)');
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
  } = useLocalFilters([], { defaultSortField: 'scheduledDate', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadLabTests() {
      setLoading(true);
      const res = await labBookingsRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadLabTests();
  }, [setData]);

  const handleAssignPhlebotomist = async () => {
    if (!selectedBooking) return;
    const updated = await labBookingsRepository.assignPhlebotomist(
      selectedBooking.id,
      phlebotomistName,
      '+91 97412 88410'
    );
    setData(data.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBooking(null);
    notify(`Assigned phlebotomist to ${updated.bookingRef}`);
  };

  const handleMarkReportReady = async (booking) => {
    const updated = await labBookingsRepository.update(booking.id, {
      status: 'Report Ready',
      reportUrl: `https://reports.mediunify.org/download/${booking.bookingRef}.pdf`,
    });
    setData(data.map((b) => (b.id === updated.id ? updated : b)));
    notify(`Published pathology report for ${booking.patientName}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await labBookingsRepository.delete(deleteTarget.id);
      setData(data.filter((b) => b.id !== deleteTarget.id));
      notify(`Deleted lab test booking ${deleteTarget.bookingRef} (${deleteTarget.testName})`, 'success');
    } catch (err) {
      notify(`Failed to delete lab booking: ${err.message}`, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportToCSV('mediunify_lab_tests', data, [
      { header: 'Booking Ref', accessorKey: 'bookingRef' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Test Name', accessorKey: 'testName' },
      { header: 'Category', accessorKey: 'category' },
      { header: 'Collection Type', accessorKey: 'collectionType' },
      { header: 'Scheduled Date', accessorKey: 'scheduledDate' },
      { header: 'Phlebotomist', accessorKey: 'phlebotomistName' },
      { header: 'Price', accessorKey: 'price' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  const columns = [
    {
      header: 'Booking Ref & Test',
      accessorKey: 'bookingRef',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.bookingRef}
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 max-w-xs">{row.testName}</p>
          <span className="text-[10px] text-slate-400">{row.category}</span>
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
      header: 'Collection Type',
      accessorKey: 'collectionType',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {row.collectionType === 'Home Sample Collection' ? (
            <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Doorstep Sample
            </span>
          ) : (
            <span className="text-blue-600 dark:text-blue-400">Center Visit</span>
          )}
        </div>
      ),
    },
    {
      header: 'Slot & Collector',
      accessorKey: 'scheduledDate',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-800 dark:text-slate-200">{row.scheduledDate}</span>
          <p className="text-[10px] text-slate-400">{row.scheduledTime}</p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
            {row.phlebotomistName || 'Unassigned'}
          </p>
        </div>
      ),
    },
    {
      header: 'Test Price',
      accessorKey: 'price',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.price)}</span>
      ),
    },
    {
      header: 'Report Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'Scheduled' && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setSelectedBooking(row)}
            >
              Assign Collector
            </Button>
          )}
          {row.status === 'Processing in Lab' && (
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => handleMarkReportReady(row)}
            >
              Publish Report
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Lab Test Record"
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
            Diagnostic Pathology & Lab Testing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            NABL accredited doorstep phlebotomy requests, blood draw tracking, and digital PDF pathology reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/lab-collectors">
            <Button
              variant="outline"
              size="sm"
              icon={TestTube2}
              className="text-xs font-bold text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
            >
              Phlebotomy Collectors Fleet
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search lab test by ref, test name, patient, category..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Scheduled', 'Sample Collected', 'Processing in Lab', 'Report Ready', 'Delivered']}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={['Hematology', 'Preventive Health', 'Endocrinology', 'Biochemistry', 'Cardiology Diagnostics']}
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

      {/* Assign Phlebotomist Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Assign Phlebotomist: ${selectedBooking.bookingRef}`}
          subtitle={`Home collection for ${selectedBooking.patientName} at ${selectedBooking.scheduledTime}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAssignPhlebotomist}>
                Assign & Dispatch Kit
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <Select
              label="Select Certified Phlebotomist"
              value={phlebotomistName}
              onChange={(e) => setPhlebotomistName(e.target.value)}
              options={[
                'Raghavendra K. (Collector #12 - Kuvempunagar Hub)',
                'Vinod Babu (Collector #08 - Bengaluru South)',
                'Deepak Sen (Collector #05 - Central Mysuru)',
                'Girish K. (Collector #14 - Hubballi)',
              ]}
            />
            <p className="text-slate-500">
              Assigned phlebotomist will receive patient address and barcode tubes on their MediUnify Field Collector App.
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Diagnostic Lab Test Booking"
        description={`Are you sure you want to delete lab booking ${deleteTarget?.bookingRef} (${deleteTarget?.testName}) for patient ${deleteTarget?.patientName}? This action cannot be undone.`}
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}
