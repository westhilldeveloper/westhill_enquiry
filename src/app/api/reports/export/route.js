import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }

    const start = new Date(startDate);
start.setUTCHours(0, 0, 0, 0);
const end = new Date(endDate);
end.setUTCHours(23, 59, 59, 999);

    const dateFilter = {
      date: {
        gte: start,
        lte: end,
      },
    };

    const enquiries = await prisma.enquiry.findMany({
      where: dateFilter,
      include: {
        dmcQuotations: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { date: 'asc' },
    });

    if (enquiries.length === 0) {
      return NextResponse.json({ error: 'No data for selected period' }, { status: 404 });
    }

    // Prepare rows
    const rows = [];
    for (const enq of enquiries) {
      const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
      const baseRow = {
        'Enquiry No': enq.enqNo,
        'Date': formatDate(enq.date),
        'Destination': enq.destination,
        'Adults (Form)': enq.adults,
        'Kids (Form)': enq.kids,
        'Travel Start': formatDate(enq.travelStart),
        'Travel End': formatDate(enq.travelEnd),
        'Duration Days': enq.durationDays,
        'Duration Nights': enq.durationNights,
        'Hotel Category': enq.hotelCategory,
        'Room Sharing': enq.roomSharing,
        'Extra Bed Required': enq.extraBedRequired ? 'Yes' : 'No',
        'Status': enq.status,
        'User Name': enq.user?.name || '',
        'User Email': enq.user?.email || '',
      };

      if (enq.dmcQuotations.length === 0) {
        rows.push({
          ...baseRow,
          'DMC Name': '',
          'Quotation Ref': '',
          'Quotation Date': '',
          'Adult Count (DMC)': '',
          'Kid Count (DMC)': '',
          'Adult Rate': '',
          'Kid Rate': '',
          'Adult Margin': '',
          'Kid Margin': '',
          'FOC (Adults)': '',
          'Actual Adults Charged': '',
          'Total Adult Cost': '',
          'Total Kid Cost': '',
          'Subtotal': '',
          'GST (18%)': '',
          'TCS (2%)': '',
          'Final Price': '',
        });
      } else {
        for (const dmc of enq.dmcQuotations) {
          rows.push({
            ...baseRow,
            'DMC Name': dmc.dmcName || '',
            'Quotation Ref': dmc.quotationRef || '',
            'Quotation Date': formatDate(dmc.quotationDate),
            'Adult Count (DMC)': dmc.adultCount,
            'Kid Count (DMC)': dmc.kidCount,
            'Adult Rate': dmc.adultRate,
            'Kid Rate': dmc.kidRate,
            'Adult Margin': dmc.adultMargin,
            'Kid Margin': dmc.kidMargin,
            'FOC (Adults)': dmc.foc,
            'Actual Adults Charged': dmc.actualAdultCharged,
            'Total Adult Cost': dmc.totalAdultCost,
            'Total Kid Cost': dmc.totalKidCost,
            'Subtotal': dmc.subtotal,
            'GST (18%)': dmc.gstAmount,
            'TCS (2%)': dmc.tcsAmount,
            'Final Price': dmc.finalPrice,
            'Is Selected': dmc.isSelected ? 'Yes' : 'No',
          });
        }
      }
    }

    // Define column order (clear and stable)
    const columnOrder = [
      'Enquiry No', 'Date', 'Destination',
      'Adults (Form)', 'Kids (Form)',
      'Travel Start', 'Travel End', 'Duration Days', 'Duration Nights',
      'Hotel Category', 'Room Sharing', 'Extra Bed Required', 'Status',
      'User Name', 'User Email',
      'DMC Name', 'Quotation Ref', 'Quotation Date', 'Is Selected',
      'Adult Count (DMC)', 'Kid Count (DMC)',
      'Adult Rate', 'Kid Rate', 'Adult Margin', 'Kid Margin',
      'FOC (Adults)', 'Actual Adults Charged',
      'Total Adult Cost', 'Total Kid Cost', 'Subtotal',
      'GST (18%)', 'TCS (2%)', 'Final Price'
    ];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Westhill Enquiry System';
    const sheet = workbook.addWorksheet('Enquiry Data');

    // Add columns
    sheet.columns = columnOrder.map(key => ({
      header: key,
      key: key,
      width: Math.min(20, key.length + 4),
    }));

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data rows (as numbers, not strings)
    rows.forEach(row => {
      const newRow = {};
      for (const key of columnOrder) {
        let val = row[key];
        // Keep non-empty numbers as numbers, empty as null
        if (val !== '' && !isNaN(parseFloat(val)) && isFinite(val)) {
          newRow[key] = parseFloat(val);
        } else {
          newRow[key] = val === '' ? null : val;
        }
      }
      sheet.addRow(newRow);
    });

    // Auto-filter & freeze pane
    sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columnCount } };
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return with correct headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="enquiries_${startDate}_to_${endDate}.xlsx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}