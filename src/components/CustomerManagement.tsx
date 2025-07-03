import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function CustomerManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Id<"customers"> | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const customers = useQuery(api.customers.listCustomers);
  const searchResults = useQuery(
    api.customers.searchCustomers,
    searchTerm.trim() ? { searchTerm } : "skip"
  );
  const customerDetails = useQuery(
    api.customers.getCustomer,
    selectedCustomer ? { customerId: selectedCustomer } : "skip"
  );

  const createCustomer = useMutation(api.customers.createCustomer);

  const displayCustomers = searchTerm.trim() ? searchResults : customers;

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Name and phone are required");
      return;
    }

    try {
      await createCustomer({
        name: newCustomer.name,
        email: newCustomer.email || undefined,
        phone: newCustomer.phone,
        address: newCustomer.address || undefined,
      });
      
      setNewCustomer({ name: "", email: "", phone: "", address: "" });
      setShowCreateForm(false);
      toast.success("Customer created successfully");
    } catch (error) {
      toast.error("Failed to create customer");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider">Customer Management</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="tron-button-green"
          >
            Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tron-input"
              />
            </div>

            {/* Customer List */}
            <div className="tron-card overflow-hidden">
              {displayCustomers && displayCustomers.length > 0 ? (
                <div className="divide-y divide-cyan-500/20">
                  {displayCustomers.map((customer) => (
                    <div
                      key={customer._id}
                      className={`p-4 cursor-pointer hover:bg-cyan-500/10 transition-all duration-300 ${
                        selectedCustomer === customer._id ? "bg-cyan-500/20" : ""
                      }`}
                      onClick={() => setSelectedCustomer(customer._id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-cyan-300">{customer.name}</h3>
                          <p className="text-sm text-cyan-500">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-sm text-cyan-500">{customer.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-cyan-500">
                  No customers found
                </div>
              )}
            </div>
          </div>

          {/* Customer Details / Create Form */}
          <div>
            {showCreateForm ? (
              <div className="tron-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-cyan-300">Add New Customer</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-cyan-500 hover:text-cyan-300 transition-colors text-xl"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleCreateCustomer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="tron-input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="tron-input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="tron-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      rows={3}
                      className="tron-input"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 tron-button-green"
                    >
                      Create Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="tron-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : customerDetails ? (
              <div className="tron-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-cyan-300">Customer Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400">Name</label>
                    <p className="mt-1 text-cyan-100">{customerDetails.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-cyan-400">Phone</label>
                    <p className="mt-1 text-cyan-100">{customerDetails.phone}</p>
                  </div>
                  
                  {customerDetails.email && (
                    <div>
                      <label className="block text-sm font-medium text-cyan-400">Email</label>
                      <p className="mt-1 text-cyan-100">{customerDetails.email}</p>
                    </div>
                  )}
                  
                  {customerDetails.address && (
                    <div>
                      <label className="block text-sm font-medium text-cyan-400">Address</label>
                      <p className="mt-1 text-cyan-100">{customerDetails.address}</p>
                    </div>
                  )}
                </div>

                {/* Customer's Tickets */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-3 text-cyan-300">Recent Tickets</h4>
                  {customerDetails.tickets && customerDetails.tickets.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetails.tickets.slice(0, 5).map((ticket) => (
                        <div key={ticket._id} className="p-3 border border-cyan-500/30 rounded-md bg-grid-dark-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-cyan-300">{ticket.ticketNumber}</p>
                              <p className="text-xs text-cyan-500">{ticket.deviceMake} {ticket.deviceModel}</p>
                            </div>
                            <span className={`tron-status-badge ${
                              ticket.status === 'completed' ? 'tron-status-completed' :
                              ticket.status === 'in_progress' ? 'tron-status-in-progress' :
                              'tron-status-received'
                            }`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-cyan-500 text-sm">No tickets found</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="tron-card p-6">
                <p className="text-cyan-500 text-center">Select a customer to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
