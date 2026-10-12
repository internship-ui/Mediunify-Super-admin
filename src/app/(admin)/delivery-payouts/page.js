'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { deliveryStaffRepository } from '@/services/repositories';
import { StatCard } from '@/components/dashboard/StatCard';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
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
  Truck,
  ArrowRight,
  ShieldCheck,
  Check,
  Search,
  Sparkles,
  Info,
  MapPin,
} from 'lucide-react';

export default function DeliveryPayoutsPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState('2026-10');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Data states
  const [earningsData, setEarningsData] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalEligibleEarnings: 0,
    totalPayoutsCompleted: 0,
    totalOutstanding: 0,
    awaitingPaymentCount: 0,
    totalStaffCount: 0,
  });
  const [allStaffList, setAllStaffList] = useState([]);

  // Modals state
  const [breakdownStaff, setBreakdownStaff] = useState(null);
  const [breakdownItems, setBreakdownItems] = useState([]);
  const [breakdownConfig, setBreakdownConfig] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const [paymentModalStaff, setPaymentModalStaff] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    payoutAmount: '',
    payoutDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'IMPS Bank Transfer',
    transactionRef: '',
    notes: '',
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [historyStaff, setHistoryStaff] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [receiptRecord, setReceiptRecord] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const staffRes = await deliveryStaffRepository.getAll();
      setAllStaffList(staffRes.data || []);

      const res = await deliveryStaffRepository.getEarnings(selectedPeriod, {
        search,
        city: cityFilter,
        paymentStatus: paymentStatusFilter,
        staffId: selectedStaffFilter,
      });

      setEarningsData(res.data || []);
      setSummaryMetrics(res.summary || {});
    } catch (err) {
      console.error('Failed to load delivery earnings:', err);
      notify('Failed to load delivery earnings records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, paymentStatusFilter, selectedStaffFilter, cityFilter, search]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return earningsData.slice(start, start + pageSize);
  }, [earningsData, page, pageSize]);

  // Handlers: View Earnings Statement (Detailed Line Items)
  const handleOpenBreakdown = async (record) => {
    setBreakdownStaff(record);
    setBreakdownLoading(true);
    try {
      const res = await deliveryStaffRepository.getDeliveryBreakdown(record.deliveryStaffId, record.period);
      setBreakdownItems(res.data || []);
      setBreakdownConfig(res.config);
    } catch (err) {
      notify('Failed to load delivery line items.', 'error');
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Handlers: Payout History
  const handleOpenHistory = async (record) => {
    setHistoryStaff(record);
    setHistoryLoading(true);
    try {
      const res = await deliveryStaffRepository.getPayoutHistory(record.deliveryStaffId);
      setHistoryItems(res.data || []);
    } catch (err) {
      notify('Failed to load payout history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handlers: Make Payout Modal
  const handleOpenPayout = (record) => {
    setPaymentModalStaff(record);
    setPaymentFormData({
      payoutAmount: record.outstandingBalance.toString(),
      payoutDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'IMPS Bank Transfer',
      transactionRef: `IMPS/${Date.now().toString().slice(-8)}/HDFC`,
      notes: `Settlement for ${record.staffName} (${record.period})`,
    });
  };

  const handleProcessPayout = async (e) => {
    e.preventDefault();
    if (!paymentModalStaff) return;

    const amount = parseFloat(paymentFormData.payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      notify('Please enter a valid payout amount.', 'error');
      return;
    }

    if (amount > paymentModalStaff.outstandingBalance) {
      notify(`Cannot pay more than outstanding balance of ${formatCurrency(paymentModalStaff.outstandingBalance)}.`, 'error');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await deliveryStaffRepository.recordPayout({
        deliveryStaffId: paymentModalStaff.deliveryStaffId,
        period: paymentModalStaff.period,
        payoutAmount: amount,
        payoutDate: paymentFormData.payoutDate,
        paymentMethod: paymentFormData.paymentMethod,
        transactionRef: paymentFormData.transactionRef,
        notes: paymentFormData.notes,
        processedBy: 'Namith Gowda (Super Admin)',
      });

      notify(`Processed payout of ${formatCurrency(amount)} to ${paymentModalStaff.staffName}!`, 'success');
      setPaymentModalStaff(null);
      setReceiptRecord(res.payoutTransaction);
      loadData();
    } catch (err) {
      notify(err.message || 'Payout failed.', 'error');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV('pharmacy_delivery_payouts_summary', earningsData, [
      { header: 'Delivery Staff ID', accessorKey: 'deliveryStaffId' },
      { header: 'Staff Name', accessorKey: 'staffName' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Period', accessorKey: 'period' },
      { header: 'Completed Deliveries', accessorKey: 'completedDeliveries' },
      { header: 'Gross Earnings', accessorKey: 'grossEarnings' },
      { header: 'Net Payable', accessorKey: 'netPayable' },
      { header: 'Amount Already Paid', accessorKey: 'amountAlreadyPaid' },
      { header: 'Outstanding Balance', accessorKey: 'outstandingBalance' },
      { header: 'Last Payout Date', accessorKey: 'lastPayoutDate' },
      { header: 'Payment Status', accessorKey: 'paymentStatus' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[11px] font-bold border border-teal-300/30">
              Fleet Financial Settlements
            </span>
            <span className="text-xs text-slate-300">Dedicated Pharmacy Rider Accounts</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-teal-400" />
            Pharmacy Delivery Staff Earnings & Payouts
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl">
            Track completed order dispatches, calculate per-delivery base fees and distance incentives, process full or partial IMPS/UPI payouts, and generate verifiable settlement receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/pharmacy-delivery">
            <Button
              variant="outline"
              size="sm"
              icon={Truck}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
            >
              Delivery Boys Directory
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            icon={FileText}
            onClick={handleExportCSV}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
          >
            Export Settlements CSV
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Eligible Earnings (This Month)"
          value={formatCurrency(summaryMetrics.totalEligibleEarnings || 0)}
          change="Completed Dispatches"
          isPositive={true}
          icon={IndianRupee}
          accentColor="teal"
          description="Net payable for eligible deliveries"
        />
        <StatCard
          title="Payouts Completed"
          value={formatCurrency(summaryMetrics.totalPayoutsCompleted || 0)}
          change="Disbursed"
          isPositive={true}
          icon={CheckCircle2}
          accentColor="green"
          description="Transferred via IMPS / UPI"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(summaryMetrics.totalOutstanding || 0)}
          change={`${summaryMetrics.awaitingPaymentCount} Riders`}
          isPositive={summaryMetrics.totalOutstanding === 0}
          icon={Clock}
          accentColor="amber"
          description="Pending settlement across fleet"
        />
        <StatCard
          title="Riders Awaiting Payment"
          value={`${summaryMetrics.awaitingPaymentCount || 0} Awaiting`}
          change={`Out of ${summaryMetrics.totalStaffCount || 0} active`}
          isPositive={summaryMetrics.awaitingPaymentCount === 0}
          icon={Truck}
          accentColor="purple"
          description="With positive payable balance"
        />
      </div>

      {/* Pricing Model & Simulation Disclaimer Card */}
      <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-teal-950 dark:text-teal-200">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm">Configured Delivery Earnings Model:</span>
            <p className="mt-0.5 opacity-90">
              ₹50.00 Base Fee per completed delivery + ₹10.00/km beyond 3 km + ₹15.00 Rush Hour / Rain Incentive + ₹500.00 Monthly Milestone Bonus (&gt;30 deliveries). Patient medicine order amount is recorded separately from rider delivery earnings.
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-teal-200/50 dark:bg-teal-800/50 text-[11px] font-bold text-teal-900 dark:text-teal-100 whitespace-nowrap self-start md:self-center">
          ⚡ Simulated Frontend Payouts (No actual funds debited)
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rider name, staff ID, city..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="w-40">
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-9 text-xs font-semibold"
            >
              <option value="2026-10">October 2026 (Current)</option>
              <option value="2026-09">September 2026 (Previous)</option>
              <option value="all">All Historical Periods</option>
            </Select>
          </div>

          <div className="w-36">
            <Select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="All">All Cities</option>
              <option value="Mysuru">Mysuru</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hubballi">Hubballi</option>
              <option value="Hassan">Hassan</option>
            </Select>
          </div>

          <div className="w-40">
            <Select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Fully Paid</option>
            </Select>
          </div>

          <div className="w-44">
            <Select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="All">All Delivery Boys</option>
              {allStaffList.map((s) => (
                <option key={s.id} value={s.staffId}>
                  {s.fullName} ({s.staffId})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Main Earnings Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Delivery Boy & ID</th>
                <th className="py-3 px-4">City & Hub</th>
                <th className="py-3 px-4 text-center">Completed Deliveries</th>
                <th className="py-3 px-4 text-right">Gross Earnings</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Settlement Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No delivery boy earnings found for this filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {row.staffName}
                        </p>
                        <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          {row.deliveryStaffId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{row.city}</p>
                      <p className="text-[11px] text-slate-400 max-w-[180px] truncate" title={row.serviceArea}>
                        {row.serviceArea}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {row.completedDeliveries}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(row.grossEarnings)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(row.netPayable)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(row.amountAlreadyPaid)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          row.outstandingBalance > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }
                      >
                        {formatCurrency(row.outstandingBalance)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          row.paymentStatus === 'Paid'
                            ? 'success'
                            : row.paymentStatus === 'Partially Paid'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {row.paymentStatus}
                      </Badge>
                      {row.lastPayoutDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Paid: {row.lastPayoutDate}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenBreakdown(row)}
                          title="View Delivery Breakdown"
                          className="text-xs h-8 px-2"
                        >
                          Statement
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          icon={History}
                          onClick={() => handleOpenHistory(row)}
                          title="View Payout History"
                          className="text-xs h-8 px-2"
                        >
                          History
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          icon={Send}
                          disabled={row.outstandingBalance <= 0}
                          onClick={() => handleOpenPayout(row)}
                          className={`text-xs h-8 px-2.5 ${
                            row.outstandingBalance > 0
                              ? 'bg-teal-600 hover:bg-teal-700 text-white'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          Make Payout
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Pagination
            currentPage={page}
            totalRecords={earningsData.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VIEW DELIVERY-WISE EARNINGS STATEMENT */}
      {/* ========================================================================= */}
      {breakdownStaff && (
        <Modal
          isOpen={!!breakdownStaff}
          onClose={() => setBreakdownStaff(null)}
          title={`Delivery Earnings Statement: ${breakdownStaff.staffName} (${breakdownStaff.period})`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {breakdownStaff.staffName} • {breakdownStaff.deliveryStaffId}
                </h4>
                <p className="text-slate-500 mt-0.5">
                  Coverage: {breakdownStaff.city} ({breakdownStaff.serviceArea})
                </p>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Net Payable</span>
                  <p className="font-mono text-sm font-black text-teal-600 dark:text-teal-400">
                    {formatCurrency(breakdownStaff.netPayable)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Outstanding</span>
                  <p className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                    {formatCurrency(breakdownStaff.outstandingBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Config summary */}
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200">
              <span className="font-bold">Payout Calculation Formula:</span> Base Fee ₹50 + Distance Incentive (₹10/km after 3km) + Peak Hour Bonus (₹15) = Net Rider Earning per eligible order.
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-2.5">Delivery & Order #</th>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Patient & Address</th>
                    <th className="p-2.5 text-right">Distance</th>
                    <th className="p-2.5 text-right">Base Fee</th>
                    <th className="p-2.5 text-right">Incentive</th>
                    <th className="p-2.5 text-right">Net Earning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {breakdownItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No delivery line items recorded for this staff member.
                      </td>
                    </tr>
                  ) : (
                    breakdownItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {item.orderNumber}
                        </td>
                        <td className="p-2.5 text-slate-500">{item.deliveryDate}</td>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{item.patientName}</p>
                          <p className="text-[10px] text-slate-400 max-w-[180px] truncate">{item.deliveryAddress}</p>
                        </td>
                        <td className="p-2.5 text-right font-mono">{item.distanceKm} km</td>
                        <td className="p-2.5 text-right font-mono">₹{item.baseFee}</td>
                        <td className="p-2.5 text-right font-mono text-teal-600">
                          +₹{item.distanceIncentive + item.peakBonus}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          ₹{item.netEarning}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setBreakdownStaff(null)}>
                Close Statement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MAKE PAYOUT */}
      {/* ========================================================================= */}
      {paymentModalStaff && (
        <Modal
          isOpen={!!paymentModalStaff}
          onClose={() => setPaymentModalStaff(null)}
          title={`Process Payout: ${paymentModalStaff.staffName} (${paymentModalStaff.deliveryStaffId})`}
          size="md"
        >
          <form onSubmit={handleProcessPayout} className="space-y-4 text-xs">
            {/* Balance Overview Box */}
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase">Total Net Earnings</span>
                <p className="font-mono text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatCurrency(paymentModalStaff.netPayable)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase">Already Paid</span>
                <p className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(paymentModalStaff.amountAlreadyPaid)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase">Outstanding Dues</span>
                <p className="font-mono text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatCurrency(paymentModalStaff.outstandingBalance)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payout Amount (₹) *
                </label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  max={paymentModalStaff.outstandingBalance}
                  value={paymentFormData.payoutAmount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payoutAmount: e.target.value })}
                  placeholder="Enter amount to pay"
                  className="font-mono font-bold text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter full balance or specify partial payout amount.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disbursement Method *
                  </label>
                  <Select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                  >
                    <option value="IMPS Bank Transfer">IMPS Bank Transfer</option>
                    <option value="UPI Direct">UPI Direct Transfer</option>
                    <option value="Cash Settlement">Cash / Direct Disbursement</option>
                  </Select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payout Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={paymentFormData.payoutDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payoutDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction / Reference ID *
                </label>
                <Input
                  required
                  value={paymentFormData.transactionRef}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionRef: e.target.value })}
                  placeholder="e.g. IMPS/88192019/HDFC or UPI reference"
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Notes / Remarks
                </label>
                <Input
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Optional settlement notes"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="font-bold">Confirmation Disclaimer:</span> This action records a simulated payout transaction, immediately recalculates outstanding balances, updates payment badges, and logs the entry in administrative payout history.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setPaymentModalStaff(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={paymentSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                Confirm & Record Payout
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYOUT HISTORY */}
      {/* ========================================================================= */}
      {historyStaff && (
        <Modal
          isOpen={!!historyStaff}
          onClose={() => setHistoryStaff(null)}
          title={`Payout History: ${historyStaff.staffName} (${historyStaff.deliveryStaffId})`}
          size="md"
        >
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-2.5">Payout Ref</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Method & Ref</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No historical payouts recorded for this rider.
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {p.payoutRef}
                        </td>
                        <td className="p-2.5 text-slate-500">{p.payoutDate.slice(0, 10)}</td>
                        <td className="p-2.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{p.paymentMethod}</p>
                          <p className="font-mono text-[10px] text-slate-400">{p.transactionRef}</p>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => setReceiptRecord(p)}
                            className="p-1 rounded text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                            title="View Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setHistoryStaff(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DOWNLOADABLE / PRINTABLE PAYOUT RECEIPT */}
      {/* ========================================================================= */}
      {receiptRecord && (
        <Modal
          isOpen={!!receiptRecord}
          onClose={() => setReceiptRecord(null)}
          title={`Settlement Receipt: ${receiptRecord.payoutRef}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-500 shadow-md space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-base text-teal-700 dark:text-teal-400">
                    MediUnify Super Admin Hub
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Official Pharmacy Fleet Disbursement Voucher
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    {receiptRecord.payoutRef}
                  </span>
                  <p className="text-[10px] text-slate-400">{receiptRecord.payoutDate}</p>
                </div>
              </div>

              {/* Rider Details */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Beneficiary Rider</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{receiptRecord.staffName}</p>
                  <p className="font-mono text-[10px] text-teal-600">{receiptRecord.deliveryStaffId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Settlement Period</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{receiptRecord.period}</p>
                  <p className="text-[10px] text-slate-500">{receiptRecord.city} Fleet Hub</p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-center">
                <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-bold">Disbursed Amount</span>
                <p className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {formatCurrency(receiptRecord.amount)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Paid via {receiptRecord.paymentMethod} (Ref: {receiptRecord.transactionRef})
                </p>
              </div>

              {/* Footer info */}
              <div className="text-[10px] text-slate-400 space-y-1">
                <p>Processed By: {receiptRecord.processedBy || 'Namith Gowda (Super Admin)'}</p>
                <p>Notes: {receiptRecord.notes || 'Full / partial settlement disbursement recorded.'}</p>
                <p className="text-[9px] italic text-slate-400 mt-2">
                  * Note: In this frontend demonstration phase, this receipt represents a simulated ledger transaction.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
                className="text-xs"
              >
                Print Voucher
              </Button>
              <Button variant="primary" size="sm" onClick={() => setReceiptRecord(null)} className="bg-teal-600 hover:bg-teal-700 text-white">
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
