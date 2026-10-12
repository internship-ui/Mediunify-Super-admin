'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { doctorsRepository, registrationRequestsRepository } from '@/services/repositories';
import { DoctorRegistrationRequestsTab } from '@/components/registration/DoctorRegistrationRequestsTab';
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
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  Stethoscope,
  Video,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Eye,
  Plus,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  User,
  Trash2,
  UserCheck,
} from 'lucide-react';

export default function DoctorsPage() {
  const { notify } = useNotification();
  const [mainTab, setMainTab] = useState('directory'); // 'directory' | 'requests'
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modeFilter, setModeFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Cardiology',
    experienceYears: '12',
    qualifications: 'MBBS, MD',
    medicalRegistrationNo: `KMC-${Math.floor(50000 + Math.random() * 40000)}`,
    city: 'Mysuru',
    // In-Clinic Physical Setup
    inClinicEnabled: 'true',
    inClinicFee: '750',
    clinicName: 'MediUnify Specialty Clinic',
    clinicAddress: 'Kuvempunagar, Mysuru',
    inClinicTimings: '09:30 AM - 01:30 PM',
    inClinicRoom: 'Consulting Room #2',
    // Video Call Telemedicine Setup
    videoCallEnabled: 'true',
    videoFee: '600',
    videoCallTimings: '05:00 PM - 08:00 PM',
    videoPlatform: 'MediUnify WebRTC 1080p HD',
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
  } = useLocalFilters([], { defaultSortField: 'rating', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadDoctors() {
      setLoading(true);
      try {
        const [res, reqs] = await Promise.all([
          doctorsRepository.getAll(),
          registrationRequestsRepository.getDoctorRequests(),
        ]);
        setData(res.data);
        const pending = reqs.filter((r) => r.status === 'Pending Review' || r.status === 'Additional Information Required').length;
        setPendingRequestsCount(pending);
      } catch (err) {
        console.error('Failed to load doctors data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, [setData]);

  const handleVerifyDoctor = async (doctor, newStatus) => {
    const updated = await doctorsRepository.verifyDoctor(doctor.id, newStatus);
    setData(data.map((d) => (d.id === updated.id ? updated : d)));
    notify(`${doctor.name} verification status set to ${newStatus}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await doctorsRepository.delete(deleteTarget.id);
      setData(data.filter((d) => d.id !== deleteTarget.id));
      notify(`Removed doctor profile for ${deleteTarget.name} (${deleteTarget.doctorCode})`, 'success');
      setDeleteTarget(null);
      if (selectedDoctor?.id === deleteTarget.id) {
        setSelectedDoctor(null);
      }
    } catch (err) {
      notify('Failed to delete doctor record.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!newDoctor.name) return;

    const inClinicOn = newDoctor.inClinicEnabled === 'true';
    const videoOn = newDoctor.videoCallEnabled === 'true';

    const modes = [];
    if (inClinicOn) modes.push('In-Clinic');
    if (videoOn) modes.push('Video Call');

    const created = await doctorsRepository.create({
      ...newDoctor,
      doctorCode: `DOC-${Math.floor(100 + Math.random() * 900)}`,
      experienceYears: Number(newDoctor.experienceYears) || 10,
      consultationModes: modes,
      inClinicEnabled: inClinicOn,
      inPersonFee: inClinicOn ? Number(newDoctor.inClinicFee) || 750 : 0,
      inClinicFee: inClinicOn ? Number(newDoctor.inClinicFee) || 750 : 0,
      inClinicTimings: newDoctor.inClinicTimings,
      inClinicRoom: newDoctor.inClinicRoom,
      clinic: {
        name: newDoctor.clinicName,
        address: newDoctor.clinicAddress,
        city: newDoctor.city,
        pincode: '570023',
        phone: newDoctor.phone,
      },
      videoCallEnabled: videoOn,
      videoFee: videoOn ? Number(newDoctor.videoFee) || 600 : 0,
      videoCallTimings: newDoctor.videoCallTimings,
      videoPlatform: newDoctor.videoPlatform,
      verificationStatus: 'Verified',
      status: 'Active',
      rating: 4.9,
      reviewsCount: 1,
      consultationsCount: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
    });

    setData([created, ...data]);
    setIsAddModalOpen(false);
    notify(`Registered ${created.name} (${created.specialization}) with distinct In-Clinic & Video configs`);
  };

  const handleExport = () => {
    exportToCSV('mediunify_doctors_directory', data, [
      { header: 'Doctor Code', accessorKey: 'doctorCode' },
      { header: 'Doctor Name', accessorKey: 'name' },
      { header: 'Specialization', accessorKey: 'specialization' },
      { header: 'Qualifications', accessorKey: 'qualifications' },
      { header: 'KMC Reg No', accessorKey: 'medicalRegistrationNo' },
      { header: 'City', accessorKey: 'city' },
      { header: 'In-Clinic Active', accessorKey: 'inClinicEnabled' },
      { header: 'In-Clinic Fee', accessorKey: 'inClinicFee' },
      { header: 'In-Clinic Timings', accessorKey: 'inClinicTimings' },
      { header: 'Video Active', accessorKey: 'videoCallEnabled' },
      { header: 'Video Fee', accessorKey: 'videoFee' },
      { header: 'Video Timings', accessorKey: 'videoCallTimings' },
      { header: 'KYC Status', accessorKey: 'verificationStatus' },
      { header: 'Platform Status', accessorKey: 'status' },
    ]);
  };

  // Filter paginated data also by Consultation Mode filter
  const displayedDoctors = paginatedData.filter((doc) => {
    if (modeFilter === 'In-Clinic') return doc.inClinicEnabled;
    if (modeFilter === 'Video Call') return doc.videoCallEnabled;
    if (modeFilter === 'Both') return doc.inClinicEnabled && doc.videoCallEnabled;
    return true;
  });

  const columns = [
    {
      header: 'Doctor Profile',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200/50">
            {row.name.replace('Dr. ', '').charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">{row.name}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{row.doctorCode}</span>
              <span>•</span>
              <span>{row.qualifications}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              KMC: {row.medicalRegistrationNo}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Specialization & City',
      accessorKey: 'specialization',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{row.specialization}</span>
          <span className="text-[10px] text-slate-400 block">{row.experienceYears} Years Exp</span>
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            {row.city}
          </span>
        </div>
      ),
    },
    {
      header: 'In-Clinic (OPD Physical)',
      accessorKey: 'inClinicFee',
      cell: ({ row }) => (
        <div className="text-xs">
          {row.inClinicEnabled !== false ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  In-Clinic Active
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(row.inClinicFee || row.inPersonFee)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                {row.clinic?.name}
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {row.inClinicTimings || '09:30 AM - 01:30 PM'}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <XCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>No In-Clinic OPD</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Video Call (Telemedicine)',
      accessorKey: 'videoFee',
      cell: ({ row }) => (
        <div className="text-xs">
          {row.videoCallEnabled !== false && row.videoFee > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/50 flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Video Active
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(row.videoFee)}
                </span>
              </div>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate max-w-[190px]">
                {row.videoPlatform || 'MediUnify WebRTC HD'}
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {row.videoCallTimings || '05:00 PM - 08:30 PM'}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <XCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>No Video Call</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'KYC & Rating',
      accessorKey: 'verificationStatus',
      cell: ({ row }) => (
        <div>
          <Badge status={row.verificationStatus} size="sm" />
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{row.rating || 4.8}</span>
            <span className="text-slate-400 font-normal">({row.reviewsCount || 100})</span>
          </div>
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
            className="h-8 w-8 p-0"
            title="View Doctor Details & Schedules"
            onClick={() => setSelectedDoctor(row)}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          </Button>

          {row.verificationStatus !== 'Verified' ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={() => handleVerifyDoctor(row, 'Verified')}
            >
              Verify KYC
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-slate-400 hover:text-rose-600"
              onClick={() => handleVerifyDoctor(row, 'Under Review')}
              title="Flag for audit"
            >
              Audit
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Doctor Record"
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
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Doctors & Clinical Specialists Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distinct management for <strong>In-Clinic Physical OPD</strong> visits and <strong>Virtual Video Call Consultations</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Register Specialist
          </Button>
        </div>
      </div>

      {/* Module Tabs: Active Directory vs Registration Requests */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setMainTab('directory')}
          className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            mainTab === 'directory'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Active Doctors Directory</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {data.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('requests')}
          className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            mainTab === 'requests'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Doctor Registration Requests</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            {pendingRequestsCount} Pending
          </span>
        </button>
      </div>

      {mainTab === 'requests' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 overflow-hidden">
          <DoctorRegistrationRequestsTab
            onDoctorApproved={(newDoctor) => {
              setData([newDoctor, ...data]);
              setPendingRequestsCount(Math.max(0, pendingRequestsCount - 1));
            }}
          />
        </div>
      ) : (
        <>
          {/* Mode Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-2">Mode:</span>
            {[
              { key: 'All', label: 'All Doctors' },
              { key: 'In-Clinic', label: 'In-Clinic OPD Only' },
              { key: 'Video Call', label: 'Video Call Only' },
              { key: 'Both', label: 'Both Modes Enabled' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setModeFilter(item.key)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  modeFilter === item.key
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search doctor by name, KMC registration, specialization, clinic..."
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              statusOptions={['Verified', 'Pending Verification', 'Under Review']}
              cityFilter={cityFilter}
              onCityChange={setCityFilter}
              onExport={handleExport}
              onReset={resetFilters}
            />

            <DataTable
              columns={columns}
              data={displayedDoctors}
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
        </>
      )}

      {/* Register Specialist Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register Specialist Physician"
          subtitle="Configure distinct fees and schedules for In-Clinic OPD and Video Call Consultations"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateDoctor}>
                Save Doctor & Publish
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs">
            {/* General Information */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                1. Doctor Identity & Medical Council Credentials
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name (with Title)"
                  placeholder="e.g. Dr. Ramesh Rao"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  required
                />
                <Select
                  label="Clinical Specialization"
                  value={newDoctor.specialization}
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                  options={[
                    { value: 'Cardiology', label: 'Cardiology' },
                    { value: 'Obstetrics & Gynaecology', label: 'Obstetrics & Gynaecology' },
                    { value: 'Neurology', label: 'Neurology' },
                    { value: 'Orthopedics', label: 'Orthopedics' },
                    { value: 'Pediatrics', label: 'Pediatrics' },
                    { value: 'Dermatology', label: 'Dermatology' },
                    { value: 'General Medicine', label: 'General Medicine' },
                    { value: 'General Surgery', label: 'General Surgery' },
                  ]}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="doctor@mediunify.org"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  required
                />
                <Input
                  label="Mobile Contact"
                  placeholder="+91 98450 12345"
                  value={newDoctor.phone}
                  onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                  required
                />
                <Input
                  label="KMC Medical Registration No"
                  placeholder="KMC-54219"
                  value={newDoctor.medicalRegistrationNo}
                  onChange={(e) => setNewDoctor({ ...newDoctor, medicalRegistrationNo: e.target.value })}
                  required
                />
                <Select
                  label="Practice City"
                  value={newDoctor.city}
                  onChange={(e) => setNewDoctor({ ...newDoctor, city: e.target.value })}
                  options={[
                    { value: 'Mysuru', label: 'Mysuru' },
                    { value: 'Bengaluru', label: 'Bengaluru' },
                    { value: 'Hubballi-Dharwad', label: 'Hubballi-Dharwad' },
                    { value: 'Mangaluru', label: 'Mangaluru' },
                    { value: 'Belagavi', label: 'Belagavi' },
                  ]}
                />
              </div>
            </div>

            {/* In-Clinic Physical Configuration */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  2. In-Clinic Physical Consultation Setup (OPD)
                </span>
                <Select
                  className="w-36 text-[11px]"
                  value={newDoctor.inClinicEnabled}
                  onChange={(e) => setNewDoctor({ ...newDoctor, inClinicEnabled: e.target.value })}
                  options={[
                    { value: 'true', label: 'In-Clinic Enabled' },
                    { value: 'false', label: 'In-Clinic Disabled' },
                  ]}
                />
              </div>

              {newDoctor.inClinicEnabled === 'true' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Input
                    label="In-Clinic OPD Fee (₹)"
                    type="number"
                    placeholder="750"
                    value={newDoctor.inClinicFee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, inClinicFee: e.target.value })}
                  />
                  <Input
                    label="Clinic / Hospital Name"
                    placeholder="e.g. Unnathi Heart Care Clinic"
                    value={newDoctor.clinicName}
                    onChange={(e) => setNewDoctor({ ...newDoctor, clinicName: e.target.value })}
                  />
                  <Input
                    label="Physical Address & Area"
                    placeholder="e.g. Kuvempunagar, Mysuru"
                    value={newDoctor.clinicAddress}
                    onChange={(e) => setNewDoctor({ ...newDoctor, clinicAddress: e.target.value })}
                  />
                  <Input
                    label="In-Clinic OPD Hours"
                    placeholder="09:30 AM - 01:30 PM"
                    value={newDoctor.inClinicTimings}
                    onChange={(e) => setNewDoctor({ ...newDoctor, inClinicTimings: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Video Call Telemedicine Configuration */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-200 text-xs flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  3. Video Call Telemedicine Setup
                </span>
                <Select
                  className="w-36 text-[11px]"
                  value={newDoctor.videoCallEnabled}
                  onChange={(e) => setNewDoctor({ ...newDoctor, videoCallEnabled: e.target.value })}
                  options={[
                    { value: 'true', label: 'Video Call Enabled' },
                    { value: 'false', label: 'Video Call Disabled' },
                  ]}
                />
              </div>

              {newDoctor.videoCallEnabled === 'true' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Input
                    label="Video Consultation Fee (₹)"
                    type="number"
                    placeholder="600"
                    value={newDoctor.videoFee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, videoFee: e.target.value })}
                  />
                  <Input
                    label="Video Slot Hours"
                    placeholder="05:00 PM - 08:30 PM"
                    value={newDoctor.videoCallTimings}
                    onChange={(e) => setNewDoctor({ ...newDoctor, videoCallTimings: e.target.value })}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Virtual Telehealth Room Platform"
                      value={newDoctor.videoPlatform}
                      onChange={(e) => setNewDoctor({ ...newDoctor, videoPlatform: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Doctor Detailed Profile Modal with Distinct Sections */}
      {selectedDoctor && (
        <Modal
          isOpen={Boolean(selectedDoctor)}
          onClose={() => setSelectedDoctor(null)}
          title={`Doctor Profile — ${selectedDoctor.name}`}
          subtitle={`${selectedDoctor.specialization} • KMC Reg: ${selectedDoctor.medicalRegistrationNo} • Code: ${selectedDoctor.doctorCode}`}
          footer={
            <Button variant="primary" size="sm" onClick={() => setSelectedDoctor(null)}>
              Close Profile
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedDoctor.name}</p>
                <p className="text-slate-500 mt-0.5">{selectedDoctor.qualifications} • {selectedDoctor.experienceYears} Years Experience</p>
              </div>
              <div className="text-right">
                <Badge status={selectedDoctor.verificationStatus} size="sm" />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{selectedDoctor.medicalRegistrationNo}</p>
              </div>
            </div>

            {/* In-Clinic Physical OPD Setup Card */}
            <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    In-Clinic Physical Consultation Setup (OPD)
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedDoctor.inClinicEnabled !== false
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {selectedDoctor.inClinicEnabled !== false ? 'In-Clinic Active' : 'Not Offered'}
                </span>
              </div>

              {selectedDoctor.inClinicEnabled !== false ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">In-Clinic OPD Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(selectedDoctor.inClinicFee || selectedDoctor.inPersonFee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Clinic Location:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDoctor.clinic?.name}, {selectedDoctor.clinic?.address}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">OPD Hours:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDoctor.inClinicTimings || selectedDoctor.opdHours || '09:30 AM - 01:30 PM'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Room / Chamber:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDoctor.inClinicRoom || 'OPD Consulting Chamber'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">
                  This doctor is currently registered for virtual tele-consultations only. Physical in-clinic visits are not offered.
                </p>
              )}
            </div>

            {/* Video Call Telemedicine Setup Card */}
            <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    Video Call Telemedicine Setup (Virtual Room)
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedDoctor.videoCallEnabled !== false && selectedDoctor.videoFee > 0
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {selectedDoctor.videoCallEnabled !== false && selectedDoctor.videoFee > 0
                    ? 'Video Call Active'
                    : 'Not Offered'}
                </span>
              </div>

              {selectedDoctor.videoCallEnabled !== false && selectedDoctor.videoFee > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Video Consultation Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(selectedDoctor.videoFee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Virtual Room Platform:</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {selectedDoctor.videoPlatform || 'MediUnify WebRTC 1080p HD'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Video Slot Timings:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDoctor.videoCallTimings || '05:00 PM - 08:30 PM'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Session Recording:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Auto-Recorded & Encrypted for Admin Audit
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">
                  Video consultations are disabled for this doctor. Patient visits require physical clinical examination.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Doctor Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Doctor Record"
        description={`Are you sure you want to remove doctor profile for ${deleteTarget?.name} (${deleteTarget?.doctorCode} • ${deleteTarget?.specialization})? This demonstration deletion removes the doctor from the registry.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
