import { NextRequest } from 'next/server';
import { getSessionFromRequest, destroySession } from '@/lib/auth';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientInfo } from '@/lib/utils';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (session) {
      const clientInfo = getClientInfo(request);
      await createAuditLog({
        adminId: session.adminId,
        action: AUDIT_ACTIONS.LOGOUT,
        resource: 'admin',
        resourceId: session.adminId,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
    }

    await destroySession();

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return errorResponse('Internal server error', 500);
  }
}
