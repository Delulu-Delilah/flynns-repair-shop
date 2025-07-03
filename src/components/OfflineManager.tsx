import React, { useState, useEffect, createContext, useContext } from 'react';
import { toast } from 'sonner';

// Type definitions for Electron API
interface ElectronAPI {
  database: {
    insert: (table: string, data: any) => Promise<any>;
    update: (table: string, id: string, data: any) => Promise<any>;
    delete: (table: string, id: string) => Promise<any>;
    findAll: (table: string, where?: string, params?: any[]) => Promise<any[]>;
    findById: (table: string, id: string) => Promise<any>;
  };
  sync: {
    getStatus: () => Promise<{
      isOnline: boolean;
      lastSync?: number;
      syncInProgress: boolean;
    }>;
    force: () => Promise<void>;
    onStatusChange: (callback: () => void) => () => void;
    onOfflineModeChange: (callback: (isOffline: boolean) => void) => () => void;
  };
  print: {
    ticket: (ticketData: any) => Promise<{ success: boolean; error?: string }>;
    report: (reportData: any, reportType: string) => Promise<{ success: boolean; error?: string }>;
    toPDF: (ticketData: any, outputPath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  };
  app: {
    getVersion: () => Promise<string>;
    showSaveDialog: (options: any) => Promise<any>;
    showOpenDialog: (options: any) => Promise<any>;
    showMessageBox: (options: any) => Promise<any>;
  };
  window: {
    minimize: () => void;
    maximize: () => Promise<boolean>;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;
  };
  menu: {
    onNewTicket: (callback: () => void) => () => void;
    onPrintTicket: (callback: () => void) => () => void;
    onExportPDF: (callback: () => void) => () => void;
  };
  platform: string;
  isDev: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

interface SyncStatus {
  isOnline: boolean;
  lastSync?: number;
  syncInProgress: boolean;
}

interface OfflineContextType {
  isElectron: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
  printTicket: (ticketData: any) => Promise<void>;
  printReport: (reportData: any, reportType: string) => Promise<void>;
  exportToPDF: (ticketData: any) => Promise<void>;
  localDatabase: {
    insert: (table: string, data: any) => Promise<any>;
    update: (table: string, id: string, data: any) => Promise<any>;
    delete: (table: string, id: string) => Promise<any>;
    findAll: (table: string, where?: string, params?: any[]) => Promise<any[]>;
    findById: (table: string, id: string) => Promise<any>;
  };
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: React.ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isElectron] = useState(() => Boolean(window.electronAPI));
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    syncInProgress: false
  });

  useEffect(() => {
    // Check actual network connectivity by testing if we can reach Convex
    const checkConvexConnection = async () => {
      try {
        const convexUrl = import.meta.env.VITE_CONVEX_URL;
        if (!convexUrl) {
          setIsOnline(false);
          return;
        }
        
        // Try to fetch from Convex (this will fail if offline)
        const response = await fetch(convexUrl, { 
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    // Check connection immediately
    checkConvexConnection();
    
    // Check connection every 10 seconds
    const connectionInterval = setInterval(checkConvexConnection, 10000);

    if (!isElectron) {
      return () => clearInterval(connectionInterval);
    }

    // Get initial sync status for Electron
    const updateSyncStatus = async () => {
      try {
        const status = await window.electronAPI!.sync.getStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    updateSyncStatus();

    // Set up status change listeners
    const unsubscribeStatus = window.electronAPI!.sync.onStatusChange(() => {
      updateSyncStatus();
    });

    const unsubscribeOffline = window.electronAPI!.sync.onOfflineModeChange((isOffline: boolean) => {
      setIsOnline(!isOffline);
      if (isOffline) {
        toast.warning('Working offline - changes will sync when reconnected');
      } else {
        toast.success('Back online - syncing changes...');
      }
    });

    // Set up menu listeners
    const unsubscribeNewTicket = window.electronAPI!.menu.onNewTicket(() => {
      // Navigate to new ticket form or trigger action
      toast.info('New ticket shortcut activated');
    });

    const unsubscribePrintTicket = window.electronAPI!.menu.onPrintTicket(() => {
      // Print current ticket
      toast.info('Print ticket shortcut activated');
    });

    const unsubscribeExportPDF = window.electronAPI!.menu.onExportPDF(() => {
      // Export current ticket to PDF
      toast.info('Export PDF shortcut activated');
    });

    // Cleanup
    return () => {
      clearInterval(connectionInterval);
      unsubscribeStatus();
      unsubscribeOffline();
      unsubscribeNewTicket();
      unsubscribePrintTicket();
      unsubscribeExportPDF();
    };
  }, [isElectron]);

  const forceSync = async () => {
    if (!isElectron) return;
    
    try {
      await window.electronAPI!.sync.force();
      toast.success('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed - check connection');
    }
  };

  const printTicket = async (ticketData: any) => {
    if (!isElectron) {
      toast.error('Print functionality only available in desktop app');
      return;
    }

    try {
      const result = await window.electronAPI!.print.ticket(ticketData);
      if (result.success) {
        toast.success('Ticket printed successfully');
      } else {
        toast.error(`Print failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Print failed');
    }
  };

  const printReport = async (reportData: any, reportType: string) => {
    if (!isElectron) {
      toast.error('Print functionality only available in desktop app');
      return;
    }

    try {
      const result = await window.electronAPI!.print.report(reportData, reportType);
      if (result.success) {
        toast.success('Report printed successfully');
      } else {
        toast.error(`Print failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Print failed');
    }
  };

  const exportToPDF = async (ticketData: any) => {
    if (!isElectron) {
      toast.error('PDF export only available in desktop app');
      return;
    }

    try {
      // Show save dialog
      const result = await window.electronAPI!.app.showSaveDialog({
        title: 'Export Ticket to PDF',
        defaultPath: `ticket-${ticketData.ticketNumber}.pdf`,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const exportResult = await window.electronAPI!.print.toPDF(ticketData, result.filePath);
        if (exportResult.success) {
          toast.success(`PDF exported to ${exportResult.filePath}`);
        } else {
          toast.error(`Export failed: ${exportResult.error}`);
        }
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF export failed');
    }
  };

  // Local database operations (fallback to Convex when not in Electron)
  const localDatabase = {
    insert: async (table: string, data: any) => {
      if (isElectron && !isOnline) {
        return await window.electronAPI!.database.insert(table, data);
      }
      // Fallback to Convex API when online or not in Electron
      throw new Error('Use Convex mutations for online operations');
    },
    
    update: async (table: string, id: string, data: any) => {
      if (isElectron && !isOnline) {
        return await window.electronAPI!.database.update(table, id, data);
      }
      throw new Error('Use Convex mutations for online operations');
    },
    
    delete: async (table: string, id: string) => {
      if (isElectron && !isOnline) {
        return await window.electronAPI!.database.delete(table, id);
      }
      throw new Error('Use Convex mutations for online operations');
    },
    
    findAll: async (table: string, where?: string, params?: any[]) => {
      if (isElectron && !isOnline) {
        return await window.electronAPI!.database.findAll(table, where, params);
      }
      throw new Error('Use Convex queries for online operations');
    },
    
    findById: async (table: string, id: string) => {
      if (isElectron && !isOnline) {
        return await window.electronAPI!.database.findById(table, id);
      }
      throw new Error('Use Convex queries for online operations');
    }
  };

  const contextValue: OfflineContextType = {
    isElectron,
    isOnline,
    syncStatus,
    forceSync,
    printTicket,
    printReport,
    exportToPDF,
    localDatabase
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
      {isElectron && <SyncStatusIndicator />}
    </OfflineContext.Provider>
  );
};

// Sync status indicator component
const SyncStatusIndicator: React.FC = () => {
  const { isOnline, syncStatus, forceSync } = useOffline();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono ${
        isOnline 
          ? 'bg-tron-dark border-cyan-400 text-cyan-100' 
          : 'bg-orange-900 border-orange-400 text-orange-100'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-cyan-400' : 'bg-orange-400'
        } ${syncStatus.syncInProgress ? 'animate-pulse' : ''}`} />
        
        <span>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
          {syncStatus.syncInProgress && ' - SYNCING'}
        </span>

        {!syncStatus.syncInProgress && (
          <button
            onClick={forceSync}
            className="ml-2 px-2 py-1 text-xs bg-cyan-400 text-black rounded hover:bg-cyan-300 transition-colors"
            title="Force sync"
          >
            SYNC
          </button>
        )}
      </div>
      
      {syncStatus.lastSync && (
        <div className="text-xs text-cyan-300 mt-1 text-right">
          Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}; 