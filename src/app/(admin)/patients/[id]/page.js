'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usersRepository, familyMembersRepository, appointmentsRepository, ordersRepository } from '@/services/repositories';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  Wallet,
  Calendar,
  Pill,
  Users,
  Edit,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { notify } = useNotification();
  const [patient, setPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({});
  const [newFamily, setNewFamily] = useState({
    name: '',
    relation: 'Spouse',
    age: '',
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '',
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const user = await usersRepository.getById(params.id);
      if (user) {
        setPatient(user);
        setEditForm(user);
        const [famRes, aptRes, ordRes] = await Promise.all([
          familyMembersRepository.getByPatientId(user.id),
          appointmentsRepository.getAll({ search: user.name }),
          ordersRepository.getAll({ search: user.name }),
        ]);
        setFamilyMembers(famRes);
        setAppointments(aptRes.data);
        setOrders(ordRes.data);
      }
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  if (loading) {
    return <LoadingState message="Loading patient health records..." />;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Patient Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">No patient found matching record ID {params.id}</p>
        <Link href="/patients">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Patient Directory
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const updated = await usersRepository.update(patient.id, editForm);
    setPatient(updated);
    setIsEditModalOpen(false);
    notify(`Updated profile for ${updated.name}`);
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    const member = await familyMembersRepository.create({
      ...newFamily,
      patientId: patient.id,
      patientName: patient.name,
      uhid: patient.uhid,
      age: Number(newFamily.age) || 25,
    });
    setFamilyMembers([...familyMembers, member]);
    setIsAddFamilyModalOpen(false);
    notify(`Added ${member.name} (${member.relation}) to family unit`);
  };

  const handleToggleStatus = async () => {
    const nextStatus = patient.status === 'Active' ? 'Suspended' : 'Active';
    const updated = await usersRepository.update(patient.id, { status: nextStatus });
    setPatient(updated);
    notify(`Status updated to ${nextStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/patients">
            <Button variant="outline" size="sm" icon={ArrowLeft} className="h-9 w-9 p-0" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {patient.name}
              </h1>
              <Badge status={patient.status} size="sm" />
            </div>
            <p className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
              UHID: {patient.uhid} • Registered {formatDate(patient.registeredDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className={patient.status === 'Active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600'}
          >
            {patient.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Edit}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-extrabold text-base border border-teal-200">
            {patient.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase">Blood Group & Age</p>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {patient.bloodGroup} • {patient.age}y ({patient.gender})
            </h4>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Membership Tier</p>
            <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {patient.membershipTier || 'Standard Plan'}
            </h4>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Wallet Balance</p>
            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(patient.walletBalance || 0)}
            </h4>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 border border-purple-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Family Dependents</p>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {familyMembers.length} Members Linked
            </h4>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Patient Demographics' },
          { id: 'family', label: `Family Unit (${familyMembers.length})` },
          { id: 'appointments', label: `Appointments (${appointments.length})` },
          { id: 'orders', label: `Pharmacy Orders (${orders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview Demographics */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Contact & Residential Address" />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Primary Phone</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{patient.phone}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Email</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{patient.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">City Hub</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {patient.address?.city || 'Mysuru'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1.5">
                <span className="text-slate-400 font-medium">Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-xs">
                  {patient.address?.street}, {patient.address?.city} - {patient.address?.pincode}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Emergency Medical Contact & SOS" />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Guardian Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {patient.emergencyContact?.name || 'Priya Gowda'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Relationship</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {patient.emergencyContact?.relation || 'Spouse'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Emergency Phone</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {patient.emergencyContact?.phone || patient.phone}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] mt-2">
                This emergency contact is automatically designated for instant 1-touch ALS ambulance dispatches.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Family Unit */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Registered Family Members for {patient.name}
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddFamilyModalOpen(true)}
            >
              Add Family Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {familyMembers.map((fam) => (
              <Card key={fam.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                    {fam.relation}
                  </span>
                  <span className="text-xs font-bold text-rose-600">{fam.bloodGroup}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {fam.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {fam.age} years • {fam.gender}
                </p>
                {fam.chronicConditions?.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Conditions: </span>
                    {fam.chronicConditions.join(', ')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Appointments */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader title="Appointment Consultations Log" />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {appointments.length === 0 ? (
                <p className="p-6 text-center text-slate-400">No appointments recorded for this patient.</p>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{apt.doctorName}</p>
                      <p className="text-slate-400 text-[11px]">
                        {apt.specialization} • {apt.consultationType} • {apt.date} at {apt.timeSlot}
                      </p>
                    </div>
                    <Badge status={apt.status} size="sm" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader title="Doorstep Pharmacy Orders" />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {orders.length === 0 ? (
                <p className="p-6 text-center text-slate-400">No pharmacy orders for this patient.</p>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{ord.orderNumber}</p>
                      <p className="text-slate-400 text-[11px]">
                        {ord.items?.length} items • Ordered {ord.orderDate} • {formatCurrency(ord.totalAmount)}
                      </p>
                    </div>
                    <Badge status={ord.status} size="sm" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient Information"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateProfile}>
              Save Updates
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
          <Input
            label="Full Name"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="Phone Number"
            value={editForm.phone || ''}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Input
            label="Email"
            value={editForm.email || ''}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Blood Group"
              value={editForm.bloodGroup || 'O+'}
              onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
            />
            <Select
              label="Membership Plan"
              value={editForm.membershipTier || 'Standard'}
              onChange={(e) => setEditForm({ ...editForm, membershipTier: e.target.value })}
              options={['Standard', 'MediUnify Care+', 'MediUnify Family Shield', 'Senior Gold']}
            />
          </div>
        </form>
      </Modal>

      {/* Add Family Member Modal */}
      <Modal
        isOpen={isAddFamilyModalOpen}
        onClose={() => setIsAddFamilyModalOpen(false)}
        title="Add Dependent Family Member"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddFamilyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddFamilyMember}>
              Add Family Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddFamilyMember} className="space-y-3 text-xs">
          <Input
            label="Name"
            required
            placeholder="e.g. Meena Gowda"
            value={newFamily.name}
            onChange={(e) => setNewFamily({ ...newFamily, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Relationship"
              value={newFamily.relation}
              onChange={(e) => setNewFamily({ ...newFamily, relation: e.target.value })}
              options={['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister']}
            />
            <Input
              label="Age"
              type="number"
              value={newFamily.age}
              onChange={(e) => setNewFamily({ ...newFamily, age: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Gender"
              value={newFamily.gender}
              onChange={(e) => setNewFamily({ ...newFamily, gender: e.target.value })}
              options={['Female', 'Male', 'Other']}
            />
            <Select
              label="Blood Group"
              value={newFamily.bloodGroup}
              onChange={(e) => setNewFamily({ ...newFamily, bloodGroup: e.target.value })}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
