const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Environment variables needed by the renderer
  env: {
    // Prefer explicit Vite var, fallback to generic
    CONVEX_URL: process.env.VITE_CONVEX_URL || process.env.CONVEX_URL,
  },
  // Database operations
  database: {
    insert: (table, data) => ipcRenderer.invoke('db:insert', table, data),
    update: (table, id, data) => ipcRenderer.invoke('db:update', table, id, data),
    delete: (table, id) => ipcRenderer.invoke('db:delete', table, id),
    findAll: (table, where, params) => ipcRenderer.invoke('db:findAll', table, where, params),
    findById: (table, id) => ipcRenderer.invoke('db:findById', table, id)
  },

  // Sync operations
  sync: {
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    force: () => ipcRenderer.invoke('sync:force'),
    onStatusChange: (callback) => {
      ipcRenderer.on('menu:sync-status', callback);
      return () => ipcRenderer.removeListener('menu:sync-status', callback);
    },
    onOfflineModeChange: (callback) => {
      ipcRenderer.on('menu:offline-mode', callback);
      return () => ipcRenderer.removeListener('menu:offline-mode', callback);
    }
  },

  // Print operations
  print: {
    ticket: (ticketData) => ipcRenderer.invoke('print:ticket', ticketData),
    report: (reportData, reportType) => ipcRenderer.invoke('print:report', reportData, reportType),
    toPDF: (ticketData, outputPath) => ipcRenderer.invoke('print:toPDF', ticketData, outputPath)
  },

  // App operations
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    showSaveDialog: (options) => ipcRenderer.invoke('app:showSaveDialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('app:showOpenDialog', options),
    showMessageBox: (options) => ipcRenderer.invoke('app:showMessageBox', options)
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback) => {
      ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized));
      return () => ipcRenderer.removeListener('window-maximized', callback);
    }
  },

  // Menu event listeners
  menu: {
    onNewTicket: (callback) => {
      ipcRenderer.on('menu:new-ticket', callback);
      return () => ipcRenderer.removeListener('menu:new-ticket', callback);
    },
    onPrintTicket: (callback) => {
      ipcRenderer.on('menu:print-ticket', callback);
      return () => ipcRenderer.removeListener('menu:print-ticket', callback);
    },
    onExportPDF: (callback) => {
      ipcRenderer.on('menu:export-pdf', callback);
      return () => ipcRenderer.removeListener('menu:export-pdf', callback);
    }
  },

  // Platform information
  platform: process.platform,
  
  // Environment
  isDev: process.env.NODE_ENV === 'development'
});

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Renderer error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Log that preload script is loaded
console.log('Flynns preload script loaded'); 