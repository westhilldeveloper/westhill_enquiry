import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { sendEnquiryEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      destination, adults, kids, travelStart, travelEnd,
      durationDays, durationNights, hotelCategory, roomSharing,
      extraBedRequired, isInternational, dmcQuotations
    } = body;

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Step 1: Create the main Enquiry (do NOT include dmcId/dmcName here – they belong to DMCQuotation)
    const enquiry = await prisma.enquiry.create({
      data: {
        destination,
        adults: parseInt(adults) || 0,
        kids: parseInt(kids) || 0,
        travelStart: new Date(travelStart),
        travelEnd: new Date(travelEnd),
        durationDays: parseInt(durationDays) || 0,
        durationNights: parseInt(durationNights) || 0,
        hotelCategory,
        roomSharing,
        extraBedRequired: extraBedRequired || false,
        userId: userId,
        status: 'WORKING',
      },
    });

    // Step 2: Create DMC Quotations
    for (const dmc of dmcQuotations) {
      const adultCount = dmc.adultCount ?? (parseInt(adults) || 0);
      const kidCount = dmc.kidCount ?? (parseInt(kids) || 0);
      const foc = parseInt(dmc.foc) || 0;
      const actualAdultCharged = Math.max(0, adultCount - foc);
      const adultRate = parseFloat(dmc.adultRate) || 0;
      const kidRate = parseFloat(dmc.kidRate) || 0;
      const adultMargin = parseFloat(dmc.adultMargin) || 0;
      const kidMargin = parseFloat(dmc.kidMargin) || 0;

      const totalAdultCost = actualAdultCharged * (adultRate + adultMargin);
      const totalKidCost = kidCount * (kidRate + kidMargin);
      const subtotal = totalAdultCost + totalKidCost;
      const totalMargin = (actualAdultCharged * adultMargin) + (kidCount * kidMargin);
      const gstAmount = totalMargin * 0.18;
      const tcsAmount = (subtotal + gstAmount) * 0.02;
      const finalPrice = subtotal + gstAmount + tcsAmount;

      await prisma.dMCQuotation.create({
        data: {
          enquiryId: enquiry.id,
          dmcId: dmc.dmcId || null,                // store the master DMC ID if selected
          dmcName: dmc.dmcName || '',               // fallback name
          quotationRef: dmc.quotationRef || '',
          quotationDate: dmc.quotationDate ? new Date(dmc.quotationDate) : new Date(),
          adultCount,
          kidCount,
          adultRate,
          kidRate,
          adultMargin,
          kidMargin,
          foc,
          actualAdultCharged,
          totalAdultCost,
          totalKidCost,
          subtotal,
          gstAmount,
          tcsAmount,
          finalPrice,
        },
      });
    }

    // Re-fetch the enquiry with its DMC quotations
    const result = await prisma.enquiry.findUnique({
      where: { id: enquiry.id },
      include: { dmcQuotations: true, user: { select: { name: true, email: true } } },
    });

    // Send email (non-blocking)
    try {
      await sendEnquiryEmail(result, session.user.email);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Enquiry creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const destination = searchParams.get('destination');

  const where = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }
  if (destination) where.destination = { contains: destination, mode: 'insensitive' };

  const enquiries = await prisma.enquiry.findMany({
    where,
    include: { dmcQuotations: true, user: { select: { name: true, email: true } } },
    orderBy: { enqNo: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.enquiry.count({ where });

  return NextResponse.json({ enquiries, total, page, limit });
}