export default function ReportFilters({ groupBy, setGroupBy, dateRange, setDateRange, onApply }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="border p-2 rounded-md">
          <label className="block text-sm font-medium">Group By</label>
          <select
            className="input w-full"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="border p-2 rounded-md">
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            className="input w-full"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </div>
        <div className="border p-2 rounded-md">
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            className="input w-full"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button onClick={onApply} className="btn-primary text-red-600 w-full">Generate Report</button>
        </div>
      </div>
    </div>
  );
}