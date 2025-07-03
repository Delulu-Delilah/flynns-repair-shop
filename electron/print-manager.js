const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

class PrintManager {
  constructor() {
    this.printWindow = null;
  }

  async printTicket(ticketData) {
    try {
      const html = this.generateTicketHTML(ticketData);
      await this.print(html, 'Ticket');
    } catch (error) {
      console.error('Error printing ticket:', error);
      throw error;
    }
  }

  async printReport(reportData, reportType) {
    try {
      let html;
      switch (reportType) {
        case 'daily':
          html = this.generateDailyReportHTML(reportData);
          break;
        case 'technician':
          html = this.generateTechnicianReportHTML(reportData);
          break;
        case 'customer':
          html = this.generateCustomerReportHTML(reportData);
          break;
        default:
          throw new Error('Unknown report type');
      }
      await this.print(html, `${reportType} Report`);
    } catch (error) {
      console.error('Error printing report:', error);
      throw error;
    }
  }

  generateTicketHTML(ticket) {
    // Check if this is a receipt (has payment data)
    if (ticket.payment) {
      return this.generateReceiptHTML(ticket);
    }

    // Regular ticket format
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Repair Ticket - ${ticket.ticketNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background: #000;
          color: #00d4ff;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #00d4ff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #00d4ff;
          text-shadow: 0 0 10px #00d4ff;
          margin-bottom: 10px;
        }
        .ticket-number {
          font-size: 18px;
          color: #ff6600;
          margin-bottom: 10px;
        }
        .section {
          margin-bottom: 25px;
          border: 1px solid #00d4ff;
          padding: 15px;
          background: rgba(0, 212, 255, 0.05);
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #ff6600;
          margin-bottom: 10px;
          text-transform: uppercase;
          border-bottom: 1px solid #ff6600;
          padding-bottom: 5px;
        }
        .field {
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
          color: #00d4ff;
          display: inline-block;
          width: 150px;
        }
        .value {
          color: #ffffff;
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border: 1px solid;
          text-transform: uppercase;
          font-size: 12px;
        }
        .status-received { border-color: #00d4ff; color: #00d4ff; }
        .status-diagnosed { border-color: #ffff00; color: #ffff00; }
        .status-in_progress { border-color: #ff6600; color: #ff6600; }
        .status-awaiting_parts { border-color: #8000ff; color: #8000ff; }
        .status-completed { border-color: #00ff41; color: #00ff41; }
        .priority-urgent { color: #ff0000; font-weight: bold; }
        .priority-high { color: #ff6600; }
        .priority-medium { color: #ffff00; }
        .priority-low { color: #00ff41; }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #333;
          padding-top: 20px;
        }
        .qr-placeholder {
          width: 100px;
          height: 100px;
          border: 2px dashed #00d4ff;
          display: inline-block;
          text-align: center;
          line-height: 100px;
          font-size: 12px;
        }
        @media print {
          body { background: white; color: black; }
          .section { border-color: #333; background: #f9f9f9; }
          .section-title { color: #333; border-color: #333; }
          .label { color: #333; }
          .logo { color: #333; text-shadow: none; }
          .ticket-number { color: #666; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">FLYNNS</div>
        <div class="ticket-number">TICKET: ${ticket.ticketNumber}</div>
        <div>Repair Service Management System</div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="field">
          <span class="label">Name:</span>
          <span class="value">${ticket.customer?.name || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Phone:</span>
          <span class="value">${ticket.customer?.phone || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Email:</span>
          <span class="value">${ticket.customer?.email || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Address:</span>
          <span class="value">${ticket.customer?.address || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Device Information</div>
        <div class="field">
          <span class="label">Make:</span>
          <span class="value">${ticket.deviceMake}</span>
        </div>
        <div class="field">
          <span class="label">Model:</span>
          <span class="value">${ticket.deviceModel}</span>
        </div>
        <div class="field">
          <span class="label">Serial Number:</span>
          <span class="value">${ticket.serialNumber || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Repair Details</div>
        <div class="field">
          <span class="label">Issue:</span>
          <span class="value">${ticket.issueDescription}</span>
        </div>
        <div class="field">
          <span class="label">Status:</span>
          <span class="status status-${ticket.status}">${ticket.status.replace('_', ' ')}</span>
        </div>
        <div class="field">
          <span class="label">Priority:</span>
          <span class="value priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
        </div>
        <div class="field">
          <span class="label">Technician:</span>
          <span class="value">${ticket.technician?.name || 'Unassigned'}</span>
        </div>
        <div class="field">
          <span class="label">Date Received:</span>
          <span class="value">${new Date(ticket.dateReceived).toLocaleDateString()}</span>
        </div>
        ${ticket.dateCompleted ? `
        <div class="field">
          <span class="label">Date Completed:</span>
          <span class="value">${new Date(ticket.dateCompleted).toLocaleDateString()}</span>
        </div>
        ` : ''}
      </div>

      ${ticket.diagnosticNotes ? `
      <div class="section">
        <div class="section-title">Diagnostic Notes</div>
        <div class="value">${ticket.diagnosticNotes}</div>
      </div>
      ` : ''}

      ${ticket.repairActions ? `
      <div class="section">
        <div class="section-title">Repair Actions</div>
        <div class="value">${ticket.repairActions}</div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Cost Information</div>
        <div class="field">
          <span class="label">Estimated Cost:</span>
          <span class="value">$${ticket.estimatedCost?.toFixed(2) || '0.00'}</span>
        </div>
        ${ticket.finalCost ? `
        <div class="field">
          <span class="label">Final Cost:</span>
          <span class="value">$${ticket.finalCost.toFixed(2)}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Tracking</div>
        <div style="text-align: center;">
          <div class="qr-placeholder">QR CODE</div>
          <div style="margin-top: 10px; font-size: 12px;">
            Scan to track ticket status
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>FLYNNS Repair Shop - Professional Service</div>
      </div>
    </body>
    </html>
    `;
  }

  generateReceiptHTML(ticket) {
    const payment = ticket.payment;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${payment.receiptNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background: #000;
          color: #00d4ff;
          line-height: 1.4;
          max-width: 400px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #00d4ff;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .logo {
          font-size: 20px;
          font-weight: bold;
          color: #00d4ff;
          text-shadow: 0 0 10px #00d4ff;
          margin-bottom: 5px;
        }
        .receipt-title {
          font-size: 16px;
          color: #00ff41;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .receipt-number {
          font-size: 12px;
          color: #ff6600;
          margin-bottom: 5px;
        }
        .section {
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #00d4ff;
          background: rgba(0, 212, 255, 0.05);
        }
        .section-title {
          font-size: 12px;
          font-weight: bold;
          color: #ff6600;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-bottom: 1px solid #ff6600;
          padding-bottom: 3px;
        }
        .field {
          margin-bottom: 5px;
          font-size: 11px;
        }
        .label {
          font-weight: bold;
          color: #00d4ff;
          display: inline-block;
          width: 120px;
        }
        .value {
          color: #ffffff;
        }
        .line-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 11px;
        }
        .line-item-desc {
          color: #ffffff;
          flex: 1;
        }
        .line-item-amount {
          color: #00d4ff;
          font-weight: bold;
          text-align: right;
          min-width: 60px;
        }
        .total-section {
          border-top: 2px solid #00d4ff;
          padding-top: 10px;
          margin-top: 15px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .total-line.grand-total {
          font-size: 14px;
          font-weight: bold;
          color: #00ff41;
          border-top: 1px solid #00ff41;
          padding-top: 5px;
          margin-top: 8px;
        }
        .payment-method {
          text-align: center;
          font-size: 12px;
          color: #ffff00;
          margin: 15px 0;
          padding: 8px;
          border: 1px solid #ffff00;
          background: rgba(255, 255, 0, 0.1);
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #333;
          padding-top: 15px;
        }
        .thank-you {
          text-align: center;
          font-size: 14px;
          color: #00ff41;
          margin: 15px 0;
          font-weight: bold;
        }
        @media print {
          body { 
            background: white; 
            color: black; 
            max-width: none;
            width: 80mm; /* Receipt printer width */
          }
          .section { border-color: #333; background: #f9f9f9; }
          .section-title { color: #333; border-color: #333; }
          .label { color: #333; }
          .logo { color: #333; text-shadow: none; }
          .receipt-title { color: #333; }
          .receipt-number { color: #666; }
          .line-item-amount { color: #333; }
          .total-line.grand-total { color: #333; border-color: #333; }
          .payment-method { color: #333; border-color: #333; background: #f0f0f0; }
          .thank-you { color: #333; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">FLYNNS</div>
        <div class="receipt-title">RECEIPT</div>
        <div class="receipt-number">Receipt #: ${payment.receiptNumber}</div>
        <div class="receipt-number">Ticket #: ${ticket.ticketNumber}</div>
        <div>Date: ${new Date(payment.paymentDate).toLocaleDateString()}</div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="field">
          <span class="label">Name:</span>
          <span class="value">${ticket.customer?.name || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Phone:</span>
          <span class="value">${ticket.customer?.phone || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Service Details</div>
        <div class="field">
          <span class="label">Ticket #:</span>
          <span class="value">${ticket.ticketNumber}</span>
        </div>
        <div class="field">
          <span class="label">Device:</span>
          <span class="value">${ticket.deviceMake} ${ticket.deviceModel}</span>
        </div>
        <div class="field">
          <span class="label">Issue:</span>
          <span class="value">${ticket.issueDescription}</span>
        </div>
        ${ticket.serialNumber ? `
        <div class="field">
          <span class="label">Serial #:</span>
          <span class="value">${ticket.serialNumber}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Charges</div>
        
        <!-- Labor Charge -->
        <div class="line-item">
          <span class="line-item-desc">Labor & Service</span>
          <span class="line-item-amount">$${(ticket.finalCost || ticket.estimatedCost || 0).toFixed(2)}</span>
        </div>

        <!-- Parts Charges -->
        ${ticket.parts && ticket.parts.length > 0 ? ticket.parts.map(part => `
          <div class="line-item">
            <span class="line-item-desc">${part.name} (${part.quantity}x)</span>
            <span class="line-item-amount">$${part.totalCost.toFixed(2)}</span>
          </div>
        `).join('') : ''}

        <div class="total-section">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>$${payment.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>Tax (${(payment.taxRate * 100).toFixed(1)}%):</span>
            <span>$${payment.taxAmount.toFixed(2)}</span>
          </div>
          <div class="total-line grand-total">
            <span>TOTAL:</span>
            <span>$${payment.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="payment-method">
        <div style="font-weight: bold;">PAYMENT METHOD</div>
        <div style="margin-top: 5px;">
          ${payment.paymentMethod.toUpperCase().replace('_', ' ')}
        </div>
        <div style="margin-top: 5px; font-size: 11px;">
          Amount Paid: $${payment.paidAmount.toFixed(2)}
        </div>
        ${payment.change > 0 ? `
        <div style="margin-top: 3px; font-size: 11px; color: #ff6600;">
          Change: $${payment.change.toFixed(2)}
        </div>
        ` : ''}
      </div>

      <div class="thank-you">
        THANK YOU FOR YOUR BUSINESS!
      </div>

      <div style="text-align: center; margin: 15px 0; font-size: 11px;">
        <div>Warranty: 30 days on labor</div>
        <div>Parts warranty as per manufacturer</div>
      </div>

      <div class="footer">
        <div>FLYNNS</div>
        <div>Flynns Repair Shop</div>
        <div style="margin-top: 10px;">
          For support: info@repairgrid.com
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateDailyReportHTML(reportData) {
    const { tickets, date, summary } = reportData;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Daily Report - ${date}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background: #000;
          color: #00d4ff;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #00d4ff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #00d4ff;
          text-shadow: 0 0 10px #00d4ff;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          border: 1px solid #00d4ff;
          padding: 15px;
          text-align: center;
          background: rgba(0, 212, 255, 0.05);
        }
        .summary-number {
          font-size: 24px;
          font-weight: bold;
          color: #ff6600;
        }
        .summary-label {
          font-size: 12px;
          text-transform: uppercase;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #00d4ff;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background: rgba(0, 212, 255, 0.2);
          font-weight: bold;
          text-transform: uppercase;
        }
        @media print {
          body { background: white; color: black; }
          .summary-card { border-color: #333; background: #f9f9f9; }
          .logo { color: #333; text-shadow: none; }
          th, td { border-color: #333; }
          th { background: #f0f0f0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">FLYNNS</div>
        <h2>Daily Report - ${date}</h2>
      </div>

      <div class="summary">
        <div class="summary-card">
          <div class="summary-number">${summary.totalTickets}</div>
          <div class="summary-label">Total Tickets</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${summary.completedTickets}</div>
          <div class="summary-label">Completed</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">${summary.newTickets}</div>
          <div class="summary-label">New Tickets</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">$${summary.totalRevenue.toFixed(2)}</div>
          <div class="summary-label">Revenue</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ticket #</th>
            <th>Customer</th>
            <th>Device</th>
            <th>Status</th>
            <th>Technician</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${tickets.map(ticket => `
            <tr>
              <td>${ticket.ticketNumber}</td>
              <td>${ticket.customer?.name || 'N/A'}</td>
              <td>${ticket.deviceMake} ${ticket.deviceModel}</td>
              <td>${ticket.status.replace('_', ' ')}</td>
              <td>${ticket.technician?.name || 'Unassigned'}</td>
              <td>$${ticket.finalCost?.toFixed(2) || ticket.estimatedCost?.toFixed(2) || '0.00'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
    `;
  }

  generateTechnicianReportHTML(reportData) {
    // Similar structure for technician reports
    return `<html><body><h1>Technician Report</h1><p>Report data would go here...</p></body></html>`;
  }

  generateCustomerReportHTML(reportData) {
    // Similar structure for customer reports
    return `<html><body><h1>Customer Report</h1><p>Report data would go here...</p></body></html>`;
  }

  async print(html, title) {
    return new Promise((resolve, reject) => {
      // Create a hidden window for printing
      this.printWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Load the HTML content
      this.printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      // Wait for content to load
      this.printWindow.webContents.once('did-finish-load', () => {
        // Print the content
        this.printWindow.webContents.print({
          silent: false,
          printBackground: true,
          color: false,
          margins: {
            marginType: 'minimum'
          },
          landscape: false,
          scaleFactor: 100,
          pagesPerSheet: 1,
          collate: false,
          copies: 1
        }, (success, failureReason) => {
          // Close the print window
          if (this.printWindow) {
            this.printWindow.close();
            this.printWindow = null;
          }

          if (success) {
            resolve();
          } else {
            reject(new Error(failureReason || 'Print failed'));
          }
        });
      });

      this.printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        if (this.printWindow) {
          this.printWindow.close();
          this.printWindow = null;
        }
        reject(new Error(`Failed to load print content: ${errorDescription}`));
      });
    });
  }

  async printToPDF(html, outputPath) {
    return new Promise((resolve, reject) => {
      this.printWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      this.printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      this.printWindow.webContents.once('did-finish-load', () => {
        this.printWindow.webContents.printToPDF({
          pageSize: 'A4',
          margins: {
            top: 0.5,
            bottom: 0.5,
            left: 0.5,
            right: 0.5
          },
          printBackground: true,
          landscape: false
        }).then((data) => {
          fs.writeFileSync(outputPath, data);
          if (this.printWindow) {
            this.printWindow.close();
            this.printWindow = null;
          }
          resolve(outputPath);
        }).catch((error) => {
          if (this.printWindow) {
            this.printWindow.close();
            this.printWindow = null;
          }
          reject(error);
        });
      });
    });
  }
}

module.exports = new PrintManager(); 