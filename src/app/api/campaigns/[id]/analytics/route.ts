import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { calculatePercentage } from '@/lib/utils';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    // Get aggregate stats
    const [
      totalTargets,
      delivered,
      opened,
      visited,
      attempted,
      reported,
    ] = await Promise.all([
      prisma.participant.count({ where: { campaignId: id } }),
      prisma.participant.count({ where: { campaignId: id, emailDelivered: true } }),
      prisma.participant.count({ where: { campaignId: id, emailOpened: true } }),
      prisma.participant.count({ where: { campaignId: id, landingPageVisited: true } }),
      prisma.participant.count({ where: { campaignId: id, loginAttempted: true } }),
      prisma.participant.count({ where: { campaignId: id, phishingReported: true } }),
    ]);

    // Department breakdown
    const departments = await prisma.participant.groupBy({
      by: ['department'],
      where: { campaignId: id },
      _count: {
        _all: true,
      },
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const [deptVisited, deptAttempted, deptReported] = await Promise.all([
          prisma.participant.count({
            where: { campaignId: id, department: dept.department, landingPageVisited: true },
          }),
          prisma.participant.count({
            where: { campaignId: id, department: dept.department, loginAttempted: true },
          }),
          prisma.participant.count({
            where: { campaignId: id, department: dept.department, phishingReported: true },
          }),
        ]);

        return {
          department: dept.department,
          total: dept._count._all,
          visited: deptVisited,
          attempted: deptAttempted,
          reported: deptReported,
          visitRate: calculatePercentage(deptVisited, dept._count._all),
          attemptRate: calculatePercentage(deptAttempted, deptVisited),
          reportRate: calculatePercentage(deptReported, dept._count._all),
        };
      })
    );

    // Timeline data - events grouped by hour
    const events = await prisma.campaignEvent.findMany({
      where: { campaignId: id },
      select: {
        eventType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const timelineMap = new Map<string, Record<string, number>>();
    events.forEach((event) => {
      const hourKey = new Date(event.createdAt).toISOString().slice(0, 13) + ':00:00Z';
      if (!timelineMap.has(hourKey)) {
        timelineMap.set(hourKey, {
          DELIVERED: 0,
          OPENED: 0,
          LANDING_PAGE_VISITED: 0,
          LOGIN_ATTEMPTED: 0,
          PHISHING_REPORTED: 0,
        });
      }
      const entry = timelineMap.get(hourKey)!;
      entry[event.eventType] = (entry[event.eventType] || 0) + 1;
    });

    const timeline = Array.from(timelineMap.entries()).map(([time, counts]) => ({
      time,
      ...counts,
    }));

    return jsonResponse({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      summary: {
        totalTargets,
        delivered,
        opened,
        visited,
        attempted,
        reported,
        deliveryRate: calculatePercentage(delivered, totalTargets),
        openRate: calculatePercentage(opened, delivered),
        clickRate: calculatePercentage(visited, delivered),
        submissionRate: calculatePercentage(attempted, visited),
        reportRate: calculatePercentage(reported, delivered),
      },
      departmentStats,
      timeline,
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    return errorResponse('Internal server error', 500);
  }
}
