import { mockDataProvider } from '../mock/MockDataProvider';
import { createRepository } from './baseRepository';

const baseRepo = createRepository('audit_logs', () => mockDataProvider.getAuditLogs());

export const auditLogsRepository = {
  ...baseRepo,
  async logAction(action, details, targetEntity, targetId, severity = 'Info') {
    return baseRepo.create({
      logRef: `AUD-${Math.floor(10000 + Math.random() * 90000)}`,
      actorId: 'adm-001',
      actorName: 'Namith Gowda (Super Admin)',
      actorRole: 'Super Admin',
      action,
      targetEntity,
      targetId,
      details,
      ipAddress: '106.51.78.10 (Mysuru)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity,
    });
  },
};
