'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { BookingChart } from '@/components/dashboard/BookingChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  Users,
  IndianRupee,
  CalendarCheck,
  Pill,
  FlaskConical,
  AlertTriangle,
  ArrowRight,
  Plus,
  ShieldCheck,
  Activity,
  HeartPulse,
  CreditCard,
  Stethoscope,
  UserCheck,
  Truck,
  Bike,
  TestTube2,
  MapPin,
  PackageCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import {
  usersRepository,
  appointmentsRepository,
  doctorsRepository,
  doctorPaymentsRepository,
  cityServicesRepository,
  registrationRequestsRepository,
  deliveryStaffRepository,
  labCollectorsRepository,
  nursingProvidersRepository,
  equipmentProvidersRepository,
} from '@/services/repositories';

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    patients: 0,
    appointments: 0,
    doctors: 0,
    doctorEarningsMonth: 0,
    awaitingPaymentsCount: 0,
    cities: 0,
    pendingRegistrations: 0,
    // New metrics
    activeDeliveryStaff: 0,
    pendingDeliveryRequests: 0,
    outstandingDeliveryPayouts: 0,
    completedDeliveries: 0,
    activeLabCollectors: 0,
    pendingLabRequests: 0,
    activeNurses: 0,
    pendingNurseRequests: 0,
    activeEquipmentProviders: 0,
    pendingEquipmentRequests: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          patientsRes,
          appointmentsRes,
          doctorsRes,
          earningsRes,
          citiesRes,
          regCounts,
          deliveryCounts,
          labCounts,
          nursingCounts,
          equipmentCounts,
        ] = await Promise.all([
          usersRepository.getAll(),
          appointmentsRepository.getAll(),
          doctorsRepository.getAll(),
          doctorPaymentsRepository.getMonthlyDoctorEarnings('2026-10'),
          cityServicesRepository.getAllCities(),
          registrationRequestsRepository.getDashboardCounts(),
          deliveryStaffRepository.getDashboardCounts(),
          labCollectorsRepository.getDashboardCounts(),
          nursingProvidersRepository.getDashboardCounts(),
          equipmentProvidersRepository.getDashboardCounts(),
        ]);

        setCounts({
          patients: patientsRes.data?.length || 0,
          appointments: appointmentsRes.data?.length || 0,
          doctors: doctorsRes.data?.length || 0,
          doctorEarningsMonth: earningsRes?.summary?.totalEarnings || 0,
          awaitingPaymentsCount: earningsRes?.summary?.doctorsAwaitingPayment || 0,
          cities: citiesRes?.length || 0,
          pendingRegistrations: regCounts?.totalPending || 0,
          // New metrics
          activeDeliveryStaff: deliveryCounts?.activeStaff || 0,
          pendingDeliveryRequests: deliveryCounts?.pendingRequests || 0,
          outstandingDeliveryPayouts: deliveryCounts?.outstandingDues || 0,
          completedDeliveries: deliveryCounts?.completedDeliveries || 0,
          activeLabCollectors: labCounts?.activeCollectors || 0,
          pendingLabRequests: labCounts?.pendingRequests || 0,
          activeNurses: nursingCounts?.activeProviders || 0,
          pendingNurseRequests: nursingCounts?.pendingRequests || 0,
          activeEquipmentProviders: equipmentCounts?.activeProviders || 0,
          pendingEquipmentRequests: equipmentCounts?.pendingRequests || 0,
          loading: false,
        });
      } catch (err) {
        console.error('Failed to load dashboard dynamic stats:', err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#152e72] to-teal-800 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[11px] font-bold border border-teal-300/30">
              Karnataka Regional Command
            </span>
            <span className="text-xs text-slate-300">Mysuru Hub Lead</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            MediUnify Central Operations Portal
          </h1>
          <p className="text-xs text-slate-200 max-w-xl">
            Live monitoring for consultations, pharmacy fleet dispatches, lab sample collections, caregiver visits, biomedical rentals, and doctor settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/registration-requests">
            <Button
              variant="outline"
              size="sm"
              icon={UserCheck}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
            >
              Requests ({counts.pendingRegistrations} Pending)
            </Button>
          </Link>
          <Link href="/delivery-payouts">
            <Button
              variant="outline"
              size="sm"
              icon={CreditCard}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
            >
              Rider Payouts ({formatCurrency(counts.outstandingDeliveryPayouts)})
            </Button>
          </Link>
          <Link href="/city-operations">
            <Button
              variant="outline"
              size="sm"
              icon={MapPin}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
            >
              City Hubs
            </Button>
          </Link>
          <Link href="/emergency-sos">
            <Button
              variant="danger"
              size="sm"
              icon={AlertTriangle}
              className="bg-rose-500 hover:bg-rose-600 shadow-rose-900/40 text-xs font-bold"
            >
              1 Active SOS Alert
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Active Patients"
          value={counts.patients ? counts.patients.toLocaleString() : '...'}
          change="+12.4%"
          isPositive={true}
          icon={Users}
          accentColor="teal"
          description="Registered UHIDs"
        />
        <StatCard
          title="Doctor Earnings (Oct)"
          value={counts.doctorEarningsMonth ? formatCurrency(counts.doctorEarningsMonth) : '...'}
          change={`${counts.awaitingPaymentsCount} Unpaid`}
          isPositive={counts.awaitingPaymentsCount === 0}
          icon={IndianRupee}
          accentColor="green"
          description="Doctor monthly dues"
        />
        <StatCard
          title="Appointments Today"
          value={counts.appointments ? counts.appointments.toLocaleString() : '...'}
          change="+14.0%"
          isPositive={true}
          icon={CalendarCheck}
          accentColor="navy"
          description="OPD & Video visits"
        />
        <StatCard
          title="Empanelled Doctors"
          value={counts.doctors ? counts.doctors.toLocaleString() : '...'}
          change="Verified"
          isPositive={true}
          icon={Stethoscope}
          accentColor="purple"
          description="Across 18 Specialities"
        />
        <StatCard
          title="Pharmacy Fleet"
          value={`${counts.activeDeliveryStaff} Riders`}
          change={`${counts.pendingDeliveryRequests} Pending Req`}
          isPositive={counts.pendingDeliveryRequests === 0}
          icon={Truck}
          accentColor="teal"
          description={`${counts.completedDeliveries} completed dispatches`}
        />
        <StatCard
          title="Active SOS Alerts"
          value="1 Dispatched"
          change="Critical"
          isPositive={false}
          icon={AlertTriangle}
          accentColor="red"
          description="ALS Ambulance #4421"
        />
      </div>

      {/* Operational Field Staff & Home Care Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="p-4 border-l-4 border-l-teal-600 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">
              Pharmacy Delivery Boys
            </span>
            <Truck className="w-4 h-4 text-teal-600" />
          </div>
          <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {counts.activeDeliveryStaff} Active Riders
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {counts.pendingDeliveryRequests} self-registration requests pending review
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Outstanding Payouts:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(counts.outstandingDeliveryPayouts)}
            </span>
          </div>
        </Card>

        <Card hover className="p-4 border-l-4 border-l-blue-600 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
              Lab Test Collectors
            </span>
            <TestTube2 className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {counts.activeLabCollectors} Phlebotomists
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {counts.pendingLabRequests} applicant credentials pending verification
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Financial Policy:</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Clinical Only (No Payouts)</span>
          </div>
        </Card>

        <Card hover className="p-4 border-l-4 border-l-cyan-600 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
              Home Nursing Care
            </span>
            <UserCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {counts.activeNurses} Certified Nurses
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {counts.pendingNurseRequests} self-registration applications pending
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Licensing:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">KNC Statutory Roster</span>
          </div>
        </Card>

        <Card hover className="p-4 border-l-4 border-l-emerald-600 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              Equipment Rentals
            </span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {counts.activeEquipmentProviders} Empaneled Vendors
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {counts.pendingEquipmentRequests} provider onboarding requests pending
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Quality Standard:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Biomedical Certified</span>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <BookingChart />
        </div>
      </div>

      {/* Operational Task Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingTasks />
        <RecentActivity />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/pharmacy-delivery">
          <Card hover className="p-4 flex items-center justify-between group border-l-4 border-l-teal-500">
            <div>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Fleet Staff</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                Pharmacy Delivery Boys
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Rider roster & self-registrations</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
        <Link href="/delivery-payouts">
          <Card hover className="p-4 flex items-center justify-between group border-l-4 border-l-emerald-500">
            <div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Fleet Settlements</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                Delivery Boy Payouts
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Distance fees & IMPS payouts</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
        <Link href="/lab-collectors">
          <Card hover className="p-4 flex items-center justify-between group border-l-4 border-l-blue-500">
            <div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Diagnostic Staff</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                Lab Test Collectors
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Phlebotomists & DMLT review</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
        <Link href="/nursing">
          <Card hover className="p-4 flex items-center justify-between group border-l-4 border-l-cyan-500">
            <div>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">Caregiver Roster</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                Nursing & Attendants
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">KNC nurses & home shift visits</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
        <Link href="/equipment-rentals">
          <Card hover className="p-4 flex items-center justify-between group border-l-4 border-l-amber-500">
            <div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Medical Assets</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                Equipment Providers
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Oxygen, ICU beds & vendors</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
