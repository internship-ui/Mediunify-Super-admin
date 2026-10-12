import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('wallet_transactions', () => mockDataProvider.getWalletTransactions());

export const financeRepository = {
  ...baseRepo,
  async getSummaryMetrics() {
    const list = mockDataProvider.getWalletTransactions();
    const totalVolume = list.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
    const topups = list.filter((t) => t.type === 'Wallet Topup').reduce((acc, curr) => acc + curr.amount, 0);
    const servicePayments = list.filter((t) => t.type === 'Service Payment').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
    const refunds = list.filter((t) => t.type === 'Refund').reduce((acc, curr) => acc + curr.amount, 0);
    return {
      totalVolume,
      topups,
      servicePayments,
      refunds,
      platformRevenueToday: 42800,
      settlementsPending: 18400,
    };
  },
};
