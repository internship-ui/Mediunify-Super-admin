'use client';

import React, { useState, useEffect } from 'react';
import { ambulanceRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { exportToCSV } from '@/services/exportService';
import { useNotification } from '@/providers/AppProviders';
import {
  AlertTriangle,
  Siren,
  PhoneCall,
  MapPin,
  Building2,
  UserCheck,
  Clock,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export default function EmergencySosPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [selectedSos, setSelectedSos] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState('En Route to Patient');

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
  } = useLocalFilters([], { defaultSortField: 'requestTime', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadDispatches() {
      setLoading(true);
      const res = await ambulanceRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadDispatches();
  }, [setData]);

  const handleUpdateStatus = async () => {
    if (!selectedSos) return;
    const updated = await ambulanceRepository.updateDispatchStatus(selectedSos.id, dispatchStatus);
    setData(data.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedSos(null);
    notify(`Emergency response updated: ${dispatchStatus}`);
  };

  const handleExport = () => {
    exportToCSV('mediunify_emergency_dispatches', data, [
      { header: 'Dispatch Ref', accessorKey: 'dispatchRef' },
      { header: 'Caller Name', accessorKey: 'callerName' },
      { header: 'Caller Phone', accessorKey: 'callerPhone' },
      { header: 'Condition', accessorKey: 'patientCondition' },
      { header: 'Severity', accessorKey: 'severity' },
      { header: 'Vehicle No', accessorKey: 'ambulanceVehicleNo' },
      { header: 'Ambulance Type', accessorKey: 'ambulanceType' },
      { header: 'Destination Hospital', accessorKey: 'destinationHospital' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Request Time', accessorKey: 'requestTime' },
    ]);
  };

  const columns = [
    {
      header: 'SOS Ref & Triage Severity',
      accessorKey: 'dispatchRef',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
            <span className="text-rose-600 dark:text-rose-400">{row.dispatchRef}</span>
          </div>
          <div className="mt-1">
            <Badge status={row.severity} size="sm" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{row.requestTime}</p>
        </div>
      ),
    },
    {
      header: 'Emergency Condition & Caller',
      accessorKey: 'patientCondition',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.emergencyCategory}</span>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium line-clamp-2 mt-0.5">
            {row.patientCondition}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <PhoneCall className="w-3 h-3 text-slate-400" />
            <span>{row.callerName} ({row.callerPhone})</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Pickup & Hospital Route',
      accessorKey: 'pickupAddress',
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="flex items-start gap-1 text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{row.pickupAddress}</span>
          </div>
          <div className="flex items-start gap-1 text-slate-700 dark:text-slate-300 mt-1">
            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
            <span className="font-semibold text-teal-700 dark:text-teal-400 line-clamp-1">
              {row.destinationHospital}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Ambulance Fleet',
      accessorKey: 'ambulanceVehicleNo',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
            {row.ambulanceVehicleNo}
          </span>
          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{row.ambulanceType}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Driver: {row.driverName} • EMT: {row.paramedicName}
          </p>
        </div>
      ),
    },
    {
      header: 'Live Dispatch Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="danger"
            size="sm"
            className="text-xs h-7 px-2 font-bold bg-rose-600 hover:bg-rose-700"
            onClick={() => {
              setSelectedSos(row);
              setDispatchStatus(row.status);
            }}
          >
            Live Tracking
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Alert Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Radio className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-base font-black">24x7 Emergency SOS & Ambulance Control Room</h2>
            <p className="text-xs text-rose-100">
              Karnataka Real-Time Emergency Fleet Response — Priority Triage with Hospital ER Integration
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-200">Emergency Target</span>
          <p className="text-lg font-black text-white">Under 12 Mins</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search SOS by ref, caller, patient condition, hospital..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={[
            'SOS Triggered',
            'Ambulance Assigned',
            'En Route to Patient',
            'Patient Onboard',
            'Arrived at Hospital',
            'Handover Complete',
          ]}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={[
            'Cardiac Emergency',
            'Stroke / Neurological',
            'Severe Trauma / Accident',
            'General Critical',
          ]}
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

      {/* Live Tracking Modal */}
      {selectedSos && (
        <Modal
          isOpen={Boolean(selectedSos)}
          onClose={() => setSelectedSos(null)}
          title={`Emergency SOS Live Coordination: ${selectedSos.dispatchRef}`}
          subtitle={`${selectedSos.emergencyCategory} (${selectedSos.severity})`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectedSos(null)}>
                Close
              </Button>
              <Button variant="danger" size="sm" onClick={handleUpdateStatus}>
                Update Dispatch Status
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <p className="font-bold text-rose-800 dark:text-rose-300 text-sm">
                Patient Triage Condition:
              </p>
              <p className="text-rose-700 dark:text-rose-400 mt-1 font-medium text-xs leading-relaxed">
                {selectedSos.patientCondition}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Vehicle & Crew</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedSos.ambulanceVehicleNo}</p>
                <p className="text-slate-500 mt-0.5">Driver: {selectedSos.driverName} ({selectedSos.driverPhone})</p>
                <p className="text-slate-500">Paramedic: {selectedSos.paramedicName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Triage Destination</p>
                <p className="font-bold text-teal-700 dark:text-teal-400 mt-0.5">{selectedSos.destinationHospital}</p>
                <p className="text-slate-500 mt-0.5">Dispatched: {selectedSos.dispatchTime}</p>
              </div>
            </div>

            <Select
              label="Live Response Progression"
              value={dispatchStatus}
              onChange={(e) => setDispatchStatus(e.target.value)}
              options={[
                'SOS Triggered',
                'Ambulance Assigned',
                'En Route to Patient',
                'Patient Onboard',
                'Arrived at Hospital',
                'Handover Complete',
                'False Alarm / Cancelled',
              ]}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
