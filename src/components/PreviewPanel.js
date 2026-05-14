'use client';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';

export default function PreviewPanel({ data, onSelectDmc, selectingDmcId }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: printRef });
  const { data: session } = useSession();
  const currentUser = session?.user;

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  if (!data || !data.dmcQuotations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p className="text-sm font-medium">Live preview will appear here</p>
        <p className="text-xs">Fill out the form to see real-time updates</p>
      </div>
    );
  }

  const totalPax = (Number(data.adults) || 0) + (Number(data.kids) || 0);
  // Detect international from any DMC having tcsAmount > 0 (or from parent flag)
  const isInternational = data.isInternational === true || data.dmcQuotations.some(dmc => dmc.tcsAmount > 0);

  return (
    <div className="preview-panel p-2">
      <div className="flex justify-between items-center mb-3 sticky top-0 bg-white z-10 pb-1 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-1">
          <span className="w-1 h-4 bg-purple-600 rounded-full"></span>
          Costing
        </h2>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      <div ref={printRef} className="space-y-3">
        {/* Created By & Status Card */}
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-xs">
          <div className="flex items-center gap-1 mb-1">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="font-semibold text-gray-800 text-xs">Created by</h3>
          </div>
          <p className="text-gray-700">{data.user?.name || data.user?.email || currentUser?.name || 'Unknown'}</p>
          <p className="text-gray-500 mt-0.5">Status: <span className="font-medium">{data.status || 'WORKING'}</span></p>
        </div>

        {/* Trip Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-100 text-xs">
          <div className="flex items-center gap-1 mb-1">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h3 className="font-semibold text-gray-800 text-xs">Trip</h3>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <div><span className="font-medium text-gray-600">Dest:</span> <span className="text-gray-900">{data.destination}</span></div>
              <div><span className="font-medium text-gray-600">Date:</span> <span className="text-gray-900">{formatDate(data.travelStart)} → {formatDate(data.travelEnd)}</span></div>
            </div>
            <div>
              <div><span className="font-medium text-gray-600">PAX:</span> <span className="text-gray-900">{totalPax} (A:{data.adults}, K:{data.kids})</span></div>
              <div><span className="font-medium text-gray-600">Hotel:</span> <span className="text-gray-900">{data.hotelCategory}</span></div>
            </div>
          </div>
        </div>

        {/* DMC Quotations */}
        {data.dmcQuotations.map((dmc, idx) => {
          const adultCount = dmc.adultCount ?? data.adults;
          const kidCount = dmc.kidCount ?? data.kids;
          const foc = dmc.foc || 0;
          const payingAdults = Math.max(0, adultCount - foc);
          const adultRate = dmc.adultRate || 0;
          const kidRate = dmc.kidRate || 0;
          const adultMargin = dmc.adultMargin || 0;
          const kidMargin = dmc.kidMargin || 0;

          // Use stored totals if available, otherwise fallback to calculated (should exist)
          const subtotal = dmc.subtotal ?? 0;
          const gst = dmc.gstAmount ?? 0;
          const tcs = dmc.tcsAmount ?? 0;
          const finalTotal = dmc.finalPrice ?? 0;
          const totalMargin = (adultMargin * adultCount) + (kidMargin * kidCount);

          // Per-head values
          const overallPerHead = finalTotal / (adultCount + kidCount);
          const subtotalPerHead = subtotal / (adultCount + kidCount);
          const gstPerHead = gst / (adultCount + kidCount);
          const tcsPerHead = tcs / (adultCount + kidCount);
          const adultPerHead = adultCount > 0 ? (subtotal - (kidCount * (kidRate + kidMargin))) / adultCount : 0;
          const kidPerHead = kidRate + kidMargin;

          const isSelected = dmc.isSelected === true;

          return (
            <div
              key={dmc.id || idx}
              className={`border rounded-lg overflow-hidden shadow-sm transition-all duration-200 ${
                isSelected ? 'border-green-500 ring-1 ring-green-200 bg-green-50/20' : 'border-gray-200'
              }`}
            >
              <div className="bg-gray-50 px-3 py-1.5 border-b flex justify-between items-center gap-1">
                <div className="flex items-center gap-2">
                  {data.dmcQuotations.length > 1 && onSelectDmc && (
                     selectingDmcId === dmc.id ? (
      <svg className="animate-spin h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ) : (
      <input
        type="radio"
        name={`selectedDmc-${data.id}`}
        checked={dmc.isSelected === true}
        onChange={() => onSelectDmc(dmc.id)}
        className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
      />
    )
                  )}
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-gray-800 text-sm">{dmc.dmcName || `DMC ${idx+1}`}</h3>
                      {isSelected && <span className="text-[10px] font-medium bg-green-100 text-green-800 px-1 rounded">✓</span>}
                    </div>
                    <p className="text-[10px] text-gray-500">Ref: {dmc.quotationRef || 'N/A'} | {formatDate(dmc.quotationDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Total</div>
                  <div className="text-sm font-bold text-green-700">₹{finalTotal.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="px-2 py-1 font-medium">Adults / Kids</td><td className="px-2 py-1 text-right">{adultCount} / {kidCount}</td><td className="px-2 py-1 text-right text-gray-400">-</td></tr>
                    <tr><td className="px-2 py-1 font-medium">FOC / Actual adults</td><td className="px-2 py-1 text-right">{foc} / {payingAdults}</td><td className="px-2 py-1 text-right text-gray-400">-</td></tr>
                    <tr><td className="px-2 py-1">Adult Rate</td><td className="px-2 py-1 text-right">₹{adultRate.toLocaleString('en-IN')}</td><td className="px-2 py-1 text-right">₹{(adultRate * payingAdults).toLocaleString('en-IN')}</td></tr>
                    <tr><td className="px-2 py-1">Kid Rate</td><td className="px-2 py-1 text-right">₹{kidRate.toLocaleString('en-IN')}</td><td className="px-2 py-1 text-right">₹{(kidRate * kidCount).toLocaleString('en-IN')}</td></tr>
                    <tr><td className="px-2 py-1">Adult Margin</td><td className="px-2 py-1 text-right">₹{adultMargin.toLocaleString('en-IN')}</td><td className="px-2 py-1 text-right">₹{(adultMargin * adultCount).toLocaleString('en-IN')}</td></tr>
                    <tr><td className="px-2 py-1">Kid Margin</td><td className="px-2 py-1 text-right">₹{kidMargin.toLocaleString('en-IN')}</td><td className="px-2 py-1 text-right">₹{(kidMargin * kidCount).toLocaleString('en-IN')}</td></tr>
                    <tr className="font-semibold"><td className="px-2 py-1">Subtotal (before GST)</td><td className="px-2 py-1 text-right">₹{subtotalPerHead.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td className="px-2 py-1 text-right">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                    <tr><td className="px-2 py-1">GST (18%)</td><td className="px-2 py-1 text-right">₹{gstPerHead.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td className="px-2 py-1 text-right">₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                    <tr><td className="px-2 py-1">TCS (2%)</td><td className="px-2 py-1 text-right">₹{tcsPerHead.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td className="px-2 py-1 text-right">₹{tcs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                    <tr className="bg-green-50 font-bold"><td className="px-2 py-1.5 text-green-800">Final Total</td><td className="px-2 py-1.5 text-right text-green-800">₹{overallPerHead.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td className="px-2 py-1.5 text-right text-green-800">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @media print {
          .preview-panel button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}