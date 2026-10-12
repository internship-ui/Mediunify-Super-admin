'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { doctorPaymentsRepository, doctorsRepository } from '@/services/repositories';
import { StatCard } from '@/components/dashboard/StatCard';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  History,
  Send,
  Calendar,
  Filter,
  FileText,
  Printer,
  Download,
  Building2,
  Stethoscope,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function DoctorPaymentsPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);

  // Period filter: '2026-10' (Current Month), '2026-09' (Previous Month), or 'all'
  const [selectedPeriod, setSelectedPeriod] = useState('2026-10');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Data states
  const [earningsData, setEarningsData] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalEarningsMonth: 0,
    totalAlreadyPaidMonth: 0,
    totalOutstandingMonth: 0,
    awaitingPaymentCount: 0,
    totalDoctorsCount: 0,
  });
  const [allDoctorsList, setAllDoctorsList] = useState([]);

  // Modals state
  const [breakdownDoctor, setBreakdownDoctor] = useState(null);
  const [breakdownItems, setBreakdownItems] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const [paymentModalDoctor, setPaymentModalDoctor] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    paymentAmount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'IMPS Bank Transfer',
    transactionRef: '',
    remarks: '',
    authorizeAdjustment: false,
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [historyDoctor, setHistoryDoctor] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [receiptRecord, setReceiptRecord] = useState(null);

  // Settlement modal state
  const [settlementDoctor, setSettlementDoctor] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const docsRes = await doctorsRepository.getAll();
      setAllDoctorsList(docsRes.data);

      const res = await doctorPaymentsRepository.getDoctorEarnings(selectedPeriod, {
        search,
        paymentStatus: paymentStatusFilter,
        doctorId: selectedDoctorFilter,
      });

      setEarningsData(res.earnings);
      setSummaryMetrics(res.summary);
    } catch (err) {
      notify('Failed to load doctor earnings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, paymentStatusFilter, selectedDoctorFilter, search]);

  // Open itemized monthly earnings breakdown
  const handleViewBreakdown = async (doctorRow) => {
    setBreakdownDoctor(doctorRow);
    setBreakdownLoading(true);
    try {
      const items = await doctorPaymentsRepository.getDoctorAppointmentBreakdown(
        doctorRow.doctorId,
        selectedPeriod
      );
      setBreakdownItems(items);
    } catch (err) {
      notify('Failed to load monthly earnings breakdown', 'error');
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Open payment history for a doctor
  const handleViewHistory = async (doctorRow) => {
    setHistoryDoctor(doctorRow);
    setHistoryLoading(true);
    try {
      const history = await doctorPaymentsRepository.getPaymentHistory(
        doctorRow.doctorId,
        selectedPeriod === 'all' ? null : selectedPeriod
      );
      setHistoryItems(history);
    } catch (err) {
      notify('Failed to load payment history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Make Payment Form
  const handleOpenPayment = (doctorRow) => {
    setPaymentModalDoctor(doctorRow);
    setPaymentFormData({
      paymentAmount: doctorRow.remainingBalance > 0 ? doctorRow.remainingBalance.toString() : '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'IMPS Bank Transfer',
      transactionRef: `TXN-DR-${Date.now().toString().slice(-6)}`,
      remarks: `Consultation payout for ${doctorRow.periodLabel}`,
      authorizeAdjustment: false,
    });
  };

  // Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalDoctor) return;

    const amount = Number(paymentFormData.paymentAmount);
    if (!amount || amount <= 0) {
      notify('Please enter a valid payment amount.', 'warning');
      return;
    }

    if (amount > paymentModalDoctor.remainingBalance && !paymentFormData.authorizeAdjustment) {
      notify(
        `Payment (₹${amount}) exceeds remaining balance of ₹${paymentModalDoctor.remainingBalance}. Tick override adjustment if intended.`,
        'warning'
      );
      return;
    }

    setPaymentSubmitting(true);
    try {
      const createdPayment = await doctorPaymentsRepository.recordPayment({
        doctorId: paymentModalDoctor.doctorId,
        doctorCode: paymentModalDoctor.doctorCode,
        doctorName: paymentModalDoctor.doctorName,
        specialization: paymentModalDoctor.specialization,
        period: selectedPeriod === 'all' ? '2026-10' : selectedPeriod,
        paymentAmount: amount,
        paymentDate: paymentFormData.paymentDate,
        paymentMethod: paymentFormData.paymentMethod,
        transactionRef: paymentFormData.transactionRef,
        remarks: paymentFormData.remarks,
        authorizeAdjustment: paymentFormData.authorizeAdjustment,
      });

      notify(
        `Successfully recorded payment of ${formatCurrency(amount)} to ${paymentModalDoctor.doctorName}`,
        'success'
      );

      // Generate receipt
      setReceiptRecord({
        ...createdPayment,
        doctor: paymentModalDoctor,
      });

      setPaymentModalDoctor(null);
      await loadData();
    } catch (err) {
      notify(err.message || 'Payment recording failed.', 'error');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Settle Outstanding Balance
  const handleSettleDoctor = async (doctorRow) => {
    if (doctorRow.remainingBalance <= 0) {
      notify('Doctor has no outstanding balance for this month.', 'info');
      return;
    }
    setSettlementDoctor(doctorRow);
  };

  const confirmSettlement = async () => {
    if (!settlementDoctor) return;
    try {
      const result = await doctorPaymentsRepository.settleMonthlyBalance(
        settlementDoctor.doctorId,
        selectedPeriod === 'all' ? '2026-10' : selectedPeriod,
        'NEFT Bank Transfer',
        `Full monthly settlement statement clearance for ${settlementDoctor.periodLabel}`
      );
      notify(
        `Settled full balance ${formatCurrency(settlementDoctor.remainingBalance)} for ${settlementDoctor.doctorName}`,
        'success'
      );
      setSettlementDoctor(null);
      setReceiptRecord({
        ...result,
        doctor: settlementDoctor,
      });
      await loadData();
    } catch (err) {
      notify(err.message || 'Settlement failed', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    exportToCSV(`mediunify_doctor_earnings_${selectedPeriod}`, earningsData, [
      { header: 'Doctor Code', accessorKey: 'doctorCode' },
      { header: 'Doctor Name', accessorKey: 'doctorName' },
      { header: 'Specialization', accessorKey: 'specialization' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Period', accessorKey: 'periodLabel' },
      { header: 'Eligible Appointments', accessorKey: 'eligibleAppointmentsCount' },
      { header: 'Consultation Volume', accessorKey: 'totalConsultationVolume' },
      { header: 'Gross Earnings (80%)', accessorKey: 'grossDoctorEarnings' },
      { header: 'TDS Deduction (10%)', accessorKey: 'deductions' },
      { header: 'Total Payable', accessorKey: 'totalPayableAmount' },
      { header: 'Amount Paid', accessorKey: 'amountAlreadyPaid' },
      { header: 'Remaining Balance', accessorKey: 'remainingBalance' },
      { header: 'Last Payment Date', accessorKey: 'lastPaymentDate' },
      { header: 'Payment Status', accessorKey: 'paymentStatus' },
    ]);
  };

  // Paginated Data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return earningsData.slice(startIndex, startIndex + pageSize);
  }, [earningsData, page, pageSize]);

  const totalPages = Math.ceil(earningsData.length / pageSize) || 1;

  // Table Columns
  const columns = [
    {
      header: 'Doctor Details',
      accessorKey: 'doctorName',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200/50">
            {row.doctorName.replace('Dr. ', '').charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
              {row.doctorName}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                {row.doctorCode}
              </span>
              <span>•</span>
              <span>{row.specialization}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{row.city}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Eligible Appointments',
      accessorKey: 'eligibleAppointmentsCount',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {row.eligibleAppointmentsCount} Completed
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Share: {row.commissionRate}% of fees
          </p>
          {row.cancelledAppointmentsCount > 0 && (
            <p className="text-[10px] text-rose-500">
              ({row.cancelledAppointmentsCount} Cancelled/Refunded Excluded)
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Calculated Earnings & TDS',
      accessorKey: 'grossDoctorEarnings',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Gross: {formatCurrency(row.grossDoctorEarnings)}
          </div>
          <p className="text-[10px] text-slate-500">
            TDS (10%): -{formatCurrency(row.deductions)}
          </p>
          <div className="font-bold text-teal-700 dark:text-teal-400 text-xs">
            Net: {formatCurrency(row.totalPayableAmount)}
          </div>
        </div>
      ),
    },
    {
      header: 'Paid & Outstanding Balance',
      accessorKey: 'remainingBalance',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <div className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
            Paid: {formatCurrency(row.amountAlreadyPaid)}
          </div>
          <div
            className={`font-black text-xs ${
              row.remainingBalance > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Balance: {formatCurrency(row.remainingBalance)}
          </div>
          <p className="text-[10px] text-slate-400">
            Last Paid: {row.lastPaymentDate}
          </p>
        </div>
      ),
    },
    {
      header: 'Payment Status',
      accessorKey: 'paymentStatus',
      cell: ({ row }) => <Badge status={row.paymentStatus} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-700"
            title="View Itemized Appointments Breakdown"
            onClick={() => handleViewBreakdown(row)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Earnings
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-slate-500 hover:text-blue-600"
            title="View Past Payment Receipts"
            onClick={() => handleViewHistory(row)}
          >
            <History className="w-3.5 h-3.5 mr-1" />
            History
          </Button>

          {row.remainingBalance > 0 ? (
            <Button
              variant="primary"
              size="sm"
              className="h-8 px-2.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
              onClick={() => handleOpenPayment(row)}
            >
              <Send className="w-3 h-3 mr-1" />
              Pay
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs text-slate-400 cursor-default"
              disabled
            >
              <Check className="w-3 h-3 mr-1" />
              Settled
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Doctor Payments & Earnings Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50">
              Karnataka Network
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track monthly consultation doctor earnings, configure commission rates, record disbursements, and settle monthly accounts.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
          <button
            onClick={() => {
              setSelectedPeriod('2026-10');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedPeriod === '2026-10'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Current Month (Oct 2026)
          </button>
          <button
            onClick={() => {
              setSelectedPeriod('2026-09');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedPeriod === '2026-09'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Previous Month (Sep 2026)
          </button>
          <button
            onClick={() => {
              setSelectedPeriod('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedPeriod === 'all'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Doctor Earnings"
          value={formatCurrency(summaryMetrics.totalEarningsMonth)}
          change={selectedPeriod === '2026-10' ? 'October 2026' : selectedPeriod === '2026-09' ? 'September 2026' : 'Cumulative'}
          isPositive={true}
          icon={IndianRupee}
          accentColor="teal"
          description="Net payable post-commission & TDS"
        />
        <StatCard
          title="Total Amount Already Paid"
          value={formatCurrency(summaryMetrics.totalAlreadyPaidMonth)}
          change="Recorded"
          isPositive={true}
          icon={CheckCircle2}
          accentColor="green"
          description="Disbursed via IMPS / NEFT / UPI"
        />
        <StatCard
          title="Total Outstanding Dues"
          value={formatCurrency(summaryMetrics.totalOutstandingMonth)}
          change="Awaiting Payout"
          isPositive={summaryMetrics.totalOutstandingMonth === 0}
          icon={AlertCircle}
          accentColor="red"
          description="Remaining settlement balance"
        />
        <StatCard
          title="Doctors Awaiting Payment"
          value={summaryMetrics.awaitingPaymentCount.toString()}
          change={`${summaryMetrics.totalDoctorsCount} Total Empaneled`}
          isPositive={summaryMetrics.awaitingPaymentCount === 0}
          icon={CreditCard}
          accentColor="navy"
          description="Physicians with outstanding balance"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search by doctor name, code, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Doctor Filter */}
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Doctors</option>
              {allDoctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialization})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="No Dues">No Dues (0 Appts)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="text-xs"
              onClick={handleExportCSV}
            >
              Export Statement CSV
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedData}
          isLoading={loading}
          emptyTitle="No Doctor Earnings Found"
          emptyDescription="No doctor records matched your period or filter criteria."
        />

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={earningsData.length}
        />
      </div>

      {/* MODAL 1: Monthly Appointment Earnings Breakdown */}
      <Modal
        isOpen={Boolean(breakdownDoctor)}
        onClose={() => setBreakdownDoctor(null)}
        maxWidth="max-w-4xl"
        title={`Monthly Earnings Breakdown: ${breakdownDoctor?.doctorName}`}
        subtitle={`Period: ${breakdownDoctor?.periodLabel} • Doctor Code: ${breakdownDoctor?.doctorCode} • Configured Share: ${breakdownDoctor?.commissionRate}%`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Total Net Payable: {formatCurrency(breakdownDoctor?.totalPayableAmount || 0)}
              </span>
              <span className="mx-2 text-slate-300">•</span>
              <span className="font-bold text-rose-600">
                Outstanding: {formatCurrency(breakdownDoctor?.remainingBalance || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setBreakdownDoctor(null)}>
                Close
              </Button>
              {breakdownDoctor?.remainingBalance > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  onClick={() => {
                    const doc = breakdownDoctor;
                    setBreakdownDoctor(null);
                    handleOpenPayment(doc);
                  }}
                >
                  Proceed to Make Payment
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Eligible Completed Consultations</span>
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm">
                {breakdownDoctor?.eligibleAppointmentsCount} Sessions
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Patient Fees Collected</span>
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm">
                {formatCurrency(breakdownDoctor?.totalConsultationVolume || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Doctor Gross Share ({breakdownDoctor?.commissionRate}%)</span>
              <span className="font-black text-teal-600 dark:text-teal-400 text-sm">
                {formatCurrency(breakdownDoctor?.grossDoctorEarnings || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">TDS Withheld (10%)</span>
              <span className="font-black text-slate-600 dark:text-slate-300 text-sm">
                -{formatCurrency(breakdownDoctor?.deductions || 0)}
              </span>
            </div>
          </div>

          {breakdownLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Calculating eligible appointment breakdown...
            </div>
          ) : breakdownItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border rounded-xl border-dashed">
              No appointments found for this doctor in {breakdownDoctor?.periodLabel}. Earnings are ₹0.
            </div>
          ) : (
            <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Ref & Date</th>
                    <th className="p-3">Patient (UHID)</th>
                    <th className="p-3">Modality</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Doctor Share ({breakdownDoctor?.commissionRate}%)</th>
                    <th className="p-3">TDS (10%)</th>
                    <th className="p-3">Net Payable</th>
                    <th className="p-3">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {breakdownItems.map((item) => (
                    <tr
                      key={item.id}
                      className={item.isEligible ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40' : 'bg-rose-50/30 dark:bg-rose-950/20 text-slate-400'}
                    >
                      <td className="p-3">
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-400 block">
                          {item.appointmentRef}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {item.patientName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{item.uhid}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">
                          {item.consultationType}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.clinicName}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.fee)}
                      </td>
                      <td className="p-3 font-bold text-teal-600 dark:text-teal-400">
                        {formatCurrency(item.doctorShareAmount)}
                      </td>
                      <td className="p-3 text-slate-500">
                        -{formatCurrency(item.tdsAdjustment)}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.netPayable)}
                      </td>
                      <td className="p-3">
                        {item.isEligible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                            Eligible
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/50">
                            {item.status} ({item.paymentStatus})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: Make Payment Form */}
      <Modal
        isOpen={Boolean(paymentModalDoctor)}
        onClose={() => setPaymentModalDoctor(null)}
        maxWidth="max-w-lg"
        title={`Record Payment: ${paymentModalDoctor?.doctorName}`}
        subtitle={`Period: ${paymentModalDoctor?.periodLabel} • Doctor Code: ${paymentModalDoctor?.doctorCode}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentModalDoctor(null)}
              disabled={paymentSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              onClick={handleSubmitPayment}
              isLoading={paymentSubmitting}
            >
              Confirm & Record Payment
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
          {/* Outstanding Summary Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/40 dark:to-blue-950/40 border border-teal-200/60 dark:border-teal-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Net Payable</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(paymentModalDoctor?.totalPayableAmount || 0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Already Disbursed</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(paymentModalDoctor?.amountAlreadyPaid || 0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Outstanding Balance</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                {formatCurrency(paymentModalDoctor?.remainingBalance || 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Disbursement Amount (₹) *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={paymentFormData.paymentAmount}
                  onChange={(e) =>
                    setPaymentFormData({ ...paymentFormData, paymentAmount: e.target.value })
                  }
                  required
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setPaymentFormData({
                    ...paymentFormData,
                    paymentAmount: paymentModalDoctor?.remainingBalance.toString() || '0',
                  })
                }
                className="mt-1 text-[11px] font-bold text-teal-600 hover:underline"
              >
                Pay Full Outstanding Balance ({formatCurrency(paymentModalDoctor?.remainingBalance || 0)})
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Date *
              </label>
              <Input
                type="date"
                value={paymentFormData.paymentDate}
                onChange={(e) =>
                  setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Method *
              </label>
              <Select
                value={paymentFormData.paymentMethod}
                onChange={(e) =>
                  setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })
                }
                options={[
                  'IMPS Bank Transfer',
                  'NEFT Bank Transfer',
                  'RTGS Transfer',
                  'UPI Direct (VPA)',
                  'Razorpay Payout',
                ]}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Transaction / Reference ID *
              </label>
              <Input
                placeholder="e.g. IMPS-9921401"
                value={paymentFormData.transactionRef}
                onChange={(e) =>
                  setPaymentFormData({ ...paymentFormData, transactionRef: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Remarks / Payout Notes
            </label>
            <Input
              placeholder="e.g. Bi-weekly OPD consultation settlement"
              value={paymentFormData.remarks}
              onChange={(e) =>
                setPaymentFormData({ ...paymentFormData, remarks: e.target.value })
              }
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="authorizeAdjustment"
              checked={paymentFormData.authorizeAdjustment}
              onChange={(e) =>
                setPaymentFormData({
                  ...paymentFormData,
                  authorizeAdjustment: e.target.checked,
                })
              }
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label
              htmlFor="authorizeAdjustment"
              className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight cursor-pointer"
            >
              <strong>Authorize Manual Adjustment:</strong> Check only if this disbursement intentionally exceeds current calculated balance (e.g., retrospective bonus or off-platform adjustment).
            </label>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Payment History List */}
      <Modal
        isOpen={Boolean(historyDoctor)}
        onClose={() => setHistoryDoctor(null)}
        maxWidth="max-w-2xl"
        title={`Payment History: ${historyDoctor?.doctorName}`}
        subtitle={`Total Disbursed: ${formatCurrency(historyDoctor?.amountAlreadyPaid || 0)}`}
        footer={
          <Button variant="outline" size="sm" onClick={() => setHistoryDoctor(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          {historyLoading ? (
            <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
              Loading payment history...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border rounded-xl border-dashed">
              No recorded payments found for this period.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                        {item.paymentRef}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Txn: <span className="font-mono">{item.transactionRef}</span> via {item.paymentMethod}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Paid on {item.paymentDate} • {item.remarks}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm block">
                      {formatCurrency(item.paymentAmount)}
                    </span>
                    <button
                      onClick={() => setReceiptRecord({ ...item, doctor: historyDoctor })}
                      className="text-[10px] text-teal-600 hover:underline font-bold mt-0.5 flex items-center gap-1 ml-auto"
                    >
                      <FileText className="w-3 h-3" /> View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 4: Printable / Downloadable Payment Receipt */}
      <Modal
        isOpen={Boolean(receiptRecord)}
        onClose={() => setReceiptRecord(null)}
        maxWidth="max-w-lg"
        title="MediUnify Healthcare Payout Receipt"
        subtitle="Electronic payment voucher & settlement confirmation"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] text-slate-400 font-mono">
              MediUnify Super Admin Operations
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Voucher
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                onClick={() => {
                  notify('Downloaded receipt statement as PDF voucher.');
                  setReceiptRecord(null);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        }
      >
        {receiptRecord && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans">
            {/* Header branding */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-[#1E3A8A] dark:text-blue-400">
                  Medi<span className="text-[#00B894]">Unify</span>
                </h3>
                <p className="text-[10px] text-slate-400">Karnataka Regional Healthcare Operations</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  DISBURSEMENT SUCCESSFUL
                </span>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                  Ref: {receiptRecord.paymentRef}
                </p>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Physician</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {receiptRecord.doctorName || receiptRecord.doctor?.doctorName}
                </span>
                <span className="font-mono text-[10px] text-teal-600">
                  {receiptRecord.doctorCode || receiptRecord.doctor?.doctorCode}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Settlement Period</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {receiptRecord.periodLabel || receiptRecord.period}
                </span>
                <span className="text-[10px] text-slate-500">
                  Date: {receiptRecord.paymentDate}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-2 border-t border-b py-3 border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{receiptRecord.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank / Gateway Txn ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{receiptRecord.transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Disbursed By:</span>
                <span className="text-slate-700 dark:text-slate-300">{receiptRecord.processedBy || 'Super Admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purpose / Remarks:</span>
                <span className="text-slate-700 dark:text-slate-300 italic">{receiptRecord.remarks || 'Consultation fee payout'}</span>
              </div>
            </div>

            {/* Total Paid Amount */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50">
              <span className="font-bold text-teal-900 dark:text-teal-200">Total Disbursed Amount:</span>
              <span className="font-black text-xl text-teal-700 dark:text-teal-300">
                {formatCurrency(receiptRecord.paymentAmount)}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              This is a digital disbursement acknowledgment generated by MediUnify Super Admin Portal. No physical signature required.
            </p>
          </div>
        )}
      </Modal>

      {/* MODAL 5: Settlement Confirmation */}
      <Modal
        isOpen={Boolean(settlementDoctor)}
        onClose={() => setSettlementDoctor(null)}
        maxWidth="max-w-md"
        title="Confirm End-of-Month Settlement"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSettlementDoctor(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              onClick={confirmSettlement}
            >
              Confirm Full Settlement
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            You are about to settle the entire outstanding balance for{' '}
            <strong>{settlementDoctor?.doctorName}</strong> for the period{' '}
            <strong>{settlementDoctor?.periodLabel}</strong>.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Net Payable:</span>
              <span className="font-semibold">{formatCurrency(settlementDoctor?.totalPayableAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Previously Disbursed:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(settlementDoctor?.amountAlreadyPaid || 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Final Settlement Payout:</span>
              <span className="font-black text-teal-600 text-sm">{formatCurrency(settlementDoctor?.remainingBalance || 0)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            A disbursement transaction reference will be auto-generated and logged to doctor payment history.
          </p>
        </div>
      </Modal>
    </div>
  );
}
