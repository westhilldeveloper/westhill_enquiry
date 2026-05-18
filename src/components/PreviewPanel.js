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

  // Helper to compute all derived values for a DMC (exactly as in DMCQuotationCard)
  const computeDmcTotals = (dmc, enquiryAdults, enquiryKids, isInternational) => {
    const adultCount = dmc.adultCount ?? enquiryAdults;
    const kidCount = dmc.kidCount ?? enquiryKids;
    const foc = dmc.foc || 0;
    const adultRate = dmc.adultRate || 0;
    const kidRate = dmc.kidRate || 0;
    const adultMargin = dmc.adultMargin || 0;
    const kidMargin = dmc.kidMargin || 0;

    const payingAdults = Math.max(0, adultCount - foc);
    const dmcPortionPerAdult = adultCount ? (adultRate * payingAdults) / adultCount : 0;
    const adultPerHead = adultCount ? dmcPortionPerAdult + adultMargin : 0;
    const totalAdultCost = adultPerHead * adultCount;
    const kidPerHead = kidRate + kidMargin;
    const totalKidCost = kidCount * kidPerHead;

    const subtotal = totalAdultCost + totalKidCost;
    const totalMargin = (adultMargin * adultCount) + (kidMargin * kidCount);
    const totalRate = subtotal - totalMargin;
    const gst = totalMargin * 0.18;
    const tcs = isInternational ? (subtotal + gst) * 0.02 : 0;
    const finalTotal = subtotal + gst + tcs;
    const actualRatePerPax = (adultCount + kidCount) ? (payingAdults * adultRate + kidCount * kidRate) / (adultCount + kidCount) : 0;

    return {
      adultCount, kidCount, foc, payingAdults,
      adultRate, kidRate, adultMargin, kidMargin,
      dmcPortionPerAdult, adultPerHead, kidPerHead,
      actualRatePerPax, totalRate, totalMargin,
      subtotal, gst, tcs, finalTotal,
    };
  };

  if (!data || !data.dmcQuotations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p className="text-sm font-medium">Live preview will appear here</p>
        <p className="text-xs">Fill out the form to see real‑time updates</p>
      </div>
    );
  }

  const totalPax = (Number(data.adults) || 0) + (Number(data.kids) || 0);
  const isInternational = data.isInternational === true;

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

        {/* DMC Quotations – full calculation summary like the card */}
        {data.dmcQuotations.map((dmc, idx) => {
          const {
            adultCount, kidCount, foc, payingAdults,
            adultRate, kidRate, adultMargin, kidMargin,
            dmcPortionPerAdult, adultPerHead, kidPerHead,
            actualRatePerPax, totalRate, totalMargin,
            subtotal, gst, tcs, finalTotal,
          } = computeDmcTotals(dmc, data.adults, data.kids, isInternational);

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
                  <div className="text-[10px] text-gray-500">Final Total</div>
                  <div className="text-sm font-bold text-green-700">₹{finalTotal.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="mt-2 bg-gray-50 rounded p-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Adults (total / paying):</span>
                  <span>{adultCount} / {payingAdults}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kids:</span>
                  <span>{kidCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adult Per‑Head Price (DMC):</span>
                  <span>₹{dmcPortionPerAdult.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adult Per‑Head Price (incl. Margin):</span>
                  <span>₹{adultPerHead.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kid Per‑Head Price (incl. Margin):</span>
                  <span>₹{kidPerHead.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Rate per PAX (DMC):</span>
                  <span>₹{actualRatePerPax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Rate:</span>
                  <span>₹{totalRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Margin:</span>
                  <span>₹{totalMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Subtotal (before GST/TCS):</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18% of margin):</span>
                  <span>₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>TCS (2% of Subtotal+GST):</span>
                  <span>₹{tcs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-green-700 pt-1 border-t">
                  <span>Final Total:</span>
                  <span>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
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