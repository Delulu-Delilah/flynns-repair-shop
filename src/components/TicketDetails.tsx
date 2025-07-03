import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useOffline } from "./OfflineManager";

interface TicketDetailsProps {
  ticketId: Id<"tickets">;
  onBack: () => void;
}

const statusOptions = [
  { value: "received", label: "Received" },
  { value: "diagnosed", label: "Diagnosed" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_parts", label: "Awaiting Parts" },
  { value: "completed", label: "Completed" },
  { value: "picked_up", label: "Picked Up" },
];

const statusColors = {
  received: "bg-blue-100 text-blue-800",
  diagnosed: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  awaiting_parts: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  picked_up: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function TicketDetails({ ticketId, onBack }: TicketDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    diagnosticNotes: "",
    repairActions: "",
    finalCost: "",
  });
  const [statusUpdate, setStatusUpdate] = useState({
    newStatus: "",
    notes: "",
  });
  const [newPart, setNewPart] = useState({
    partName: "",
    partNumber: "",
    quantity: 1,
    unitCost: 0,
    supplier: "",
  });
  const [showAddPart, setShowAddPart] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: "square",
    totalAmount: 0,
    taxRate: 0.06, // 6% Michigan sales tax
    customerPaid: 0,
    notes: "",
    laborCost: 0, // Adjustable labor cost for checkout
  });

  const { printTicket, exportToPDF, isElectron } = useOffline();

  const ticket = useQuery(api.tickets.getTicket, { ticketId });
  const technicians = useQuery(api.technicians.listTechnicians, { activeOnly: true });
  const ticketHistory = useQuery(api.tickets.getTicketHistory, { ticketId });

  const updateTicketStatus = useMutation(api.tickets.updateTicketStatus);
  const updateTicketDetails = useMutation(api.tickets.updateTicketDetails);
  const assignTechnician = useMutation(api.tickets.assignTechnician);
  const addPart = useMutation(api.parts.addPart);
  const removePart = useMutation(api.parts.removePart);
  const deleteTicket = useMutation(api.tickets.deleteTicket);

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdate.newStatus) return;

    try {
      await updateTicketStatus({
        ticketId,
        newStatus: statusUpdate.newStatus as any,
        notes: statusUpdate.notes || undefined,
      });
      setStatusUpdate({ newStatus: "", notes: "" });
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTicketDetails({
        ticketId,
        diagnosticNotes: editData.diagnosticNotes || undefined,
        repairActions: editData.repairActions || undefined,
        finalCost: editData.finalCost ? parseFloat(editData.finalCost) : undefined,
      });
      setIsEditing(false);
      toast.success("Ticket details updated");
    } catch (error) {
      toast.error("Failed to update details");
    }
  };

  const handleTechnicianAssign = async (technicianId: Id<"technicians">) => {
    try {
      await assignTechnician({ ticketId, technicianId });
      toast.success("Technician assigned");
    } catch (error) {
      toast.error("Failed to assign technician");
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPart({
        ticketId,
        partName: newPart.partName,
        partNumber: newPart.partNumber || undefined,
        quantity: newPart.quantity,
        unitCost: newPart.unitCost,
        supplier: newPart.supplier || undefined,
      });
      setNewPart({
        partName: "",
        partNumber: "",
        quantity: 1,
        unitCost: 0,
        supplier: "",
      });
      setShowAddPart(false);
      toast.success("Part added");
    } catch (error) {
      toast.error("Failed to add part");
    }
  };

  const handleRemovePart = async (partId: Id<"parts">) => {
    try {
      await removePart({ partId });
      toast.success("Part removed");
    } catch (error) {
      toast.error("Failed to remove part");
    }
  };

  const handleDeleteTicket = async () => {
    try {
      await deleteTicket({ ticketId });
      toast.success("Ticket deleted successfully");
      onBack(); // Navigate back to ticket list
    } catch (error) {
      toast.error("Failed to delete ticket");
    }
  };

  const handlePrintTicket = async () => {
    try {
      await printTicket(ticket);
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(ticket);
    } catch (error) {
      console.error('PDF export error:', error);
    }
  };

  const totalPartsCost = ticket.parts?.reduce((sum, part) => sum + part.totalCost, 0) || 0;

  const handleCheckout = async () => {
    if (!ticket) return;

    const totalPartsCost = ticket.parts?.reduce((sum, part) => sum + part.totalCost, 0) || 0;
    const finalCost = ticket.finalCost || ticket.estimatedCost || 0;
    const totalAmount = finalCost + totalPartsCost;
    const taxAmount = totalAmount * paymentData.taxRate;
    const grandTotal = totalAmount + taxAmount;

    setPaymentData(prev => ({
      ...prev,
      totalAmount: grandTotal,
      customerPaid: grandTotal,
      laborCost: finalCost // Initialize with current labor cost
    }));
    setShowCheckout(true);
  };

  const handleProcessPayment = async () => {
    if (!ticket) return;

    try {
      // In a real implementation, you would integrate with Square's Web Payments SDK here
      // For now, we'll simulate the payment process
      
      toast.info("Processing payment with Square...");
      
      // Simulate Square payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update ticket status to completed and picked up
      await updateTicketStatus({
        ticketId,
        newStatus: "picked_up",
        notes: `Payment processed via Square. Amount: $${paymentData.customerPaid.toFixed(2)}`,
      });

      // Generate and print receipt
      await printReceipt();
      
      toast.success("Payment processed successfully!");
      setShowCheckout(false);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error("Payment processing failed. Please try again.");
    }
  };

  const printReceipt = async () => {
    if (!ticket) return;

    const totalPartsCost = ticket.parts?.reduce((sum, part) => sum + part.totalCost, 0) || 0;
    const subtotal = paymentData.laborCost + totalPartsCost;
    const taxAmount = subtotal * paymentData.taxRate;
    const grandTotal = subtotal + taxAmount;

    const receiptData = {
      ...ticket,
      finalCost: paymentData.laborCost, // Use the adjusted labor cost
      payment: {
        subtotal,
        taxAmount,
        taxRate: paymentData.taxRate,
        grandTotal,
        paymentMethod: paymentData.paymentMethod,
        paidAmount: paymentData.customerPaid,
        change: paymentData.customerPaid - grandTotal,
        transactionDate: new Date().toISOString(),
        receiptNumber: `RCT-${ticket.ticketNumber}-${Date.now()}`
      }
    };

    if (isElectron) {
      try {
        // Use the existing print functionality but with receipt format
        await printTicket(receiptData);
        toast.success("Receipt printed successfully!");
      } catch (error) {
        console.error('Receipt print error:', error);
        toast.error("Failed to print receipt");
      }
    } else {
      // For web version, show print dialog
      window.print();
    }
  };

  const canCheckout = ticket && 
    (ticket.status === "completed" || ticket.status === "picked_up") && 
    (ticket.finalCost || ticket.estimatedCost);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-cyan-400 hover:text-cyan-300 font-mono"
            >
              ← BACK
            </button>
            <h1 className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider">
              Ticket {ticket.ticketNumber}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                statusColors[ticket.status as keyof typeof statusColors]
              }`}
            >
              {ticket.status.replace("_", " ")}
            </span>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                priorityColors[ticket.priority as keyof typeof priorityColors]
              }`}
            >
              {ticket.priority}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {canCheckout && (
              <button
                onClick={handleCheckout}
                className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded font-mono hover:bg-green-600/30 hover:border-green-400 transition-all duration-300"
                title="Process Payment & Checkout"
              >
                💳 CHECKOUT
              </button>
            )}
            {isElectron && (
              <>
                <button
                  onClick={handlePrintTicket}
                  className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded font-mono hover:bg-cyan-600/30 hover:border-cyan-400 transition-all duration-300"
                  title="Print Ticket"
                >
                  🖨️ PRINT
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded font-mono hover:bg-green-600/30 hover:border-green-400 transition-all duration-300"
                  title="Export to PDF"
                >
                  📄 PDF
                </button>
              </>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded font-mono hover:bg-red-600/30 hover:border-red-400 transition-all duration-300"
            >
              🗑️ DELETE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Device Info */}
            <div className="tron-card p-6">
              <h2 className="text-lg font-semibold mb-4 text-cyan-300">Customer & Device Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-400">Customer</label>
                  <p className="mt-1 text-sm text-cyan-100">{ticket.customer?.name}</p>
                  <p className="text-sm text-cyan-500">{ticket.customer?.phone}</p>
                  {ticket.customer?.email && (
                    <p className="text-sm text-cyan-500">{ticket.customer.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400">Device</label>
                  <p className="mt-1 text-sm text-cyan-100">
                    {ticket.deviceMake} {ticket.deviceModel}
                  </p>
                  {ticket.serialNumber && (
                    <p className="text-sm text-cyan-500">S/N: {ticket.serialNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Issue Description */}
            <div className="tron-card p-6">
              <h2 className="text-lg font-semibold mb-4 text-cyan-300">Issue Description</h2>
              <p className="text-cyan-100">{ticket.issueDescription}</p>
            </div>

            {/* Diagnostic Notes & Repair Actions */}
            <div className="tron-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-cyan-300">Diagnostic Notes & Repair Actions</h2>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    if (!isEditing) {
                      setEditData({
                        diagnosticNotes: ticket.diagnosticNotes || "",
                        repairActions: ticket.repairActions || "",
                        finalCost: ticket.finalCost?.toString() || "",
                      });
                    }
                  }}
                  className="tron-button text-sm"
                >
                  {isEditing ? "CANCEL" : "EDIT"}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleDetailsUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Diagnostic Notes
                    </label>
                    <textarea
                      value={editData.diagnosticNotes}
                      onChange={(e) => setEditData({ ...editData, diagnosticNotes: e.target.value })}
                      rows={4}
                      className="tron-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Repair Actions
                    </label>
                    <textarea
                      value={editData.repairActions}
                      onChange={(e) => setEditData({ ...editData, repairActions: e.target.value })}
                      rows={4}
                      className="tron-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Final Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editData.finalCost}
                      onChange={(e) => setEditData({ ...editData, finalCost: e.target.value })}
                      className="tron-input"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="tron-button-green"
                    >
                      SAVE CHANGES
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400">Diagnostic Notes</label>
                    <p className="mt-1 text-cyan-100">{ticket.diagnosticNotes || "No notes yet"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400">Repair Actions</label>
                    <p className="mt-1 text-cyan-100">{ticket.repairActions || "No actions recorded"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Parts */}
            <div className="tron-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-cyan-300">Parts Used</h2>
                <button
                  onClick={() => setShowAddPart(true)}
                  className="tron-button-green text-sm"
                >
                  + ADD PART
                </button>
              </div>

              {showAddPart && (
                <form onSubmit={handleAddPart} className="mb-4 p-4 border border-cyan-500/30 rounded-md bg-grid-dark-200">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                        PART.NAME *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter part name"
                        value={newPart.partName}
                        onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                        className="tron-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                        PART.NUMBER
                      </label>
                      <input
                        type="text"
                        placeholder="Enter part number"
                        value={newPart.partNumber}
                        onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                        className="tron-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                        QUANTITY *
                      </label>
                      <input
                        type="number"
                        placeholder="1"
                        value={newPart.quantity}
                        onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                        className="tron-input"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                        UNIT.COST *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newPart.unitCost}
                        onChange={(e) => setNewPart({ ...newPart, unitCost: parseFloat(e.target.value) || 0 })}
                        className="tron-input"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-cyan-300 mb-2 font-mono">
                        SUPPLIER
                      </label>
                      <input
                        type="text"
                        placeholder="Enter supplier name"
                        value={newPart.supplier}
                        onChange={(e) => setNewPart({ ...newPart, supplier: e.target.value })}
                        className="tron-input"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="tron-button-green"
                    >
                      Add Part
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPart(false)}
                      className="tron-button"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}

              {ticket.parts && ticket.parts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="tron-table">
                    <thead>
                      <tr>
                        <th>PART</th>
                        <th>QTY</th>
                        <th>UNIT COST</th>
                        <th>TOTAL</th>
                        <th>SUPPLIER</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticket.parts.map((part) => (
                        <tr key={part._id}>
                          <td>
                            <div className="text-sm font-medium text-cyan-300">{part.partName}</div>
                            {part.partNumber && (
                              <div className="text-sm text-cyan-500">{part.partNumber}</div>
                            )}
                          </td>
                          <td className="text-cyan-100">{part.quantity}</td>
                          <td className="text-cyan-100">${part.unitCost}</td>
                          <td className="text-cyan-100">${part.totalCost}</td>
                          <td className="text-cyan-500">{part.supplier || "-"}</td>
                          <td>
                            <button
                              onClick={() => handleRemovePart(part._id)}
                              className="text-red-400 hover:text-red-300 text-sm font-mono"
                            >
                              REMOVE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-right">
                    <p className="text-lg font-semibold text-cyan-300 font-mono">Total Parts Cost: ${totalPartsCost}</p>
                  </div>
                </div>
              ) : (
                <p className="text-cyan-500">No parts added yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300">Update Status</h3>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <select
                  value={statusUpdate.newStatus}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, newStatus: e.target.value })}
                  className="tron-input tron-select"
                  required
                >
                  <option value="">Select new status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Notes (optional)"
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows={3}
                  className="tron-input"
                />
                <button
                  type="submit"
                  className="w-full tron-button-green"
                >
                  UPDATE STATUS
                </button>
              </form>
            </div>

            {/* Technician Assignment */}
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300">Assigned Technician</h3>
              <p className="mb-4 text-cyan-100">
                {ticket.technician?.name || "Not assigned"}
              </p>
              {technicians && (
                <select
                  onChange={(e) => e.target.value && handleTechnicianAssign(e.target.value as Id<"technicians">)}
                  className="tron-input tron-select"
                  defaultValue=""
                >
                  <option value="">Assign technician</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cost Summary */}
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300">Cost Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-cyan-100">
                  <span>Estimated Cost:</span>
                  <span>${ticket.estimatedCost || 0}</span>
                </div>
                <div className="flex justify-between text-cyan-100">
                  <span>Parts Cost:</span>
                  <span>${totalPartsCost}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-cyan-800 pt-2 text-cyan-300">
                  <span>Final Cost:</span>
                  <span>${ticket.finalCost || "TBD"}</span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300">Important Dates</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-cyan-300">Received:</span>
                  <br />
                  <span className="text-cyan-100">{new Date(ticket.dateReceived).toLocaleString()}</span>
                </div>
                {ticket.dateCompleted && (
                  <div>
                    <span className="font-medium text-cyan-300">Completed:</span>
                    <br />
                    <span className="text-cyan-100">{new Date(ticket.dateCompleted).toLocaleString()}</span>
                  </div>
                )}
                {ticket.datePickedUp && (
                  <div>
                    <span className="font-medium text-cyan-300">Picked Up:</span>
                    <br />
                    <span className="text-cyan-100">{new Date(ticket.datePickedUp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status History */}
            <div className="tron-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300">Status History</h3>
              {ticketHistory && ticketHistory.length > 0 ? (
                <div className="space-y-3">
                  {ticketHistory.map((entry) => (
                    <div key={entry._id} className="border-l-2 border-cyan-600 pl-4">
                      <div className="text-sm font-medium text-cyan-300">
                        {entry.previousStatus && `${entry.previousStatus} → `}
                        {entry.newStatus}
                      </div>
                      <div className="text-xs text-cyan-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      {entry.notes && (
                        <div className="text-sm text-cyan-100 mt-1">{entry.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-cyan-500 text-sm">No history available</p>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="tron-card p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-red-400 mb-4 font-mono">CONFIRM DELETION</h3>
              <p className="text-cyan-100 mb-6">
                Are you sure you want to delete ticket <span className="text-cyan-400 font-mono">{ticket.ticketNumber}</span>?
              </p>
              <p className="text-red-300 text-sm mb-6 font-mono">
                WARNING: This action cannot be undone. All ticket data, parts, and history will be permanently removed.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteTicket}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-mono hover:bg-red-700 transition-colors"
                >
                  DELETE
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 tron-button"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="tron-card p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 font-mono uppercase">
                Process Payment
              </h3>
              
              <div className="space-y-4">
                {/* Labor Cost Adjustment */}
                <div>
                  <label className="block text-cyan-300 font-semibold mb-2 font-mono">LABOR.COST</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.laborCost}
                    onChange={(e) => {
                      const newLaborCost = parseFloat(e.target.value) || 0;
                      const subtotal = newLaborCost + totalPartsCost;
                      const taxAmount = subtotal * paymentData.taxRate;
                      const grandTotal = subtotal + taxAmount;
                      setPaymentData(prev => ({
                        ...prev,
                        laborCost: newLaborCost,
                        totalAmount: grandTotal,
                        customerPaid: grandTotal
                      }));
                    }}
                    className="tron-input w-full"
                    placeholder="0.00"
                  />
                  <p className="text-cyan-500 text-xs mt-1 font-mono">
                    Original: ${(ticket.finalCost || ticket.estimatedCost || 0).toFixed(2)}
                  </p>
                </div>

                {/* Cost Breakdown */}
                <div className="border border-cyan-400/30 rounded p-4">
                  <h4 className="text-cyan-300 font-semibold mb-2 font-mono">COST.BREAKDOWN</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-100">Labor Cost:</span>
                      <span className="text-cyan-400 font-mono">
                        ${paymentData.laborCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-100">Parts Cost:</span>
                      <span className="text-cyan-400 font-mono">
                        ${totalPartsCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-cyan-400/30 pt-2">
                      <div className="flex justify-between">
                        <span className="text-cyan-100">Subtotal:</span>
                        <span className="text-cyan-400 font-mono">
                          ${(paymentData.laborCost + totalPartsCost).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-100">Tax ({(paymentData.taxRate * 100).toFixed(1)}%):</span>
                        <span className="text-cyan-400 font-mono">
                          ${((paymentData.laborCost + totalPartsCost) * paymentData.taxRate).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t border-cyan-400/30 pt-2">
                        <span className="text-cyan-300">Total:</span>
                        <span className="text-green-400 font-mono">
                          ${paymentData.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-cyan-300 font-semibold mb-2 font-mono">PAYMENT.METHOD</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="tron-input tron-select w-full"
                  >
                    <option value="square">Square (Card Payment)</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-cyan-300 font-semibold mb-2 font-mono">AMOUNT.PAID</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.customerPaid}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, customerPaid: parseFloat(e.target.value) || 0 }))}
                    className="tron-input w-full"
                    placeholder="0.00"
                  />
                </div>

                {/* Change Due */}
                {paymentData.customerPaid > paymentData.totalAmount && (
                  <div className="border border-orange-400/30 rounded p-3 bg-orange-400/10">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-300 font-semibold font-mono">CHANGE.DUE:</span>
                      <span className="text-orange-400 font-mono text-lg font-bold">
                        ${(paymentData.customerPaid - paymentData.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Notes */}
                <div>
                  <label className="block text-cyan-300 font-semibold mb-2 font-mono">NOTES (OPTIONAL)</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="tron-input w-full h-20 resize-none"
                    placeholder="Payment notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-300 border border-gray-500/30 rounded font-mono hover:bg-gray-600/30 transition-all duration-300"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={paymentData.customerPaid < paymentData.totalAmount}
                    className="flex-1 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded font-mono hover:bg-green-600/30 hover:border-green-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentData.paymentMethod === 'square' ? 'PROCESS WITH SQUARE' : 'COMPLETE PAYMENT'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
