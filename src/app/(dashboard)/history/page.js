'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import EnquiryTable from '@/components/EnquiryTable';
import PreviewPanel from '@/components/PreviewPanel';
import { useSocket } from '@/lib/socket';

export default function HistoryPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [selectingDmcId, setSelectingDmcId] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    destination: '',
  });
  const socket = useSocket();

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.destination) params.append('destination', filters.destination);
      const res = await axios.get(`/api/enquiries?${params.toString()}`);
      setEnquiries(res.data.enquiries);
    } catch (error) {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filters]);

  useEffect(() => {
    if (!socket) return;
    socket.on('enquiry-created', () => {
      fetchEnquiries();
      toast.success('New enquiry added!');
    });
    return () => socket.off('enquiry-created');
  }, [socket]);

  const handleSelectEnquiry = useCallback((enquiry) => {
    setSelectedEnquiry(enquiry);
    setPreviewKey(prev => prev + 1);
  }, []);

  const handleUpdateStatus = async (enqId, newStatus) => {
    try {
      await axios.patch(`/api/enquiries/${enqId}`, { status: newStatus });
      toast.success('Status updated');
      fetchEnquiries(); // refresh list
      if (selectedEnquiry?.id === enqId) {
        // refresh selected enquiry data
        const res = await axios.get(`/api/enquiries/${enqId}`);
        setSelectedEnquiry(res.data);
        setPreviewKey(prev => prev + 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleSelectDmc = async (enqId, dmcId) => {
  setSelectingDmcId(dmcId);                // show loader
  try {
    const res = await axios.patch(`/api/enquiries/${enqId}`, { selectedDmcId: dmcId });
    // ✅ Use the response directly (it already contains the updated enquiry)
    setSelectedEnquiry(res.data);
    setPreviewKey(prev => prev + 1);
    toast.success('Selected DMC updated');
    // Refresh the list so the table also shows the new selection (optional)
    fetchEnquiries();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to select DMC');
  } finally {
    setSelectingDmcId(null);               // hide loader
  }
};

  return (
    <div className="p-4 h-full">
      <h1 className="text-xl font-bold mb-4 text-gray-800">Enquiry History</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {/* Filters Card */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                  value={filters.destination}
                  onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={fetchEnquiries}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 rounded-md transition"
            >
              Apply Filters
            </button>
          </div>

          {/* Enquiry Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[calc(100vh-100px)]">
            {loading ? (
              <div className="flex justify-center items-center text-center py-8 text-gray-500 text-sm">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                Loading enquiries...
              
              </div>
            ) : (
              <EnquiryTable
                enquiries={enquiries}
                onSelectEnquiry={handleSelectEnquiry}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[calc(100vh-100px)]">
          {loading ? (
            <div className="flex justify-center items-center text-center h-full text-gray-500 text-sm">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
              Loading preview...</div>
          ) : selectedEnquiry ? (
            <PreviewPanel
              key={previewKey}
              data={selectedEnquiry}
              onSelectDmc={(dmcId) => handleSelectDmc(selectedEnquiry.id, dmcId)}
              selectingDmcId={selectingDmcId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="text-sm">Select an enquiry from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}