'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { providersRepository, registrationRequestsRepository } from '@/services/repositories';
import { CentreRegistrationRequestsTab } from '@/components/registration/CentreRegistrationRequestsTab';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { exportToCSV } from '@/services/exportService';
import { useNotification } from '@/providers/AppProviders';
import { Building2, MapPin, Phone, Star, Plus, Eye, UserCheck } from 'lucide-react';

export default function ProvidersPage() {
  const { notify } = useNotification();
  const [mainTab, setMainTab] = useState('directory'); // 'directory' | 'requests'
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingCentreRequestsCount, setPendingCentreRequestsCount] = useState(0);

  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'Hospital',
    category: 'Tertiary Care Super-Speciality Hospital',
    city: 'Mysuru',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    commissionRate: '12%',
  });

  const {
    data,
    setData,
    paginatedData,
    totalRecords,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    cityFilter,
    setCityFilter,
    statusFilter,
    setStatusFilter,
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
  } = useLocalFilters([], { defaultSortField: 'rating', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadProviders() {
      setLoading(true);
      try {
        const [res, reqs] = await Promise.all([
          providersRepository.getAll(),
          registrationRequestsRepository.getCentreRequests(),
        ]);
        setData(res.data);
        const pending = reqs.filter((c) => c.status === 'Pending Review' || c.status === 'Additional Information Required').length;
        setPendingCentreRequestsCount(pending);
      } catch (err) {
        console.error('Failed to load providers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProviders();
  }, [setData]);

  const handleCreateProvider = async (e) => {
    e.preventDefault();
    if (!newProvider.name) return;

    const created = await providersRepository.create({
      ...newProvider,
      providerCode: `PRV-${Math.floor(10 + Math.random() * 90)}`,
      rating: 4.8,
      status: 'Active',
      servicesProvided: ['Outpatient Care', 'Diagnostics'],
    });

    setData([created, ...data]);
    setIsAddModalOpen(false);
    notify(`Empaneled partner provider ${created.name}`);
  };

  const handleExport = () => {
    exportToCSV('mediunify_providers', data, [
      { header: 'Provider Code', accessorKey: 'providerCode' },
      { header: 'Provider Name', accessorKey: 'name' },
      { header: 'Type', accessorKey: 'type' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Contact Person', accessorKey: 'contactPerson' },
      { header: 'Phone', accessorKey: 'phone' },
      { header: 'Commission', accessorKey: 'commissionRate' },
      { header: 'Rating', accessorKey: 'rating' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  const columns = [
    {
      header: 'Provider Name & Code',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200/50">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{row.name}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span className="font-mono font-semibold">{row.providerCode}</span>
              <span>• {row.category}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Partner Type',
      accessorKey: 'type',
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.type}
        </span>
      ),
    },
    {
      header: 'City Hub & Address',
      accessorKey: 'city',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.city}</span>
          <p className="text-[10px] text-slate-400 max-w-[180px] truncate mt-0.5">{row.address}</p>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessorKey: 'contactPerson',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-800 dark:text-slate-200">{row.contactPerson}</span>
          <p className="text-[10px] text-slate-400 mt-0.5">{row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Commission Split',
      accessorKey: 'commissionRate',
      cell: ({ row }) => (
        <span className="font-bold text-teal-600 dark:text-teal-400">{row.commissionRate}</span>
      ),
    },
    {
      header: 'Rating',
      accessorKey: 'rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-bold text-amber-500">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>{row.rating}</span>
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
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setSelectedProvider(row)}
          title="View Provider Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Hospital, Diagnostic & Pharmacy Providers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Empaneled tertiary hospitals, accredited radiology centers, and retail pharmacies across Karnataka.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Empanel Facility
          </Button>
        </div>
      </div>

      {/* Module Tabs: Empaneled Providers vs Centre Registration Requests */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setMainTab('directory')}
          className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            mainTab === 'directory'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empaneled Healthcare Facilities</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {data.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('requests')}
          className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            mainTab === 'requests'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Centre Registration Requests</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            {pendingCentreRequestsCount} Pending
          </span>
        </button>
      </div>

      {mainTab === 'requests' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 overflow-hidden">
          <CentreRegistrationRequestsTab
            onCentreApproved={(newProvider) => {
              setData([newProvider, ...data]);
              setPendingCentreRequestsCount(Math.max(0, pendingCentreRequestsCount - 1));
            }}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search provider by name, code, contact person..."
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categoryOptions={['Hospital', 'Diagnostic Center', 'Pharmacy', 'Nursing Agency']}
            cityFilter={cityFilter}
            onCityChange={setCityFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={['Active', 'Inactive']}
            onExport={handleExport}
            onAddClick={() => setIsAddModalOpen(true)}
            addLabel="Empanel Provider"
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
      )}

      {/* Provider Details Modal */}
      {selectedProvider && (
        <Modal
          isOpen={Boolean(selectedProvider)}
          onClose={() => setSelectedProvider(null)}
          title={selectedProvider.name}
          subtitle={`${selectedProvider.type} • ${selectedProvider.city}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedProvider(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Liaison & Contact</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedProvider.contactPerson}</p>
                <p className="text-slate-500 mt-0.5">{selectedProvider.phone}</p>
                <p className="text-slate-500">{selectedProvider.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Financial Terms</p>
                <p className="font-bold text-teal-600 dark:text-teal-400 mt-1">
                  Commission: {selectedProvider.commissionRate}
                </p>
                <p className="text-slate-500 mt-0.5">Rating: {selectedProvider.rating} / 5.0</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">Services Empaneled:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedProvider.servicesProvided?.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[11px] font-semibold border border-teal-200/50"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Provider Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Empanel New Healthcare Partner"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateProvider}>
              Save Provider
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProvider} className="space-y-3 text-xs">
          <Input
            label="Provider Facility Name"
            required
            placeholder="e.g. Apollo BGS Hospital"
            value={newProvider.name}
            onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Provider Type"
              value={newProvider.type}
              onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
              options={['Hospital', 'Diagnostic Center', 'Pharmacy', 'Nursing Agency']}
            />
            <Select
              label="City"
              value={newProvider.city}
              onChange={(e) => setNewProvider({ ...newProvider, city: e.target.value })}
              options={['Mysuru', 'Bengaluru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi']}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="Dr. Medical Director"
              value={newProvider.contactPerson}
              onChange={(e) => setNewProvider({ ...newProvider, contactPerson: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={newProvider.phone}
              onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })}
            />
          </div>
          <Input
            label="Address"
            placeholder="Street and Area"
            value={newProvider.address}
            onChange={(e) => setNewProvider({ ...newProvider, address: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
