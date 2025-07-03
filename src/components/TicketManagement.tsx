import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TicketList } from "./TicketList";
import { CreateTicket } from "./CreateTicket";
import { TicketDetails } from "./TicketDetails";
import { Reports } from "./Reports";
import { CustomerManagement } from "./CustomerManagement";
import { TechnicianManagement } from "./TechnicianManagement";
import { useOffline } from "./OfflineManager";
import { Id } from "../../convex/_generated/dataModel";

type View = "tickets" | "create" | "details" | "reports" | "customers" | "technicians";

export function TicketManagement() {
  const [currentView, setCurrentView] = useState<View>("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"tickets"> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { isOnline, isElectron } = useOffline();
  
  const tickets = useQuery(api.tickets.listTickets, {});
  const searchResults = useQuery(
    api.tickets.searchTickets,
    searchTerm.trim() ? { searchTerm } : "skip"
  );

  const displayTickets = searchTerm.trim() ? searchResults : tickets;

  const handleViewTicket = (ticketId: Id<"tickets">) => {
    setSelectedTicketId(ticketId);
    setCurrentView("details");
  };

  const handleTicketCreated = () => {
    setCurrentView("tickets");
  };

  const navItems = [
    { id: "tickets", label: "ALL TICKETS", icon: "🎫" },
    { id: "create", label: "CREATE TICKET", icon: "➕" },
    { id: "customers", label: "CUSTOMERS", icon: "👥" },
    { id: "technicians", label: "TECHNICIANS", icon: "🔧" },
    { id: "reports", label: "REPORTS", icon: "📊" },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-72 tron-sidebar p-6 flex flex-col overflow-hidden">
        <div className="mb-8">
          <div className="text-cyan-400 font-mono text-sm tracking-wider mb-2">
            NAVIGATION.MENU
          </div>
          <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent"></div>
        </div>
        
        <nav className="space-y-2 flex-shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full text-left tron-nav-item ${
                currentView === item.id ? "active" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-mono text-sm tracking-wide">{item.label}</span>
              </div>
            </button>
          ))}
        </nav>

        {/* System Status */}
        <div className="mt-auto pt-8 flex-shrink-0">
          <div className="tron-card p-4">
            <div className="text-cyan-400 font-mono text-xs tracking-wider mb-2">
              SYSTEM.STATUS
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-electric-500 animate-pulse' : 'bg-orange-500'
              }`}></div>
              <span className={`text-xs font-mono ${
                isOnline ? 'text-electric-400' : 'text-orange-400'
              }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-cyan-500' : 'bg-orange-500'
              }`}></div>
              <span className={`text-xs font-mono ${
                isOnline ? 'text-cyan-300' : 'text-orange-300'
              }`}>
                {isOnline ? 'DATABASE.CONNECTED' : 'LOCAL.DATABASE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        {currentView === "tickets" && (
          <div className="tron-header border-l border-cyan-500/30 p-6">
            <div className="max-w-md">
              <div className="text-cyan-400 font-mono text-sm tracking-wider mb-2">
                SEARCH.DATABASE
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tickets, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tron-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-grid-dark-300/50">
          <div className="p-6">
            {currentView === "tickets" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">
                      TICKET.DATABASE
                    </h2>
                    <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent w-48 mt-2"></div>
                  </div>
                  <div className="text-cyan-300 font-mono text-sm">
                    TOTAL: {displayTickets?.length || 0} RECORDS
                  </div>
                </div>
                <TicketList
                  tickets={displayTickets || []}
                  onViewTicket={handleViewTicket}
                />
              </div>
            )}
            {currentView === "create" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">
                    CREATE.TICKET
                  </h2>
                  <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent w-48 mt-2"></div>
                </div>
                <CreateTicket onTicketCreated={handleTicketCreated} />
              </div>
            )}
            {currentView === "details" && selectedTicketId && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">
                      TICKET.DETAILS
                    </h2>
                    <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent w-48 mt-2"></div>
                  </div>
                  <button
                    onClick={() => setCurrentView("tickets")}
                    className="tron-button text-sm"
                  >
                    ← BACK TO DATABASE
                  </button>
                </div>
                <TicketDetails
                  ticketId={selectedTicketId}
                  onBack={() => setCurrentView("tickets")}
                />
              </div>
            )}
            {currentView === "reports" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">
                    ANALYTICS.DASHBOARD
                  </h2>
                  <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent w-48 mt-2"></div>
                </div>
                <Reports />
              </div>
            )}
            {currentView === "customers" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">
                    CUSTOMER.DATABASE
                  </h2>
                  <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent w-48 mt-2"></div>
                </div>
                <CustomerManagement />
              </div>
            )}
            {currentView === "technicians" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">
                    TECHNICIAN.DATABASE
                  </h2>
                  <div className="h-px bg-gradient-to-r from-cyan-500 to-transparent w-48 mt-2"></div>
                </div>
                <TechnicianManagement />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
