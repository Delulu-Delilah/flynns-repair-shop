import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function TimeClock() {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<Id<"technicians"> | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const technicians = useQuery(api.technicians.listTechnicians, { activeOnly: true });
  const timeEntries = useQuery(api.timeEntries.listTimeEntries, {}) || [];
  const activeTimeEntry = useQuery(
    api.timeEntries.getActiveEntry,
    selectedTechnicianId ? { technicianId: selectedTechnicianId } : "skip"
  );
  
  const clockIn = useMutation(api.timeEntries.clockIn);
  const clockOut = useMutation(api.timeEntries.clockOut);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    if (!selectedTechnicianId) return;
    
    try {
      await clockIn({ technicianId: selectedTechnicianId });
    } catch (error) {
      console.error("Failed to clock in:", error);
    }
  };

  const handleClockOut = async () => {
    if (!selectedTechnicianId || !activeTimeEntry) return;
    
    try {
      await clockOut({ entryId: activeTimeEntry._id });
    } catch (error) {
      console.error("Failed to clock out:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const calculateHours = (clockIn: number, clockOut?: number) => {
    const endTime = clockOut || Date.now();
    const hours = (endTime - clockIn) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const selectedTechnician = technicians?.find(t => t._id === selectedTechnicianId);
  const todaysEntries = timeEntries.filter(entry => 
    entry.date === new Date().toISOString().split('T')[0] &&
    entry.technicianId === selectedTechnicianId
  );

  return (
    <div className="space-y-6">
      {/* Digital Clock Display */}
      <div className="tron-card p-8 text-center">
        <div className="text-cyan-400 font-mono text-sm tracking-wider mb-2">
          CURRENT.TIME
        </div>
        <div className="text-4xl font-mono text-electric-400 mb-2 tracking-wider">
          {formatTime(currentTime)}
        </div>
        <div className="text-cyan-300 font-mono text-sm">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Technician Selection */}
      <div className="tron-card p-6">
        <div className="text-cyan-400 font-mono text-sm tracking-wider mb-4">
          SELECT.TECHNICIAN
        </div>
        <select
          value={selectedTechnicianId || ""}
          onChange={(e) => setSelectedTechnicianId(e.target.value ? e.target.value as Id<"technicians"> : null)}
          className="tron-input w-full"
        >
          <option value="">Choose technician...</option>
          {technicians?.map((tech) => (
            <option key={tech._id} value={tech._id}>
              {tech.name} - {tech.email}
            </option>
          ))}
        </select>
      </div>

      {/* Clock In/Out Controls */}
      {selectedTechnicianId && (
        <div className="tron-card p-6">
          <div className="text-cyan-400 font-mono text-sm tracking-wider mb-4">
            TIME.CLOCK.CONTROLS
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-electric-400 font-mono text-lg">
                {selectedTechnician?.name}
              </div>
              <div className="text-cyan-300 text-sm">
                {selectedTechnician?.email}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                activeTimeEntry ? 'bg-electric-500 animate-pulse' : 'bg-gray-500'
              }`}></div>
              <span className={`font-mono text-sm ${
                activeTimeEntry ? 'text-electric-400' : 'text-gray-400'
              }`}>
                {activeTimeEntry ? 'CLOCKED.IN' : 'CLOCKED.OUT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleClockIn}
              disabled={!!activeTimeEntry}
              className={`tron-button ${
                activeTimeEntry ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              🕐 CLOCK IN
            </button>
            
            <button
              onClick={handleClockOut}
              disabled={!activeTimeEntry}
              className={`tron-button-orange ${
                !activeTimeEntry ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              🕐 CLOCK OUT
            </button>
          </div>

          {/* Active Session Display */}
          {activeTimeEntry && (
            <div className="mt-6 p-4 bg-electric-500/10 border border-electric-500/30 rounded">
              <div className="text-electric-400 font-mono text-sm tracking-wider mb-2">
                ACTIVE.SESSION
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-cyan-300 text-sm">
                    Started: {new Date(activeTimeEntry.clockIn).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-electric-400 font-mono text-lg">
                  {calculateHours(activeTimeEntry.clockIn)} hrs
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today's Time Entries */}
      {selectedTechnicianId && todaysEntries.length > 0 && (
        <div className="tron-card p-6">
          <div className="text-cyan-400 font-mono text-sm tracking-wider mb-4">
            TODAY.TIMESHEET
          </div>
          
          <div className="space-y-3">
            {todaysEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex justify-between items-center p-3 bg-tron-darker border border-cyan-500/20 rounded"
              >
                <div>
                  <div className="text-cyan-300 text-sm">
                    {new Date(entry.clockIn).toLocaleTimeString()} - {" "}
                    {entry.clockOut 
                      ? new Date(entry.clockOut).toLocaleTimeString()
                      : "In Progress"
                    }
                  </div>
                </div>
                <div className="text-electric-400 font-mono">
                  {entry.clockOut 
                    ? `${entry.totalHours} hrs`
                    : `${calculateHours(entry.clockIn)} hrs`
                  }
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-cyan-500/30">
            <div className="flex justify-between items-center">
              <span className="text-cyan-400 font-mono text-sm">TOTAL.TODAY</span>
              <span className="text-electric-400 font-mono text-lg">
                {todaysEntries.reduce((total, entry) => {
                  const hours = entry.clockOut 
                    ? parseFloat(entry.totalHours?.toString() || "0")
                    : parseFloat(calculateHours(entry.clockIn));
                  return total + hours;
                }, 0).toFixed(2)} hrs
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 