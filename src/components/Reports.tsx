import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { useOffline } from "./OfflineManager";

export function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { printReport, isElectron } = useOffline();

  const ticketStats = useQuery(api.reports.getTicketStats, {
    startDate: new Date(dateRange.startDate).getTime(),
    endDate: new Date(dateRange.endDate).getTime(),
  });

  const technicianPerformance = useQuery(api.reports.getTechnicianPerformance, {
    startDate: new Date(dateRange.startDate).getTime(),
    endDate: new Date(dateRange.endDate).getTime(),
  });

  const handlePrintReport = async () => {
    if (!ticketStats || !technicianPerformance) return;

    const reportData = {
      dateRange,
      ticketStats,
      technicianPerformance,
      generatedAt: new Date().toISOString(),
    };

    try {
      await printReport(reportData, 'analytics');
    } catch (error) {
      console.error('Print report error:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider">Reports & Analytics</h2>
          
          {isElectron && ticketStats && (
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded font-mono hover:bg-cyan-600/30 hover:border-cyan-400 transition-all duration-300"
              title="Print Report"
            >
              🖨️ PRINT REPORT
            </button>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="tron-card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-cyan-300">Date Range</h3>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="tron-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="tron-input"
              />
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        {ticketStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold text-cyan-300">Total Tickets</h3>
              <p className="text-3xl font-bold text-cyan-400 font-mono">{ticketStats.totalTickets}</p>
            </div>
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold text-cyan-300">Completed</h3>
              <p className="text-3xl font-bold text-electric-400 font-mono">{ticketStats.completedTickets}</p>
            </div>
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold text-cyan-300">Total Revenue</h3>
              <p className="text-3xl font-bold text-purple-400 font-mono">${ticketStats.totalRevenue}</p>
            </div>
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold text-cyan-300">Avg Repair Time</h3>
              <p className="text-3xl font-bold text-orange-400 font-mono">{ticketStats.avgRepairTimeHours}h</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          {ticketStats && (
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300">Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(ticketStats.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="capitalize text-cyan-100">{status.replace('_', ' ')}</span>
                    <span className="font-semibold text-cyan-400 font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technician Performance */}
          {technicianPerformance && (
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300">Technician Performance</h3>
              <div className="overflow-x-auto">
                <table className="tron-table">
                  <thead>
                    <tr>
                      <th>Technician</th>
                      <th>Tickets</th>
                      <th>Completed</th>
                      <th>Avg Time</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicianPerformance.map((perf) => (
                      <tr key={perf.technician._id}>
                        <td>{perf.technician.name}</td>
                        <td>{perf.totalTickets}</td>
                        <td>{perf.completedTickets}</td>
                        <td>{perf.avgRepairTimeHours}h</td>
                        <td>${perf.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Tickets by Day Chart */}
        {ticketStats && ticketStats.ticketsByDay.length > 0 && (
          <div className="tron-card p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-cyan-300">Tickets by Day</h3>
            <div className="space-y-2">
              {ticketStats.ticketsByDay.map((day) => (
                <div key={day.date} className="flex justify-between items-center">
                  <span className="text-cyan-100 font-mono">{new Date(day.date).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="bg-cyan-500/30 h-4 rounded border border-cyan-500/50"
                      style={{ width: `${(day.count / Math.max(...ticketStats.ticketsByDay.map(d => d.count))) * 200}px` }}
                    ></div>
                    <span className="font-semibold w-8 text-right text-cyan-400 font-mono">{day.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
