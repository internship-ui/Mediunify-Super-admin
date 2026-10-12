import { sleep } from '@/lib/utils';
import { mockDataProvider } from '../mock/MockDataProvider';

const DEFAULT_DOCTOR_SHARE_PERCENT = 80; // 80% doctor share, 20% MediUnify platform commission
const DEFAULT_TDS_PERCENT = 10; // 10% TDS withholding adjustment

class DoctorPaymentsRepository {
  /**
   * Get earnings summary for all doctors for a specific period
   * @param {string} period '2026-10' (October 2026), '2026-09' (September 2026), or 'all'
   * @param {object} filters optional filters (search, doctorId, status, dateRange)
   */
  async getDoctorEarnings(period = '2026-10', filters = {}) {
    await sleep(80);
    const doctors = mockDataProvider.getDoctors();
    const appointments = mockDataProvider.getAppointments();
    const payments = mockDataProvider.getDoctorPayments();

    let earningsList = doctors.map((doctor) => {
      // Find appointments for this doctor
      let doctorAppointments = appointments.filter((apt) => apt.doctorId === doctor.id);

      // Filter by period if not 'all'
      if (period && period !== 'all') {
        doctorAppointments = doctorAppointments.filter((apt) => {
          return apt.date && apt.date.startsWith(period);
        });
      }

      // Filter by custom date range if provided
      if (filters.startDate && filters.endDate) {
        doctorAppointments = doctorAppointments.filter((apt) => {
          return apt.date >= filters.startDate && apt.date <= filters.endDate;
        });
      }

      // Filter completed and eligible appointments only
      const eligibleAppointments = doctorAppointments.filter((apt) => {
        return apt.status === 'Completed' && apt.paymentStatus !== 'Refunded';
      });

      const cancelledAppointments = doctorAppointments.filter((apt) => {
        return apt.status === 'Cancelled' || apt.paymentStatus === 'Refunded';
      });

      // Total patient fees from eligible appointments
      const totalConsultationVolume = eligibleAppointments.reduce(
        (sum, apt) => sum + (Number(apt.fee) || 0),
        0
      );

      // Doctor's configured share (e.g., 80%)
      const commissionRate = doctor.commissionRate || DEFAULT_DOCTOR_SHARE_PERCENT;
      const grossDoctorEarnings = Math.round((totalConsultationVolume * commissionRate) / 100);

      // Deductions/Adjustments (e.g. 10% TDS)
      const deductions = Math.round((grossDoctorEarnings * DEFAULT_TDS_PERCENT) / 100);
      const totalPayableAmount = Math.max(0, grossDoctorEarnings - deductions);

      // Amount already paid for this doctor in this period
      const doctorPayments = payments.filter((p) => {
        const matchesDoctor = p.doctorId === doctor.id;
        const matchesPeriod = period === 'all' ? true : p.period === period;
        const isSuccess = p.status === 'Success';
        return matchesDoctor && matchesPeriod && isSuccess;
      });

      const amountAlreadyPaid = doctorPayments.reduce(
        (sum, p) => sum + (Number(p.paymentAmount) || 0),
        0
      );

      const remainingBalance = Math.max(0, totalPayableAmount - amountAlreadyPaid);

      // Determine Payment Status
      let paymentStatus = 'Pending';
      if (totalPayableAmount === 0) {
        paymentStatus = 'No Dues';
      } else if (remainingBalance === 0 && amountAlreadyPaid > 0) {
        paymentStatus = 'Paid';
      } else if (amountAlreadyPaid > 0 && remainingBalance > 0) {
        paymentStatus = 'Partially Paid';
      }

      // Last payment date
      const lastPayment = doctorPayments.sort(
        (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
      )[0];

      return {
        doctorId: doctor.id,
        doctorCode: doctor.doctorCode || `DOC-${doctor.id.slice(-3)}`,
        doctorName: doctor.name,
        specialization: doctor.specialization,
        city: doctor.city,
        period: period === 'all' ? 'All Time' : period,
        periodLabel: period === '2026-10' ? 'October 2026' : period === '2026-09' ? 'September 2026' : period,
        commissionRate,
        totalAppointments: doctorAppointments.length,
        eligibleAppointmentsCount: eligibleAppointments.length,
        cancelledAppointmentsCount: cancelledAppointments.length,
        totalConsultationVolume,
        grossDoctorEarnings,
        deductions,
        totalPayableAmount,
        amountAlreadyPaid,
        remainingBalance,
        lastPaymentDate: lastPayment ? lastPayment.paymentDate : '—',
        paymentStatus,
        paymentHistory: doctorPayments,
      };
    });

    // Apply search filter
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      earningsList = earningsList.filter(
        (item) =>
          item.doctorName.toLowerCase().includes(q) ||
          item.doctorCode.toLowerCase().includes(q) ||
          item.specialization.toLowerCase().includes(q)
      );
    }

    // Apply status filter
    if (filters.paymentStatus && filters.paymentStatus !== 'All') {
      earningsList = earningsList.filter((item) => item.paymentStatus === filters.paymentStatus);
    }

    // Apply doctor filter
    if (filters.doctorId && filters.doctorId !== 'All') {
      earningsList = earningsList.filter((item) => item.doctorId === filters.doctorId);
    }

    // Calculate aggregated dashboard metrics
    const totalEarningsMonth = earningsList.reduce((sum, item) => sum + item.totalPayableAmount, 0);
    const totalAlreadyPaidMonth = earningsList.reduce((sum, item) => sum + item.amountAlreadyPaid, 0);
    const totalOutstandingMonth = earningsList.reduce((sum, item) => sum + item.remainingBalance, 0);
    const awaitingPaymentCount = earningsList.filter((item) => item.remainingBalance > 0).length;

    return {
      earnings: earningsList,
      summary: {
        totalEarningsMonth,
        totalAlreadyPaidMonth,
        totalOutstandingMonth,
        awaitingPaymentCount,
        totalDoctorsCount: doctors.length,
      },
    };
  }

  /**
   * Get appointment-level itemized breakdown for a doctor in a period
   */
  async getDoctorAppointmentBreakdown(doctorId, period = '2026-10') {
    await sleep(60);
    const appointments = mockDataProvider.getAppointments();
    const doctors = mockDataProvider.getDoctors();
    const doctor = doctors.find((d) => d.id === doctorId);

    const doctorSharePercent = doctor?.commissionRate || DEFAULT_DOCTOR_SHARE_PERCENT;

    let doctorAppointments = appointments.filter((apt) => apt.doctorId === doctorId);

    if (period && period !== 'all') {
      doctorAppointments = doctorAppointments.filter((apt) => {
        return apt.date && apt.date.startsWith(period);
      });
    }

    return doctorAppointments.map((apt) => {
      const isEligible = apt.status === 'Completed' && apt.paymentStatus !== 'Refunded';
      const fee = Number(apt.fee) || 0;
      const doctorShare = isEligible ? Math.round((fee * doctorSharePercent) / 100) : 0;
      const tds = isEligible ? Math.round((doctorShare * DEFAULT_TDS_PERCENT) / 100) : 0;
      const netPayable = Math.max(0, doctorShare - tds);

      return {
        id: apt.id,
        appointmentRef: apt.appointmentRef,
        patientName: apt.patientName,
        uhid: apt.uhid,
        date: apt.date,
        timeSlot: apt.timeSlot,
        consultationType: apt.consultationType,
        clinicName: apt.clinicName,
        fee,
        doctorSharePercent,
        doctorShareAmount: doctorShare,
        tdsAdjustment: tds,
        netPayable,
        status: apt.status,
        paymentStatus: apt.paymentStatus,
        isEligible,
      };
    });
  }

  /**
   * Record a payment made to a doctor (full or partial)
   */
  async recordPayment({
    doctorId,
    doctorCode,
    doctorName,
    specialization,
    period = '2026-10',
    paymentAmount,
    paymentDate = new Date().toISOString().slice(0, 10),
    paymentMethod = 'IMPS Bank Transfer',
    transactionRef = '',
    remarks = '',
    authorizeAdjustment = false,
    processedBy = 'Super Admin (Dr. Arjun)',
  }) {
    await sleep(150);

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const payments = mockDataProvider.getDoctorPayments();

    // Check for duplicate transaction ID
    if (transactionRef) {
      const existingTxn = payments.find(
        (p) => p.transactionRef && p.transactionRef.trim().toLowerCase() === transactionRef.trim().toLowerCase()
      );
      if (existingTxn) {
        throw new Error(`Duplicate transaction reference ${transactionRef}. Payment already recorded.`);
      }
    }

    // Verify outstanding balance
    const currentEarningsRes = await this.getDoctorEarnings(period);
    const doctorRecord = currentEarningsRes.earnings.find((d) => d.doctorId === doctorId);

    if (doctorRecord && !authorizeAdjustment) {
      if (amount > doctorRecord.remainingBalance) {
        throw new Error(
          `Payment amount (₹${amount}) exceeds outstanding balance (₹${doctorRecord.remainingBalance}). Authorize adjustment or enter a valid amount.`
        );
      }
    }

    const txnId = transactionRef || `TXN-DR-${Date.now().toString().slice(-6)}`;
    const newPayment = {
      id: `pay-${Date.now()}`,
      paymentRef: `PAY-MED-${period.replace('-', '')}-${Date.now().toString().slice(-4)}`,
      doctorId,
      doctorCode: doctorCode || doctorRecord?.doctorCode || 'DOC-GEN',
      doctorName: doctorName || doctorRecord?.doctorName || 'Doctor',
      specialization: specialization || doctorRecord?.specialization || 'Consultant',
      period,
      periodLabel: period === '2026-10' ? 'October 2026' : period === '2026-09' ? 'September 2026' : period,
      paymentAmount: amount,
      paymentDate,
      paymentMethod,
      transactionRef: txnId,
      remarks: remarks || `Disbursement for ${period} doctor consultation earnings`,
      status: 'Success',
      processedBy,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [newPayment, ...payments];
    mockDataProvider.setCollection('doctor_payments', updatedPayments);

    return newPayment;
  }

  /**
   * Get complete payment transaction history
   */
  async getPaymentHistory(doctorId = null, period = null) {
    await sleep(50);
    let payments = mockDataProvider.getDoctorPayments();

    if (doctorId && doctorId !== 'All') {
      payments = payments.filter((p) => p.doctorId === doctorId);
    }

    if (period && period !== 'all') {
      payments = payments.filter((p) => p.period === period);
    }

    return payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  }

  /**
   * Settle entire remaining balance for a doctor for the month
   */
  async settleMonthlyBalance(doctorId, period = '2026-10', paymentMethod = 'NEFT Bank Transfer', remarks = '') {
    const earningsRes = await this.getDoctorEarnings(period);
    const doctorRecord = earningsRes.earnings.find((d) => d.doctorId === doctorId);

    if (!doctorRecord) {
      throw new Error('Doctor record not found.');
    }

    if (doctorRecord.remainingBalance <= 0) {
      throw new Error('Doctor has no outstanding balance to settle for this period.');
    }

    return await this.recordPayment({
      doctorId,
      doctorCode: doctorRecord.doctorCode,
      doctorName: doctorRecord.doctorName,
      specialization: doctorRecord.specialization,
      period,
      paymentAmount: doctorRecord.remainingBalance,
      paymentMethod,
      transactionRef: `SETTLE-${period.replace('-', '')}-${Date.now().toString().slice(-4)}`,
      remarks: remarks || `Full end-of-month settlement for ${period}`,
    });
  }
}

export const doctorPaymentsRepository = new DoctorPaymentsRepository();
