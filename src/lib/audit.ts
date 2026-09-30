import prisma from './prisma';

export interface AuditLogEntry {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details as object,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CAMPAIGN_CREATE: 'CAMPAIGN_CREATE',
  CAMPAIGN_UPDATE: 'CAMPAIGN_UPDATE',
  CAMPAIGN_DELETE: 'CAMPAIGN_DELETE',
  PARTICIPANT_ADD: 'PARTICIPANT_ADD',
  PARTICIPANT_REMOVE: 'PARTICIPANT_REMOVE',
  PARTICIPANT_BULK_ADD: 'PARTICIPANT_BULK_ADD',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  VIEW_PARTICIPANT: 'VIEW_PARTICIPANT',
  EXPORT_DATA: 'EXPORT_DATA',
} as const;
