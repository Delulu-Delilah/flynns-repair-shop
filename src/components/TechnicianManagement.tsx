import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";

export function TechnicianManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Id<"technicians"> | null>(null);
  const [newTechnician, setNewTechnician] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
  });

  const technicians = useQuery(api.technicians.listTechnicians, { activeOnly: false });
  const technicianWorkload = useQuery(
    api.technicians.getTechnicianWorkload,
    selectedTechnician ? { technicianId: selectedTechnician } : "skip"
  );

  const createTechnicianWithAccount = useMutation(api.technicians.createTechnicianWithAccount);
  const { signIn } = useAuthActions();

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTechnician.name || !newTechnician.email || !newTechnician.password) {
      toast.error("Name, email, and password are required");
      return;
    }

    if (newTechnician.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      // Create the technician record first
      const result = await createTechnicianWithAccount({
        name: newTechnician.name,
        email: newTechnician.email,
        password: newTechnician.password,
        specialization: newTechnician.specialization || undefined,
      });
      
      // Now create the auth account using the signup flow
      const formData = new FormData();
      formData.set("email", result.email);
      formData.set("password", result.password);
      formData.set("flow", "signUp");
      
      // Create the auth account
      await signIn("password", formData);
      
      // Clear form and show success
      setNewTechnician({ name: "", email: "", password: "", specialization: "" });
      setShowCreateForm(false);
      toast.success("Technician and user account created successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("already exists")) {
        toast.error("A technician or user with this email already exists");
      } else {
        toast.error("Failed to create technician account: " + errorMessage);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider">TECHNICIAN.DATABASE</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="tron-button-green"
          >
            ADD TECHNICIAN
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Technician List */}
          <div className="lg:col-span-2">
            <div className="tron-card overflow-hidden">
              {technicians && technicians.length > 0 ? (
                <div className="divide-y divide-cyan-500/20">
                  {technicians.map((technician) => (
                    <div
                      key={technician._id}
                      className={`p-4 cursor-pointer hover:bg-cyan-500/10 transition-all duration-300 ${
                        selectedTechnician === technician._id ? "bg-cyan-500/20" : ""
                      }`}
                      onClick={() => setSelectedTechnician(technician._id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-cyan-300">{technician.name}</h3>
                          <p className="text-sm text-cyan-500">{technician.email}</p>
                          {technician.specialization && (
                            <p className="text-sm text-cyan-500">{technician.specialization}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`tron-status-badge ${
                            technician.isActive 
                              ? 'tron-status-completed' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {technician.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-cyan-500">
                  NO TECHNICIANS FOUND
                </div>
              )}
            </div>
          </div>

          {/* Technician Details / Create Form */}
          <div>
            {showCreateForm ? (
              <div className="tron-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-cyan-300 font-mono uppercase tracking-wider">CREATE USER ACCOUNT</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-cyan-500 hover:text-cyan-300 transition-colors text-xl"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleCreateTechnician} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                      FULL.NAME *
                    </label>
                    <input
                      type="text"
                      value={newTechnician.name}
                      onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
                      className="tron-input"
                      placeholder="Enter technician name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                      EMAIL.ADDRESS *
                    </label>
                    <input
                      type="email"
                      value={newTechnician.email}
                      onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
                      className="tron-input"
                      placeholder="user@domain.sys"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                      ACCESS.CODE *
                    </label>
                    <input
                      type="password"
                      value={newTechnician.password}
                      onChange={(e) => setNewTechnician({ ...newTechnician, password: e.target.value })}
                      className="tron-input"
                      placeholder="••••••••••••"
                      minLength={6}
                      required
                    />
                    <p className="text-xs text-cyan-500 mt-1 font-mono">Minimum 6 characters</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                      SPECIALIZATION
                    </label>
                    <input
                      type="text"
                      value={newTechnician.specialization}
                      onChange={(e) => setNewTechnician({ ...newTechnician, specialization: e.target.value })}
                      className="tron-input"
                      placeholder="e.g., Mobile devices, Laptops, etc."
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 tron-button-green"
                    >
                      CREATE ACCOUNT
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="tron-button"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            ) : technicianWorkload ? (
              <div className="tron-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-cyan-300 font-mono uppercase tracking-wider">TECHNICIAN.DETAILS</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 font-mono">NAME</label>
                    <p className="mt-1 text-cyan-100">{technicianWorkload.technician.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 font-mono">EMAIL</label>
                    <p className="mt-1 text-cyan-100">{technicianWorkload.technician.email}</p>
                  </div>
                  
                  {technicianWorkload.technician.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-cyan-400 font-mono">SPECIALIZATION</label>
                      <p className="mt-1 text-cyan-100">{technicianWorkload.technician.specialization}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 font-mono">STATUS</label>
                    <span className={`tron-status-badge mt-1 ${
                      technicianWorkload.technician.isActive 
                        ? 'tron-status-completed' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {technicianWorkload.technician.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Workload */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-3 text-cyan-300 font-mono">CURRENT.WORKLOAD</h4>
                  <div className="tron-card p-4">
                    <p className="text-2xl font-bold text-cyan-400">{technicianWorkload.activeTicketCount}</p>
                    <p className="text-sm text-cyan-500 font-mono">ACTIVE TICKETS</p>
                  </div>
                </div>

                {/* Active Tickets */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-3 text-cyan-300 font-mono">ACTIVE.TICKETS</h4>
                  {technicianWorkload.tickets && technicianWorkload.tickets.length > 0 ? (
                    <div className="space-y-2">
                      {technicianWorkload.tickets.slice(0, 5).map((ticket) => (
                        <div key={ticket._id} className="tron-card p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-cyan-300">{ticket.ticketNumber}</p>
                              <p className="text-xs text-cyan-500">{ticket.deviceMake} {ticket.deviceModel}</p>
                            </div>
                            <span className={`tron-status-badge text-xs ${
                              ticket.status === 'in_progress' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              ticket.status === 'diagnosed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              ticket.status === 'awaiting_parts' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              'tron-status-received'
                            }`}>
                              {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-cyan-500 text-sm font-mono">NO ACTIVE TICKETS</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="tron-card p-6">
                <p className="text-cyan-500 text-center font-mono">SELECT A TECHNICIAN TO VIEW DETAILS</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
