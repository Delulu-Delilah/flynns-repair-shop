const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class LocalDatabase {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  initialize() {
    try {
      // Create database in user data directory
      const dbPath = path.join(app.getPath('userData'), 'repair-grid.db');
      this.db = new Database(dbPath);
      
      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      
      this.createTables();
      this.isInitialized = true;
      
      console.log('Local database initialized at:', dbPath);
    } catch (error) {
      console.error('Failed to initialize local database:', error);
    }
  }

  createTables() {
    // Customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        address TEXT,
        synced INTEGER DEFAULT 0,
        last_modified INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    // Technicians table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS technicians (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        specialization TEXT,
        is_active INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0,
        last_modified INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    // Tickets table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        ticket_number TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        technician_id TEXT,
        device_make TEXT NOT NULL,
        device_model TEXT NOT NULL,
        serial_number TEXT,
        issue_description TEXT NOT NULL,
        diagnostic_notes TEXT,
        repair_actions TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        estimated_cost REAL,
        final_cost REAL,
        date_received INTEGER NOT NULL,
        date_completed INTEGER,
        date_picked_up INTEGER,
        synced INTEGER DEFAULT 0,
        last_modified INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (technician_id) REFERENCES technicians (id)
      )
    `);

    // Parts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        name TEXT NOT NULL,
        part_number TEXT,
        cost REAL NOT NULL,
        quantity INTEGER DEFAULT 1,
        supplier TEXT,
        synced INTEGER DEFAULT 0,
        last_modified INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (ticket_id) REFERENCES tickets (id)
      )
    `);

    // Sync log table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        error TEXT
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(technician_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_parts_ticket ON parts(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_sync_unsynced ON customers(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_unsynced_tickets ON tickets(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_unsynced_technicians ON technicians(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_unsynced_parts ON parts(synced);
    `);
  }

  // Generic CRUD operations
  insert(table, data) {
    if (!this.isInitialized) return null;
    
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const stmt = this.db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
      const result = stmt.run(...values);
      
      // Log for sync
      this.logSync(table, data.id, 'INSERT');
      
      return result;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      return null;
    }
  }

  update(table, id, data) {
    if (!this.isInitialized) return null;
    
    try {
      const columns = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const stmt = this.db.prepare(`UPDATE ${table} SET ${columns}, last_modified = ?, synced = 0 WHERE id = ?`);
      const result = stmt.run(...values, Date.now());
      
      // Log for sync
      this.logSync(table, id, 'UPDATE');
      
      return result;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }
  }

  delete(table, id) {
    if (!this.isInitialized) return null;
    
    try {
      const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
      const result = stmt.run(id);
      
      // Log for sync
      this.logSync(table, id, 'DELETE');
      
      return result;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return null;
    }
  }

  findAll(table, where = '', params = []) {
    if (!this.isInitialized) return [];
    
    try {
      const query = `SELECT * FROM ${table}${where ? ' WHERE ' + where : ''}`;
      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      return [];
    }
  }

  findById(table, id) {
    if (!this.isInitialized) return null;
    
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
      return stmt.get(id);
    } catch (error) {
      console.error(`Error finding ${table} by id:`, error);
      return null;
    }
  }

  // Sync operations
  markSynced(table, id) {
    if (!this.isInitialized) return;
    
    try {
      const stmt = this.db.prepare(`UPDATE ${table} SET synced = 1 WHERE id = ?`);
      stmt.run(id);
    } catch (error) {
      console.error(`Error marking ${table} as synced:`, error);
    }
  }

  getUnsyncedRecords(table) {
    return this.findAll(table, 'synced = 0');
  }

  logSync(table, recordId, action, error = null) {
    if (!this.isInitialized) return;
    
    try {
      const stmt = this.db.prepare(`
        INSERT INTO sync_log (table_name, record_id, action, error) 
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(table, recordId, action, error);
    } catch (err) {
      console.error('Error logging sync:', err);
    }
  }

  // Connection status
  isOnline() {
    // This will be set by the main process based on network status
    return this.onlineStatus !== false;
  }

  setOnlineStatus(status) {
    this.onlineStatus = status;
  }

  // Cleanup
  close() {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
    }
  }
}

module.exports = new LocalDatabase(); 