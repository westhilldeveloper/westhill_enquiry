import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const body = await request.json();
    const { status, selectedDmcId } = body;

    const enquiryId = parseInt(rawId, 10);
    if (isNaN(enquiryId)) {
      return NextResponse.json({ error: 'Invalid enquiry ID' }, { status: 400 });
    }

    // Get the enquiry to check ownership
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: { dmcQuotations: true },
    });
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    // Only allow update if user is the creator
    const userId = parseInt(session.user.id, 10);
    if (enquiry.userId !== userId) {
      return NextResponse.json({ error: 'You can only update your own enquiries' }, { status: 403 });
    }

    const updateData = {};
    if (status) updateData.status = status;

    // Update selected DMC if provided
    if (selectedDmcId) {
      const dmcIdNumber = parseInt(selectedDmcId, 10);
      if (isNaN(dmcIdNumber)) {
        return NextResponse.json({ error: 'Invalid DMC ID' }, { status: 400 });
      }

      // First, unselect all DMCs for this enquiry
      await prisma.dMCQuotation.updateMany({
        where: { enquiryId: enquiryId },
        data: { isSelected: false },
      });
      // Then set the chosen one as selected
      await prisma.dMCQuotation.update({
        where: { id: dmcIdNumber },
        data: { isSelected: true },
      });
    }

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: updateData,
      include: {
        dmcQuotations: true,
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update error details:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add this PUT method to the existing file
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: rawId } = await params;
    const enquiryId = parseInt(rawId, 10);
    if (isNaN(enquiryId)) return NextResponse.json({ error: 'Invalid enquiry ID' }, { status: 400 });

    const body = await request.json();
    const {
      destination, adults, kids, travelStart, travelEnd,
      durationDays, durationNights, hotelCategory, roomSharing,
      extraBedRequired, isInternational, dmcQuotations
    } = body;

    // Check ownership
    const existing = await prisma.enquiry.findUnique({ where: { id: enquiryId }, include: { dmcQuotations: true } });
    if (!existing) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    const userId = parseInt(session.user.id, 10);
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'You can only edit your own enquiries' }, { status: 403 });
    }

    // Update enquiry main fields
    await prisma.enquiry.update({
      where: { id: enquiryId },
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
      },
    });

    // Delete existing DMC quotations
    await prisma.dMCQuotation.deleteMany({ where: { enquiryId } });

    // Create new DMC quotations
    for (const dmc of dmcQuotations) {
      const adultCount = dmc.adultCount ?? adults;
      const kidCount = dmc.kidCount ?? kids;
      const foc = parseInt(dmc.foc) || 0;
      const actualAdultCharged = Math.max(0, adultCount - foc);
      const adultRate = parseFloat(dmc.adultRate) || 0;
      const kidRate = parseFloat(dmc.kidRate) || 0;
      const adultMargin = parseFloat(dmc.adultMargin) || 0;
      const kidMargin = parseFloat(dmc.kidMargin) || 0;
      const PAXRate = adultRate * (adultCount - foc)/ adultCount;
      // const totalAdultCost = actualAdultCharged * (adultRate + adultMargin);
      const totalAdultCost = adultCount * (PAXRate + adultMargin);
      const totalKidCost = kidCount * (kidRate + kidMargin);
      const subtotal = totalAdultCost + totalKidCost;
      const totalMargin = (adultCount * adultMargin) + (kidCount * kidMargin);
      const gstAmount = totalMargin * 0.18;
      const tcsAmount = (subtotal + gstAmount) * 0.02;
      const finalPrice = subtotal + gstAmount + tcsAmount;

      await prisma.dMCQuotation.create({
        data: {
          enquiryId,
          dmcId: dmc.dmcId || null,
          dmcName: dmc.dmcName || '',
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

    // Re‑fetch the updated enquiry
    const updated = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: { dmcQuotations: true, user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: { dmcQuotations: true, user: { select: { name: true, email: true } } },
  });
  if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(enquiry);
}