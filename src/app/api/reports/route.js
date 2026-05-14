import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') || 'daily';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const enquiries = await prisma.enquiry.findMany({
      where: dateFilter,
      include: {
        dmcQuotations: true,
      },
      orderBy: { date: 'asc' },
    });

    const groupedData = {};

    for (const enquiry of enquiries) {
      // Determine group key
      let groupKey;
      const date = new Date(enquiry.date);
      switch (groupBy) {
        case 'daily':
          groupKey = date.toISOString().split('T')[0];
          break;
        case 'monthly':
          groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          groupKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          groupKey = `${date.getFullYear()}`;
          break;
        default:
          groupKey = date.toISOString().split('T')[0];
      }

      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          period: groupKey,
          totalEnquiries: 0,
          totalRevenue: 0,
          totalMargin: 0,
          completedSelectedCount: 0,
        };
      }

      // Always count total enquiries
      groupedData[groupKey].totalEnquiries += 1;

      // For financials, only consider COMPLETED enquiries with a selected DMC
      if (enquiry.status === 'COMPLETED') {
        const selectedDmc = enquiry.dmcQuotations.find(d => d.isSelected === true);
        if (selectedDmc) {
          const enquiryRevenue = selectedDmc.finalPrice || 0;
          const adultMarginTotal = (selectedDmc.actualAdultCharged ?? 0) * (selectedDmc.adultMargin ?? 0);
          const kidMarginTotal = (selectedDmc.kidCount ?? 0) * (selectedDmc.kidMargin ?? 0);
          const enquiryMargin = adultMarginTotal + kidMarginTotal;

          groupedData[groupKey].totalRevenue += enquiryRevenue;
          groupedData[groupKey].totalMargin += enquiryMargin;
          groupedData[groupKey].completedSelectedCount += 1;
        }
      }
    }

    // Compute average margin only over the completed+selected enquiries
    const result = Object.values(groupedData).map(group => ({
      period: group.period,
      totalEnquiries: group.totalEnquiries,
      totalRevenue: group.totalRevenue,
      averageMargin: group.completedSelectedCount > 0 ? group.totalMargin / group.completedSelectedCount : 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}