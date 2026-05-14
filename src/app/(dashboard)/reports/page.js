'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ReportFilters from '@/components/ReportFilters';

const getDateRangeFromPeriod = (period, groupBy) => {
  if (groupBy === 'daily') {
    return { startDate: period, endDate: period };
  } else if (groupBy === 'monthly') {
    const [year, month] = period.split('-');
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  } else if (groupBy === 'quarterly') {
    const [year, q] = period.split('-Q');
    const quarter = parseInt(q);
    const startMonth = (quarter - 1) * 3;
    const start = new Date(parseInt(year), startMonth, 1);
    const end = new Date(parseInt(year), startMonth + 3, 0);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  } else if (groupBy === 'yearly') {
    const start = new Date(parseInt(period), 0, 1);
    const end = new Date(parseInt(period), 11, 31);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  }
  return null;
};

export default function ReportsPage() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodDetails, setPeriodDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const totalEnquiries = reportData.reduce((sum, item) => sum + (item.totalEnquiries || 0), 0);
  const totalRevenue = reportData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const avgMargin = reportData.length
    ? reportData.reduce((sum, item) => sum + (item.averageMargin || 0), 0) / reportData.length
    : 0;

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        groupBy,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await axios.get(`/api/reports?${params.toString()}`);
      const safeData = (res.data || []).map(item => ({
        ...item,
        totalRevenue: item.totalRevenue ?? 0,
        averageMargin: item.averageMargin ?? 0,
        totalEnquiries: item.totalEnquiries ?? 0,
      }));
      setReportData(safeData);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodDetails = async (period) => {
    const range = getDateRangeFromPeriod(period, groupBy);
    if (!range) {
      toast.error('Invalid period format');
      return;
    }
    setDetailsLoading(true);
    setSelectedPeriod(period);
    try {
      const params = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 100,
      });
      const res = await axios.get(`/api/enquiries?${params.toString()}`);
      const enquiriesList = res.data.enquiries || [];
      setPeriodDetails(enquiriesList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load period details');
      setPeriodDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRowClick = (period) => fetchPeriodDetails(period);
  const closeSidebar = () => {
    setSelectedPeriod(null);
    setPeriodDetails([]);
  };

  useEffect(() => {
    fetchReport();
  }, [groupBy, dateRange]);

  const handleExport = async () => {
  try {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    const response = await fetch(`/api/reports/export?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Export failed');
    }
    
    // Get the blob from response
    const blob = await response.blob();
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Export started');
  } catch (error) {
    toast.error(error.message || 'Failed to export');
    console.error(error);
  }
};

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h1 className="text-xl font-bold text-gray-800">Reports</h1>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2 transition w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 mb-4">
        <ReportFilters
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onApply={fetchReport}
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-md shadow-sm p-8 text-center">
          <div className=" flex justify-center items-center text-gray-500 text-sm">
            <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
            Loading reports...</div>
        </div>
      ) : reportData.length === 0 ? (
        <div className="bg-white rounded-md shadow-sm p-8 text-center">
          <div className="text-gray-500 text-sm">No data for selected period.</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-md shadow-sm p-3 border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase">Total Enquiries</p>
              <p className="text-xl font-bold text-gray-800">{totalEnquiries}</p>
            </div>
            <div className="bg-white rounded-md shadow-sm p-3 border-l-4 border-green-500">
              <p className="text-xs text-gray-500 uppercase">Total Revenue</p>
              <p className="text-xl font-bold text-gray-800">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-md shadow-sm p-3 border-l-4 border-purple-500">
              <p className="text-xs text-gray-500 uppercase">Avg Margin (per enquiry)</p>
              <p className="text-xl font-bold text-gray-800">₹{avgMargin.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2 text-left">Period</th>
                    <th className="px-4 py-2 text-left"># Enquiries</th>
                    <th className="px-4 py-2 text-left">Total Revenue (₹)</th>
                    <th className="px-4 py-2 text-left">Avg Margin (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {reportData.map((item) => (
                    <tr
                      key={item.period}
                      onClick={() => handleRowClick(item.period)}
                      className="hover:bg-gray-50 transition cursor-pointer"
                    >
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{item.period}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-600">{item.totalEnquiries}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                        ₹{(item.totalRevenue ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                        ₹{(item.averageMargin ?? 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Right Sidebar – Details Panel */}
      {selectedPeriod && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeSidebar}></div>
          <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-xl z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center">
              <h2 className="text-md font-semibold text-gray-800">
                Enquiries for {selectedPeriod}
              </h2>
              <button onClick={closeSidebar} className="text-gray-500 hover:text-gray-700 text-xl leading-none">
                ✕
              </button>
            </div>
            <div className="p-3">
              {detailsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : periodDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No enquiries found for this period.</div>
              ) : (
                <div className="space-y-4">
                  {periodDetails.map((enq) => {
                    const totalPax = (enq.adults || 0) + (enq.kids || 0);
                    const enquiryCreator = enq.user?.name || enq.user?.email || 'Unknown';
                    return (
                      <div key={enq.id} className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                        {/* Enquiry Header */}
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">Enquiry #{enq.enqNo}</p>
                              <p className="text-xs text-gray-500">{new Date(enq.date).toLocaleDateString()}</p>
                              <p className="text-sm text-gray-600 mt-0.5">{enq.destination}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">PAX: {totalPax} (A:{enq.adults}, K:{enq.kids})</p>
                              <p className="text-xs text-gray-500 mt-0.5">Created by: {enquiryCreator}</p>
                            </div>
                          </div>
                        </div>
                        {/* DMC Quotations */}
                        <div className="divide-y divide-gray-200">
                          {enq.dmcQuotations && enq.dmcQuotations.length > 0 ? (
                            enq.dmcQuotations.map((dmc, idx) => (
                              <div key={dmc.id} className="p-3 text-sm space-y-2">
                               <div className="flex justify-between items-start">
  <div>
    <div className="flex items-center gap-2">
      <p className="font-semibold text-gray-700">{dmc.dmcName || `DMC ${idx+1}`}</p>
      {dmc.isSelected && (
        <span className="text-[10px] font-medium bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
          ✓ Selected
        </span>
      )}
    </div>
    <p className="text-xs text-gray-400">Ref: {dmc.quotationRef || 'N/A'} | {new Date(dmc.quotationDate).toLocaleDateString()}</p>
  </div>
  <div className="text-right">
    <p className="font-bold text-green-700">₹{dmc.finalPrice?.toLocaleString('en-IN')}</p>
    <p className="text-xs text-gray-500">Final Total</p>
  </div>
</div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs bg-gray-50 p-2 rounded">
                                  <div>Adults: {dmc.adultCount} (FOC: {dmc.foc})</div>
                                  <div>Kids: {dmc.kidCount}</div>
                                  <div>Adult Rate: ₹{dmc.adultRate?.toLocaleString('en-IN')}</div>
                                  <div>Kid Rate: ₹{dmc.kidRate?.toLocaleString('en-IN')}</div>
                                  <div>Adult Margin: ₹{dmc.adultMargin?.toLocaleString('en-IN')}</div>
                                  <div>Kid Margin: ₹{dmc.kidMargin?.toLocaleString('en-IN')}</div>
                                  <div>Subtotal: ₹{dmc.subtotal?.toLocaleString('en-IN')}</div>
                                  <div>GST: ₹{dmc.gstAmount?.toLocaleString('en-IN')}</div>
                                  <div>TCS: ₹{dmc.tcsAmount?.toLocaleString('en-IN')}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500 text-sm">No DMC quotations</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}