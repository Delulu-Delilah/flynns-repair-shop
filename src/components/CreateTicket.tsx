import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface CreateTicketProps {
  onTicketCreated: () => void;
}

export function CreateTicket({ onTicketCreated }: CreateTicketProps) {
  const [formData, setFormData] = useState({
    customerId: "" as Id<"customers"> | "",
    deviceMake: "",
    deviceModel: "",
    serialNumber: "",
    issueDescription: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    estimatedCost: "",
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const customers = useQuery(api.customers.listCustomers);
  const searchResults = useQuery(
    api.customers.searchCustomers,
    customerSearch.trim() ? { searchTerm: customerSearch } : "skip"
  );

  const createTicket = useMutation(api.tickets.createTicket);
  const createCustomer = useMutation(api.customers.createCustomer);

  const displayCustomers = customerSearch.trim() ? searchResults : customers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let customerId = formData.customerId;
      
      // Create new customer if needed
      if (showNewCustomer) {
        if (!newCustomer.name || !newCustomer.phone) {
          toast.error("Customer name and phone are required");
          return;
        }
        
        customerId = await createCustomer({
          name: newCustomer.name,
          email: newCustomer.email || undefined,
          phone: newCustomer.phone,
          address: newCustomer.address || undefined,
        });
      }
      
      if (!customerId) {
        toast.error("Please select or create a customer");
        return;
      }
      
      await createTicket({
        customerId,
        deviceMake: formData.deviceMake,
        deviceModel: formData.deviceModel,
        serialNumber: formData.serialNumber || undefined,
        issueDescription: formData.issueDescription,
        priority: formData.priority,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
      });
      
      toast.success("Ticket created successfully");
      onTicketCreated();
    } catch (error) {
      toast.error("Failed to create ticket");
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono uppercase tracking-wider">Create New Ticket</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">
              Customer
            </label>
            
            {!showNewCustomer ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="tron-input"
                />
                
                {displayCustomers && displayCustomers.length > 0 && (
                  <div className="border border-cyan-500/30 rounded-md max-h-40 overflow-y-auto bg-grid-dark-200">
                    {displayCustomers.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, customerId: customer._id });
                          setCustomerSearch(customer.name);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-cyan-500/10 border-b border-cyan-500/20 last:border-b-0 text-cyan-100 transition-all duration-300 ${
                          formData.customerId === customer._id ? "bg-cyan-500/20" : ""
                        }`}
                      >
                        <div className="font-medium text-cyan-300">{customer.name}</div>
                        <div className="text-sm text-cyan-500">{customer.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                >
                  + Create new customer
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-cyan-500/30 rounded-md bg-grid-dark-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-cyan-300">New Customer</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="text-cyan-500 hover:text-cyan-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="tron-input"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone *"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="tron-input"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="tron-input"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="tron-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Device Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Device Make *
              </label>
              <input
                type="text"
                value={formData.deviceMake}
                onChange={(e) => setFormData({ ...formData, deviceMake: e.target.value })}
                className="tron-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Device Model *
              </label>
              <input
                type="text"
                value={formData.deviceModel}
                onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                className="tron-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">
              Serial Number
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="tron-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">
              Issue Description *
            </label>
            <textarea
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              rows={4}
              className="tron-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as "low" | "medium" | "high" | "urgent" })}
                className="tron-input tron-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Estimated Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className="tron-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onTicketCreated}
              className="tron-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tron-button-green"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
