import { Id } from "../../convex/_generated/dataModel";

interface Ticket {
  _id: Id<"tickets">;
  ticketNumber: string;
  status: string;
  priority: string;
  deviceMake: string;
  deviceModel: string;
  issueDescription: string;
  dateReceived: number;
  estimatedCost?: number;
  finalCost?: number;
  customer?: {
    _id: string;
    _creationTime: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  } | null;
  technician?: {
    _id: string;
    _creationTime: number;
    name: string;
    email: string;
    specialization?: string;
    isActive: boolean;
  } | null;
}

interface TicketListProps {
  tickets: Ticket[];
  onViewTicket: (ticketId: Id<"tickets">) => void;
}

const statusStyles = {
  received: "tron-status-received",
  diagnosed: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  in_progress: "tron-status-in-progress",
  awaiting_parts: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  completed: "tron-status-completed",
  picked_up: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

const priorityStyles = {
  low: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
  medium: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
  high: "bg-red-500/20 text-red-400 border border-red-500/30",
  urgent: "bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse-glow",
};

export function TicketList({ tickets, onViewTicket }: TicketListProps) {
  if (!tickets.length) {
    return (
      <div className="tron-card p-12 text-center">
        <div className="text-cyan-400 font-mono text-lg mb-2">
          NO.RECORDS.FOUND
        </div>
        <div className="text-cyan-300/60 font-mono text-sm">
          DATABASE.EMPTY
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tickets.map((ticket) => (
        <div key={ticket._id} className="tron-card p-6 hover:border-cyan-400 transition-all duration-300 group">
          {/* Header with Ticket Number and Status */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-cyan-400 font-mono font-bold text-lg">
                {ticket.ticketNumber}
              </h3>
              <div className="flex gap-2 mt-2">
                <span
                  className={`tron-status-badge text-xs ${
                    statusStyles[ticket.status as keyof typeof statusStyles]
                  }`}
                >
                  {ticket.status.replace("_", ".")}
                </span>
                <span
                  className={`tron-status-badge text-xs ${
                    priorityStyles[ticket.priority as keyof typeof priorityStyles]
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-cyan-300 font-mono text-sm">
                {new Date(ticket.dateReceived).toLocaleDateString('en-US', {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit'
                }).replace(/\//g, '.')}
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="mb-4">
            <div className="text-cyan-300 font-mono text-sm mb-1">DEVICE.INFO</div>
            <div className="text-cyan-100 font-mono">
              {ticket.deviceMake} {ticket.deviceModel}
            </div>
          </div>

          {/* Issue Description */}
          <div className="mb-4">
            <div className="text-cyan-300 font-mono text-sm mb-1">ISSUE.DESCRIPTION</div>
            <div className="text-cyan-100 text-sm line-clamp-2">
              {ticket.issueDescription}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-4">
            <div className="text-cyan-300 font-mono text-sm mb-1">USER.DATA</div>
            <div className="text-cyan-100 font-medium">
              {ticket.customer?.name || "Unknown"}
            </div>
            <div className="text-cyan-300/60 text-sm font-mono">
              {ticket.customer?.phone || "No phone"}
            </div>
          </div>

          {/* Technician */}
          <div className="mb-4">
            <div className="text-cyan-300 font-mono text-sm mb-1">TECHNICIAN</div>
            {ticket.technician?.name ? (
              <div>
                <div className="text-electric-400 font-mono">{ticket.technician.name}</div>
                <div className="text-xs text-cyan-300/60 font-mono">
                  {ticket.technician.specialization}
                </div>
              </div>
            ) : (
              <span className="text-orange-400 font-mono">UNASSIGNED</span>
            )}
          </div>

          {/* Cost and Action */}
          <div className="flex justify-between items-end pt-4 border-t border-cyan-500/20">
            <div>
              <div className="text-cyan-300 font-mono text-sm">COST.ANALYSIS</div>
              <div className="text-electric-400 font-mono font-bold">
                ${(ticket.finalCost || ticket.estimatedCost || 0).toFixed(2)}
              </div>
              <div className="text-xs text-cyan-300/60 font-mono">
                {ticket.finalCost ? 'FINAL' : 'ESTIMATE'}
              </div>
            </div>
            <button
              onClick={() => onViewTicket(ticket._id)}
              className="tron-button text-sm px-4 py-2 group-hover:shadow-glow"
            >
              ACCESS
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
