'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ordersRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import { Pill, CheckCircle, XCircle, Truck, Eye, FileText, AlertCircle } from 'lucide-react';

export default function PharmacyPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [quickRxOrder, setQuickRxOrder] = useState(null);

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
  } = useLocalFilters([], { defaultSortField: 'orderDate', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const res = await ordersRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadOrders();
  }, [setData]);

  const handleApprovePrescription = async (order) => {
    const updated = await ordersRepository.approvePrescription(order.id);
    setData(data.map((o) => (o.id === updated.id ? updated : o)));
    setQuickRxOrder(null);
    notify(`Prescription approved for ${order.orderNumber}. Order moved to packing.`);
  };

  const handleRejectPrescription = async (order) => {
    const updated = await ordersRepository.rejectPrescription(order.id, 'Prescription illegible or incomplete');
    setData(data.map((o) => (o.id === updated.id ? updated : o)));
    setQuickRxOrder(null);
    notify(`Prescription rejected for ${order.orderNumber}. Patient notified to re-upload.`);
  };

  const handleExport = () => {
    exportToCSV('mediunify_pharmacy_orders', data, [
      { header: 'Order Number', accessorKey: 'orderNumber' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Total Amount', accessorKey: 'totalAmount' },
      { header: 'Payment Status', accessorKey: 'paymentStatus' },
      { header: 'Prescription Required', accessorKey: 'prescriptionRequired' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Order Date', accessorKey: 'orderDate' },
    ]);
  };

  const columns = [
    {
      header: 'Order # & Date',
      accessorKey: 'orderNumber',
      cell: ({ row }) => (
        <div>
          <Link
            href={`/pharmacy/${row.id}`}
            className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
          >
            {row.orderNumber}
          </Link>
          <p className="text-[10px] text-slate-400 mt-0.5">{row.orderDate}</p>
        </div>
      ),
    },
    {
      header: 'Patient & Destination',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.patientName}</span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {row.uhid} • {row.city}
          </p>
        </div>
      ),
    },
    {
      header: 'Medicines & Items',
      accessorKey: 'items',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.items?.length} Medicine Item(s)
          </span>
          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
            {row.items?.map((i) => i.name).join(', ')}
          </p>
        </div>
      ),
    },
    {
      header: 'Order Total',
      accessorKey: 'totalAmount',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(row.totalAmount)}
          </span>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {row.paymentMethod} • {row.paymentStatus}
          </p>
        </div>
      ),
    },
    {
      header: 'Prescription Status',
      accessorKey: 'prescriptionRequired',
      cell: ({ row }) =>
        row.prescriptionRequired ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/60">
            <FileText className="w-3 h-3" /> Rx Required
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">OTC (No Rx)</span>
        ),
    },
    {
      header: 'Fulfillment Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/pharmacy/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Full Order Details">
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {row.status === 'Pending Verification' && (
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setQuickRxOrder(row)}
            >
              Verify Rx
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Doorstep Pharmacy Fulfillment & Dispatch
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Prescription verification queue, 15-minute express delivery allocation, and partner medical store routing in Karnataka.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pharmacy-delivery">
            <Button
              variant="outline"
              size="sm"
              icon={Truck}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800"
            >
              Delivery Boys Fleet
            </Button>
          </Link>
          <Link href="/delivery-payouts">
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            >
              Rider Payouts
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search pharmacy order by number, patient, UHID, medicines..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={[
            'Pending Verification',
            'Prescription Approved',
            'Packing',
            'Out for Delivery',
            'Delivered',
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

      {/* Quick Rx Review Modal */}
      {quickRxOrder && (
        <Modal
          isOpen={Boolean(quickRxOrder)}
          onClose={() => setQuickRxOrder(null)}
          title={`Prescription Review: ${quickRxOrder.orderNumber}`}
          subtitle={`Patient: ${quickRxOrder.patientName} (${quickRxOrder.uhid})`}
          footer={
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRejectPrescription(quickRxOrder)}
              >
                Reject Prescription
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprovePrescription(quickRxOrder)}
              >
                Approve & Allocate Inventory
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {quickRxOrder.prescriptionUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 max-h-64 flex items-center justify-center">
                <img
                  src={quickRxOrder.prescriptionUrl}
                  alt="Doctor Prescription"
                  className="object-contain w-full h-full max-h-64"
                />
              </div>
            )}

            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">Requested Prescription Drugs:</p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {quickRxOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                      <p className="text-[11px] text-slate-400">{item.dosage} • Qty: {item.quantity}</p>
                    </div>
                    {item.requiresPrescription ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Prescription Required
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">OTC</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
