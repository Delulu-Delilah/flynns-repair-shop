const { net } = require('electron');
const localDb = require('./database');

class SyncManager {
  constructor() {
    this.isOnline = false;
    this.syncInterval = null;
    this.convexUrl = null;
    this.authToken = null;
    this.syncInProgress = false;
  }

  initialize(convexUrl) {
    this.convexUrl = convexUrl;
    this.checkConnectionStatus();
    
    // Set up periodic sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performSync();
      }
    }, 30000);

    // Listen for network changes
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    // Check connection status periodically
    setInterval(() => {
      this.checkConnectionStatus();
    }, 5000);
  }

  async checkConnectionStatus() {
    try {
      // Check if we have a Convex URL
      if (!this.convexUrl) {
        console.log('No Convex URL configured, staying offline');
        this.isOnline = false;
        localDb.setOnlineStatus(false);
        return;
      }

      // Try to reach a reliable endpoint (Google DNS or Cloudflare)
      const request = net.request({
        method: 'GET',
        url: 'https://1.1.1.1/',
        timeout: 5000
      });

      const wasOnline = this.isOnline;
      
      request.on('response', (response) => {
        // If we can reach the internet, assume Convex is also reachable
        this.isOnline = true;
        localDb.setOnlineStatus(this.isOnline);
        
        if (!wasOnline && this.isOnline) {
          console.log('Connection restored - triggering sync');
          this.performSync();
        }
      });

      request.on('error', (error) => {
        console.log('Connection check failed:', error.message);
        this.isOnline = false;
        localDb.setOnlineStatus(false);
      });

      request.on('timeout', () => {
        console.log('Connection check timed out');
        this.isOnline = false;
        localDb.setOnlineStatus(false);
      });

      request.end();
    } catch (error) {
      console.log('Connection check error:', error.message);
      this.isOnline = false;
      localDb.setOnlineStatus(false);
    }
  }

  async performSync() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    console.log('Starting sync process...');

    try {
      // Sync in order: customers -> technicians -> tickets -> parts
      await this.syncTable('customers');
      await this.syncTable('technicians');
      await this.syncTable('tickets');
      await this.syncTable('parts');
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncTable(tableName) {
    try {
      // Get unsynced local records
      const unsyncedRecords = localDb.getUnsyncedRecords(tableName);
      
      // Push local changes to server
      for (const record of unsyncedRecords) {
        await this.pushRecord(tableName, record);
      }

      // Pull latest data from server
      await this.pullTableData(tableName);
      
    } catch (error) {
      console.error(`Error syncing ${tableName}:`, error);
      localDb.logSync(tableName, null, 'SYNC_ERROR', error.message);
    }
  }

  async pushRecord(tableName, record) {
    try {
      // Convert local record format to Convex format
      const convexRecord = this.convertToConvexFormat(tableName, record);
      
      // Determine if this is an insert, update, or delete
      const action = this.determineAction(record);
      
      let response;
      switch (action) {
        case 'INSERT':
          response = await this.callConvexMutation(`${tableName}:create`, convexRecord);
          break;
        case 'UPDATE':
          response = await this.callConvexMutation(`${tableName}:update`, {
            id: record.id,
            ...convexRecord
          });
          break;
        case 'DELETE':
          response = await this.callConvexMutation(`${tableName}:delete`, {
            id: record.id
          });
          break;
      }

      if (response && response.success) {
        localDb.markSynced(tableName, record.id);
        localDb.logSync(tableName, record.id, action);
      }
      
    } catch (error) {
      console.error(`Error pushing ${tableName} record:`, error);
      localDb.logSync(tableName, record.id, 'PUSH_ERROR', error.message);
    }
  }

  async pullTableData(tableName) {
    try {
      // Get latest data from Convex
      const remoteData = await this.callConvexQuery(`${tableName}:list`);
      
      if (remoteData && remoteData.length > 0) {
        // Update local database with remote data
        for (const remoteRecord of remoteData) {
          const localRecord = this.convertFromConvexFormat(tableName, remoteRecord);
          
          // Check if record exists locally
          const existing = localDb.findById(tableName, localRecord.id);
          
          if (existing) {
            // Update if remote is newer
            if (remoteRecord._lastModified > existing.last_modified) {
              localDb.update(tableName, localRecord.id, localRecord);
              localDb.markSynced(tableName, localRecord.id);
            }
          } else {
            // Insert new record
            localRecord.synced = 1; // Mark as synced since it came from server
            localDb.insert(tableName, localRecord);
          }
        }
      }
      
    } catch (error) {
      console.error(`Error pulling ${tableName} data:`, error);
      localDb.logSync(tableName, null, 'PULL_ERROR', error.message);
    }
  }

  convertToConvexFormat(tableName, record) {
    // Convert SQLite format to Convex format
    const converted = { ...record };
    
    // Remove sync-specific fields
    delete converted.synced;
    delete converted.last_modified;
    
    // Convert field names and types as needed
    switch (tableName) {
      case 'customers':
        // No special conversion needed
        break;
      case 'technicians':
        converted.isActive = Boolean(converted.is_active);
        delete converted.is_active;
        break;
      case 'tickets':
        converted.customerId = converted.customer_id;
        converted.technicianId = converted.technician_id;
        converted.ticketNumber = converted.ticket_number;
        converted.deviceMake = converted.device_make;
        converted.deviceModel = converted.device_model;
        converted.serialNumber = converted.serial_number;
        converted.issueDescription = converted.issue_description;
        converted.diagnosticNotes = converted.diagnostic_notes;
        converted.repairActions = converted.repair_actions;
        converted.estimatedCost = converted.estimated_cost;
        converted.finalCost = converted.final_cost;
        converted.dateReceived = converted.date_received;
        converted.dateCompleted = converted.date_completed;
        converted.datePickedUp = converted.date_picked_up;
        
        // Remove old field names
        delete converted.customer_id;
        delete converted.technician_id;
        delete converted.ticket_number;
        delete converted.device_make;
        delete converted.device_model;
        delete converted.serial_number;
        delete converted.issue_description;
        delete converted.diagnostic_notes;
        delete converted.repair_actions;
        delete converted.estimated_cost;
        delete converted.final_cost;
        delete converted.date_received;
        delete converted.date_completed;
        delete converted.date_picked_up;
        break;
      case 'parts':
        converted.ticketId = converted.ticket_id;
        converted.partNumber = converted.part_number;
        delete converted.ticket_id;
        delete converted.part_number;
        break;
    }
    
    return converted;
  }

  convertFromConvexFormat(tableName, record) {
    // Convert Convex format to SQLite format
    const converted = { ...record };
    converted.id = record._id;
    
    // Remove Convex-specific fields
    delete converted._id;
    delete converted._creationTime;
    
    // Convert field names and types as needed
    switch (tableName) {
      case 'technicians':
        converted.is_active = record.isActive ? 1 : 0;
        delete converted.isActive;
        break;
      case 'tickets':
        converted.customer_id = record.customerId;
        converted.technician_id = record.technicianId;
        converted.ticket_number = record.ticketNumber;
        converted.device_make = record.deviceMake;
        converted.device_model = record.deviceModel;
        converted.serial_number = record.serialNumber;
        converted.issue_description = record.issueDescription;
        converted.diagnostic_notes = record.diagnosticNotes;
        converted.repair_actions = record.repairActions;
        converted.estimated_cost = record.estimatedCost;
        converted.final_cost = record.finalCost;
        converted.date_received = record.dateReceived;
        converted.date_completed = record.dateCompleted;
        converted.date_picked_up = record.datePickedUp;
        
        // Remove Convex field names
        delete converted.customerId;
        delete converted.technicianId;
        delete converted.ticketNumber;
        delete converted.deviceMake;
        delete converted.deviceModel;
        delete converted.serialNumber;
        delete converted.issueDescription;
        delete converted.diagnosticNotes;
        delete converted.repairActions;
        delete converted.estimatedCost;
        delete converted.finalCost;
        delete converted.dateReceived;
        delete converted.dateCompleted;
        delete converted.datePickedUp;
        break;
      case 'parts':
        converted.ticket_id = record.ticketId;
        converted.part_number = record.partNumber;
        delete converted.ticketId;
        delete converted.partNumber;
        break;
    }
    
    converted.last_modified = Date.now();
    return converted;
  }

  determineAction(record) {
    // This would need to be enhanced based on your sync strategy
    // For now, assume INSERT for new records
    return 'INSERT';
  }

  async callConvexQuery(functionName, args = {}) {
    // This would make HTTP requests to your Convex deployment
    // For now, return mock data
    console.log(`Would call Convex query: ${functionName}`, args);
    return [];
  }

  async callConvexMutation(functionName, args = {}) {
    // This would make HTTP requests to your Convex deployment
    // For now, return mock success
    console.log(`Would call Convex mutation: ${functionName}`, args);
    return { success: true };
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      syncInProgress: this.syncInProgress
    };
  }

  forcSync() {
    if (!this.syncInProgress) {
      this.performSync();
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

module.exports = new SyncManager(); 