import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { TicketManagement } from "./components/TicketManagement";
import { CustomerManagement } from "./components/CustomerManagement";
import { TechnicianManagement } from "./components/TechnicianManagement";
import { Reports } from "./components/Reports";
import { OfflineProvider } from "./components/OfflineManager";
import { TitleBar } from "./components/TitleBar";

function App() {
  const [activeTab, setActiveTab] = useState("tickets");

  return (
    <OfflineProvider>
      <div className="min-h-screen bg-tron-dark text-cyan-100">
        <Unauthenticated>
          <div className="min-h-screen flex items-center justify-center bg-tron-dark">
            <div className="max-w-md w-full mx-4">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-mono font-bold text-cyan-400 mb-2 tracking-wider">
                  FLYNNS
                </h1>
                <div className="text-cyan-300 text-sm font-mono uppercase tracking-widest">
                  Repair Management System
                </div>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="flex flex-col h-screen">
            {/* Custom Title Bar */}
            <TitleBar />
            
            {/* Header with Navigation */}
            <header className="bg-tron-darker border-b border-cyan-400">
              <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
                <h1 className="text-2xl font-mono font-bold text-cyan-400 tracking-wider">
                  FLYNNS
                </h1>
                <SignOutButton />
              </div>
              
              {/* Navigation Tabs */}
              <nav className="flex space-x-1 p-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("tickets")}
                  className={`px-6 py-2 font-mono text-sm tracking-wider transition-all duration-300 ${
                    activeTab === "tickets"
                      ? "bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400"
                      : "text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10"
                  }`}
                >
                  🎫 TICKETS
                </button>
                <button
                  onClick={() => setActiveTab("customers")}
                  className={`px-6 py-2 font-mono text-sm tracking-wider transition-all duration-300 ${
                    activeTab === "customers"
                      ? "bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400"
                      : "text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10"
                  }`}
                >
                  👥 CUSTOMERS
                </button>
                <button
                  onClick={() => setActiveTab("technicians")}
                  className={`px-6 py-2 font-mono text-sm tracking-wider transition-all duration-300 ${
                    activeTab === "technicians"
                      ? "bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400"
                      : "text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10"
                  }`}
                >
                  🔧 TECHNICIANS
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-6 py-2 font-mono text-sm tracking-wider transition-all duration-300 ${
                    activeTab === "reports"
                      ? "bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400"
                      : "text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10"
                  }`}
                >
                  📊 REPORTS
                </button>
              </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              {activeTab === "tickets" && <TicketManagement />}
              {activeTab === "customers" && <CustomerManagement />}
              {activeTab === "technicians" && <TechnicianManagement />}
              {activeTab === "reports" && <Reports />}
            </main>
          </div>
        </Authenticated>
      </div>
    </OfflineProvider>
  );
}

export default App;
