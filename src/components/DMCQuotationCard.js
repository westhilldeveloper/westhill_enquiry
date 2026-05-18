'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function DMCQuotationCard({ dmc, index, defaultAdults, defaultKids, updateDMC, removeDMC, isInternational, dmcList }) {
  // Helper to get initial value from dmc or fallback to default
  const getInitial = (field, defaultValue) => {
    const val = dmc[field];
    return val !== undefined && val !== 0 ? val : defaultValue;
  };

  // Local state – initialised directly from props
  const [localAdultCount, setLocalAdultCount] = useState(() => getInitial('adultCount', defaultAdults));
  const [localKidCount, setLocalKidCount] = useState(() => getInitial('kidCount', defaultKids));
  const [localAdultRate, setLocalAdultRate] = useState(() => dmc.adultRate === 0 ? '' : dmc.adultRate);
  const [localKidRate, setLocalKidRate] = useState(() => dmc.kidRate === 0 ? '' : dmc.kidRate);
  const [localAdultMargin, setLocalAdultMargin] = useState(() => dmc.adultMargin === 0 ? '' : dmc.adultMargin);
  const [localKidMargin, setLocalKidMargin] = useState(() => dmc.kidMargin === 0 ? '' : dmc.kidMargin);
  const [localFoc, setLocalFoc] = useState(() => dmc.foc === 0 ? '' : dmc.foc);

  // Keep local state in sync when dmc props change (e.g. after parent reset)
  useEffect(() => {
    setLocalAdultCount(getInitial('adultCount', defaultAdults));
    setLocalKidCount(getInitial('kidCount', defaultKids));
    setLocalAdultRate(dmc.adultRate === 0 ? '' : dmc.adultRate);
    setLocalKidRate(dmc.kidRate === 0 ? '' : dmc.kidRate);
    setLocalAdultMargin(dmc.adultMargin === 0 ? '' : dmc.adultMargin);
    setLocalKidMargin(dmc.kidMargin === 0 ? '' : dmc.kidMargin);
    setLocalFoc(dmc.foc === 0 ? '' : dmc.foc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmc.adultCount, dmc.kidCount, dmc.adultRate, dmc.kidRate, dmc.adultMargin, dmc.kidMargin, dmc.foc, defaultAdults, defaultKids]);

  const handleNumberChange = (field, value, setter) => {
    setter(value);
    const num = value === '' ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    updateDMC(index, { [field]: num });
  };

  const handleCountChange = (field, value, setter) => {
    setter(value);
    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num)) return;
    updateDMC(index, { [field]: num });
  };

  // Raw values from props (not local state) – ensures calculations use latest parent values
  const adultCount = dmc.adultCount ?? defaultAdults;
  const kidCount = dmc.kidCount ?? defaultKids;
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm relative">
      <button
        type="button"
        onClick={() => removeDMC(index)}
        className="absolute top-[-5px] right-[-5px] text-red-400 hover:text-red-600 text-lg font-bold"
      >
        <Image src="/images/close.png" alt="Remove DMC" width={20} height={20} />
      </button>

      <div className="space-y-3">
        {/* Basic Info row */}
        <div className="grid grid-cols-1 gap-2">
          <div>
            <select
              value={dmc.dmcId ?? ''}
              onChange={(e) => {
                const selectedId = e.target.value ? parseInt(e.target.value) : null;
                const selectedDmc = dmcList.find(d => d.id === selectedId);
                updateDMC(index, { dmcId: selectedId, dmcName: selectedDmc ? selectedDmc.name : '' });
              }}
              className="w-full px-2 py-1.5 text-sm border rounded"
            >
              <option value="">-- Select DMC --</option>
              {dmcList.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quotation Ref</label>
              <input
                type="text"
                value={dmc.quotationRef || ''}
                onChange={(e) => updateDMC(index, { quotationRef: e.target.value.toUpperCase() })}
                className="w-full px-2 py-1.5 text-sm border rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quote Date</label>
              <input
                type="date"
                value={dmc.quotationDate ? dmc.quotationDate.split('T')[0] : ''}
                onChange={(e) => updateDMC(index, { quotationDate: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border rounded"
              />
            </div>
          </div>
        </div>

        {/* Counts row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Adults</label>
            <input
              type="number"
              min="0"
              value={localAdultCount}
              onChange={(e) => handleCountChange('adultCount', e.target.value, setLocalAdultCount)}
              className="w-full px-2 py-1.5 text-sm border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kids</label>
            <input
              type="number"
              min="0"
              value={localKidCount}
              onChange={(e) => handleCountChange('kidCount', e.target.value, setLocalKidCount)}
              className="w-full px-2 py-1.5 text-sm border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">FOC (free adults)</label>
            <input
              type="number"
              min="0"
              value={localFoc}
              onChange={(e) => handleNumberChange('foc', e.target.value, setLocalFoc)}
              className="w-full px-2 py-1.5 text-sm border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Rates row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Adult Rate (₹)</label>
            <input
              type="number"
              step="0.01"
              value={localAdultRate}
              onChange={(e) => handleNumberChange('adultRate', e.target.value, setLocalAdultRate)}
              className="w-full px-2 py-1.5 text-sm border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Adult Margin (₹)</label>
            <input
              type="number"
              step="0.01"
              value={localAdultMargin}
              onChange={(e) => handleNumberChange('adultMargin', e.target.value, setLocalAdultMargin)}
              className="w-full px-2 py-1.5 text-sm border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Kids rates row */}
        {kidCount > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kid Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={localKidRate}
                onChange={(e) => handleNumberChange('kidRate', e.target.value, setLocalKidRate)}
                className="w-full px-2 py-1.5 text-sm border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kid Margin (₹)</label>
              <input
                type="number"
                step="0.01"
                value={localKidMargin}
                onChange={(e) => handleNumberChange('kidMargin', e.target.value, setLocalKidMargin)}
                className="w-full px-2 py-1.5 text-sm border rounded appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
        )}

        {/* Calculation Summary */}
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
    </div>
  );
}