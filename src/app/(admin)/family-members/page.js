'use client';

import React, { useState, useEffect } from 'react';
import { familyMembersRepository } from '@/services/repositories';
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
import { Users, Heart, Phone, Shield, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function FamilyMembersPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newMember, setNewMember] = useState({
    name: '',
    patientName: 'Hemanth Gowda',
    uhid: 'MU-84920',
    relation: 'Father',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    chronicConditions: '',
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
  } = useLocalFilters([], { defaultSortField: 'name', defaultSortDirection: 'asc' });

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      const res = await familyMembersRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadMembers();
  }, [setData]);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!newMember.name) return;

    const created = await familyMembersRepository.create({
      ...newMember,
      age: Number(newMember.age) || 30,
      chronicConditions: newMember.chronicConditions ? newMember.chronicConditions.split(',').map(s => s.trim()) : [],
    });

    setData([created, ...data]);
    setIsAddModalOpen(false);
    notify(`Added ${created.name} (${created.relation})`);
  };

  const handleExport = () => {
    exportToCSV('mediunify_family_members', data, [
      { header: 'Family Member Name', accessorKey: 'name' },
      { header: 'Primary Account UHID', accessorKey: 'uhid' },
      { header: 'Primary Patient', accessorKey: 'patientName' },
      { header: 'Relation', accessorKey: 'relation' },
      { header: 'Age', accessorKey: 'age' },
      { header: 'Gender', accessorKey: 'gender' },
      { header: 'Blood Group', accessorKey: 'bloodGroup' },
      { header: 'Phone', accessorKey: 'phone' },
    ]);
  };

  const columns = [
    {
      header: 'Family Member',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200/50">
            {row.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{row.name}</span>
            <div className="text-[10px] text-slate-400">
              {row.age}y • {row.gender}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Relation to Primary Account',
      accessorKey: 'relation',
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/40">
          {row.relation}
        </span>
      ),
    },
    {
      header: 'Primary Account Holder',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.patientName || 'Primary Patient'}
          </span>
          <p className="font-mono text-[10px] text-slate-400">{row.uhid}</p>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      accessorKey: 'bloodGroup',
      cell: ({ row }) => (
        <span className="font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded text-[11px]">
          {row.bloodGroup}
        </span>
      ),
    },
    {
      header: 'Health Notes & Chronic Conditions',
      accessorKey: 'chronicConditions',
      cell: ({ row }) => (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {row.chronicConditions && row.chronicConditions.length > 0 ? (
            row.chronicConditions.join(', ')
          ) : (
            <span className="text-slate-400 italic">None reported</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
          onClick={async () => {
            await familyMembersRepository.delete(row.id);
            setData(data.filter((f) => f.id !== row.id));
            notify(`Removed ${row.name}`);
          }}
          title="Remove dependent"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Family Dependents Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-referenced family members covered under MediUnify patient accounts for appointments and consultations.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by member name, primary patient, UHID..."
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother']}
          onExport={handleExport}
          onAddClick={() => setIsAddModalOpen(true)}
          addLabel="Add Dependent"
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

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Family Dependent"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateMember}>
              Save Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
          <Input
            label="Member Full Name"
            required
            placeholder="e.g. Suresh Kumar"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Primary Account UHID"
              value={newMember.uhid}
              onChange={(e) => setNewMember({ ...newMember, uhid: e.target.value })}
            />
            <Select
              label="Relationship"
              value={newMember.relation}
              onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
              options={['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister']}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Age"
              type="number"
              value={newMember.age}
              onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
            />
            <Select
              label="Gender"
              value={newMember.gender}
              onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
              options={['Male', 'Female', 'Other']}
            />
            <Select
              label="Blood Group"
              value={newMember.bloodGroup}
              onChange={(e) => setNewMember({ ...newMember, bloodGroup: e.target.value })}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
            />
          </div>
          <Input
            label="Chronic Conditions (comma separated)"
            placeholder="e.g. Hypertension, Diabetes"
            value={newMember.chronicConditions}
            onChange={(e) => setNewMember({ ...newMember, chronicConditions: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
