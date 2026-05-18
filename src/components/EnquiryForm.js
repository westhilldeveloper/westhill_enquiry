'use client';
import { useState, useEffect } from 'react';
import DMCQuotationCard from './DMCQuotationCard';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';

export default function EnquiryForm({ formData, setFormData, isEdit = false, enquiryId = null }) {
  const [loading, setLoading] = useState(false);
  const [dateErrors, setDateErrors] = useState({ start: '', end: '' });
  const [dmcList, setDmcList] = useState([]);

  const getToday = () => new Date().toISOString().split('T')[0];

  const validateDates = (start, end) => {
    let startError = '';
    let endError = '';

    if (start) {
      const today = getToday();
      if (start < today) {
        startError = 'Travel start date cannot be in the past.';
      }
    }

    if (end && start) {
      if (end < start) {
        endError = 'Travel end date cannot be before start date.';
      }
    }

    setDateErrors({ start: startError, end: endError });
    return startError === '' && endError === '';
  };

  const handleDateChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    validateDates(
      field === 'travelStart' ? value : newFormData.travelStart,
      field === 'travelEnd' ? value : newFormData.travelEnd
    );
  };

  const addDMC = () => {
    setFormData({
      ...formData,
      dmcQuotations: [
        ...formData.dmcQuotations,
        {
          id: Date.now(),
          dmcId: null,
          dmcName: '',
          quotationRef: '',
          quotationDate: new Date().toISOString().split('T')[0],
          adultCount: Number(formData.adults) || 0,
          kidCount: Number(formData.kids) || 0,
          adultRate: 0,
          kidRate: 0,
          adultMargin: 0,
          kidMargin: 0,
          foc: 0,
        },
      ],
    });
  };

  useEffect(() => {
    axios.get('/api/dmcs').then(res => setDmcList(res.data)).catch(console.error);
  }, []);

  const updateDMC = (index, updated) => {
    const newDMCs = [...formData.dmcQuotations];
    newDMCs[index] = { ...newDMCs[index], ...updated };
    setFormData({ ...formData, dmcQuotations: newDMCs });
  };

  const removeDMC = (index) => {
    const newDMCs = formData.dmcQuotations.filter((_, i) => i !== index);
    setFormData({ ...formData, dmcQuotations: newDMCs });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateNights = (start, end) => calculateDays(start, end) - 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateDates(formData.travelStart, formData.travelEnd);
    if (!isValid) {
      toast.error('Please fix date errors before submitting.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        durationDays: calculateDays(formData.travelStart, formData.travelEnd),
        durationNights: calculateNights(formData.travelStart, formData.travelEnd),
        adults: parseInt(formData.adults) || 0,
        kids: parseInt(formData.kids) || 0,
      };
      if (isEdit && enquiryId) {
        await axios.put(`/api/enquiries/${enquiryId}`, payload);
        toast.success('Enquiry updated successfully!');
        window.location.href = '/history';
      } else {
        await axios.post('/api/enquiries', payload);
        toast.success('Enquiry saved successfully!');
        setFormData({
          destination: '',
          adults: 0,
          kids: 0,
          travelStart: '',
          travelEnd: '',
          hotelCategory: '3 Star',
          roomSharing: 'Double Sharing',
          extraBedRequired: false,
          isInternational: false,
          dmcQuotations: [],
        });
        setDateErrors({ start: '', end: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic Information Card */}
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
        <h2 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          Trip Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g., Paris, Tokyo"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Adults</label>
              <input
                type="number"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                value={formData.adults}
                onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Kids</label>
              <input
                type="number"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                value={formData.kids}
                onChange={(e) => setFormData({ ...formData, kids: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Travel Start</label>
            <input
              type="date"
              className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 ${
                dateErrors.start ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.travelStart}
              onChange={(e) => handleDateChange('travelStart', e.target.value)}
              min={getToday()}
            />
            {dateErrors.start && <p className="mt-0.5 text-xs text-red-600">{dateErrors.start}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Travel End</label>
            <input
              type="date"
              className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 ${
                dateErrors.end ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.travelEnd}
              onChange={(e) => handleDateChange('travelEnd', e.target.value)}
              min={formData.travelStart || getToday()}
            />
            {dateErrors.end && <p className="mt-0.5 text-xs text-red-600">{dateErrors.end}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hotel Category</label>
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              value={formData.hotelCategory}
              onChange={(e) => setFormData({ ...formData, hotelCategory: e.target.value })}
            >
              {['Budget', '2 Star', '3 Star', '4 Star', '5 Star'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Room Sharing</label>
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              value={formData.roomSharing}
              onChange={(e) => setFormData({ ...formData, roomSharing: e.target.value })}
            >
              {['Single Sharing', 'Double Sharing', 'Triple Sharing'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.extraBedRequired}
                  onChange={(e) => setFormData({ ...formData, extraBedRequired: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">Extra Bed Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isInternational || false}
                  onChange={(e) => setFormData({ ...formData, isInternational: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="flex justify-center items-center text-xs text-gray-700">
                  <Image
                    src="/images/airplane.gif"
                    alt="Airplane icon"
                    width={30}
                    height={30}
                    className="object-contain rounded-full"
                    priority
                  />
                  International Trip
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* DMC Quotations Section */}
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-600 rounded-full"></span>
            DMC Quotations
          </h2>
          <button
            type="button"
            onClick={addDMC}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition"
          >
            + Add DMC
          </button>
        </div>
        {formData.dmcQuotations.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-md">
            No DMC quotations added yet. Click "Add DMC" to start.
          </div>
        ) : (
          <div className="space-y-3">
            {formData.dmcQuotations.map((dmc, idx) => (
              <DMCQuotationCard
                key={dmc.id}
                dmc={dmc}
                index={idx}
                defaultAdults={Number(formData.adults) || 0}
                defaultKids={Number(formData.kids) || 0}
                updateDMC={updateDMC}
                removeDMC={removeDMC}
                isInternational={formData.isInternational}
                dmcList={dmcList}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !!dateErrors.start || !!dateErrors.end}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : (
          'Save Enquiry'
        )}
      </button>
    </form>
  );
}