'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usersRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import { Eye, Edit2, Trash2, UserPlus, Phone, MapPin, Heart } from 'lucide-react';

export default function PatientsPage() {
  const router = useRouter();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    uhid: `MU-${Math.floor(80000 + Math.random() * 10000)}`,
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    city: 'Mysuru',
    street: '',
    membershipTier: 'Standard',
  });

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
  } = useLocalFilters([], { defaultSortField: 'registeredDate', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadPatients() {
      setLoading(true);
      const res = await usersRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadPatients();
  }, [setData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.phone) {
      alert('Please fill in required patient details');
      return;
    }
    const created = await usersRepository.create({
      ...newPatient,
      age: Number(newPatient.age) || 28,
      address: {
        street: newPatient.street || 'Kuvempunagar',
        city: newPatient.city,
        state: 'Karnataka',
        pincode: '570023',
      },
      emergencyContact: {
        name: 'Emergency Guardian',
        relation: 'Spouse',
        phone: newPatient.phone,
      },
      status: 'Active',
      walletBalance: 1000,
      totalSpent: 0,
      familyMembersCount: 0,
      registeredDate: new Date().toISOString().slice(0, 10),
      lastActive: 'Just now',
    });

    setData([created, ...data]);
    setIsAddModalOpen(false);
    notify(`Created patient profile for ${created.name} (${created.uhid})`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await usersRepository.delete(deleteTarget.id);
    setData(data.filter((u) => u.id !== deleteTarget.id));
    notify(`Removed patient record ${deleteTarget.uhid}`);
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportToCSV('mediunify_patients', data, [
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Name', accessorKey: 'name' },
      { header: 'Phone', accessorKey: 'phone' },
      { header: 'Age', accessorKey: 'age' },
      { header: 'Gender', accessorKey: 'gender' },
      { header: 'Blood Group', accessorKey: 'bloodGroup' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Membership', accessorKey: 'membershipTier' },
      { header: 'Wallet Balance', accessorKey: 'walletBalance' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  const columns = [
    {
      header: 'Patient & UHID',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200/50">
            {row.name.charAt(0)}
          </div>
          <div>
            <Link
              href={`/patients/${row.id}`}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 transition-colors"
            >
              {row.name}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {row.uhid}
              </span>
              <span className="text-[10px] text-slate-400">
                • {row.age}y / {row.gender}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact & City',
      accessorKey: 'phone',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{row.phone}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{row.address?.city || row.city || 'Karnataka'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      accessorKey: 'bloodGroup',
      cell: ({ row }) => (
        <span className="font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md text-[11px] border border-rose-100 dark:border-rose-900">
          {row.bloodGroup}
        </span>
      ),
    },
    {
      header: 'Membership Tier',
      accessorKey: 'membershipTier',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
          {row.membershipTier || 'Standard'}
        </span>
      ),
    },
    {
      header: 'Wallet Balance',
      accessorKey: 'walletBalance',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.walletBalance || 0)}
        </span>
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
          <Link href={`/patients/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Patient Profile">
              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Patient Record"
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
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Patient Central Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registered patients across Karnataka with UHID health records, emergency contacts, and linked family profiles.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, UHID (e.g. MU-84920), phone..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Active', 'Suspended', 'Inactive']}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          onExport={handleExport}
          onAddClick={() => setIsAddModalOpen(true)}
          addLabel="Register Patient"
          onReset={resetFilters}
        />

        <DataTable
          columns={columns}
          data={paginatedData}
          isLoading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyTitle="No Patients Found"
          emptyDescription="No registered patient records matched your filter criteria."
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

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Patient Profile"
        subtitle="Generates unique MediUnify UHID and sets up digital health account"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreatePatient}>
              Save Patient Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Hemanth Gowda"
              value={newPatient.name}
              onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            />
            <Input
              label="Generated UHID"
              value={newPatient.uhid}
              disabled
              className="bg-slate-50 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              required
              placeholder="+91 97414 00000"
              value={newPatient.phone}
              onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="patient@example.com"
              value={newPatient.email}
              onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Age"
              type="number"
              placeholder="28"
              value={newPatient.age}
              onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
            />
            <Select
              label="Gender"
              value={newPatient.gender}
              onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
              options={['Male', 'Female', 'Other']}
            />
            <Select
              label="Blood Group"
              value={newPatient.bloodGroup}
              onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="City Hub"
              value={newPatient.city}
              onChange={(e) => setNewPatient({ ...newPatient, city: e.target.value })}
              options={['Mysuru', 'Bengaluru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi']}
            />
            <Select
              label="Membership Plan"
              value={newPatient.membershipTier}
              onChange={(e) => setNewPatient({ ...newPatient, membershipTier: e.target.value })}
              options={['Standard', 'MediUnify Care+', 'MediUnify Family Shield', 'Senior Gold']}
            />
          </div>

          <Input
            label="Residential Address"
            placeholder="House/Street, Locality"
            value={newPatient.street}
            onChange={(e) => setNewPatient({ ...newPatient, street: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Patient Record"
        description={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.uhid})? This is a demonstration deletion.`}
      />
    </div>
  );
}
