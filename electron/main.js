const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Configure auto-updater
autoUpdater.checkForUpdatesAndNotify();
autoUpdater.autoDownload = false;

// Load environment variables manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    }
  }
}

// Load environment variables
loadEnvFile();

const isDev = process.env.NODE_ENV === 'development';

// Import our new modules
const localDb = require('./database');
const syncManager = require('./sync-manager');
const printManager = require('./print-manager');

class RepairGridApp {
  constructor() {
    this.mainWindow = null;
    this.isQuitting = false;
  }

  async initialize() {
    // Set app icon and identity for Windows
    if (process.platform === 'win32') {
      // Set a unique app user model ID for Windows taskbar grouping
      app.setAppUserModelId('com.repairgrid.repairgrid');
      
      // Set app name
      app.setName('Flynns');
    }
    
    // Initialize local database
    localDb.initialize();
    
    // Initialize sync manager
    syncManager.initialize(process.env.VITE_CONVEX_URL || process.env.CONVEX_URL);

    // Set up auto-updater
    this.setupAutoUpdater();

    // Set up IPC handlers
    this.setupIPC();

    // Create the main window
    this.createWindow();

    // Set up the application menu
    this.createMenu();

    // Handle app events
    this.setupAppEvents();
  }

  createWindow() {
    // Determine the best icon format for the platform
    let iconPath;
    if (process.platform === 'win32') {
      iconPath = path.join(__dirname, 'assets', 'icon.ico');
    } else if (process.platform === 'darwin') {
      iconPath = path.join(__dirname, 'assets', 'icon.icns');
    } else {
      iconPath = path.join(__dirname, 'assets', 'icon.png');
    }

    // Verify icon exists
    if (!fs.existsSync(iconPath)) {
      console.warn(`Icon not found at ${iconPath}`);
      // Fallback to a different location if needed
      iconPath = path.join(__dirname, '..', 'electron', 'assets', 'icon.ico');
    }

    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      frame: false, // Remove default frame
      titleBarStyle: 'hidden',
      backgroundColor: '#0a0a0a', // Dark background
      icon: iconPath,
      title: 'Flynns - Repair Management', // Set window title
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false,
      transparent: false,
      vibrancy: 'dark', // macOS vibrancy effect
      visualEffectState: 'active'
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      // this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Focus the window
      if (isDev) {
        this.mainWindow.focus();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window close attempt
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.handleWindowClose();
      }
    });

    // Handle window maximize/unmaximize
    this.mainWindow.on('maximize', () => {
      this.mainWindow.webContents.send('window-maximized', true);
    });

    this.mainWindow.on('unmaximize', () => {
      this.mainWindow.webContents.send('window-maximized', false);
    });
  }

  setupAutoUpdater() {
    // Auto-updater event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available.');
      this.showUpdateAvailableDialog(info);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available.');
    });

    autoUpdater.on('error', (err) => {
      console.log('Error in auto-updater. ' + err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      console.log(log_message);
      
      // Send progress to renderer
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-download-progress', progressObj);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded');
      this.showUpdateReadyDialog();
    });

    // Check for updates on startup (after window is ready)
    setTimeout(() => {
      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    }, 3000);
  }

  showUpdateAvailableDialog(info) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: 'Would you like to download it now? The app will restart after the update is installed.',
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  }

  showUpdateReadyDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully!',
      detail: 'The app will restart to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }

  setupIPC() {
    // Auto-updater IPC handlers
    ipcMain.handle('app:checkForUpdates', () => {
      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    // Window controls
    ipcMain.handle('window:minimize', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize();
      }
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          this.mainWindow.unmaximize();
        } else {
          this.mainWindow.maximize();
        }
      }
    });

    ipcMain.handle('window:close', () => {
      this.handleWindowClose();
    });

    ipcMain.handle('window:isMaximized', () => {
      return this.mainWindow ? this.mainWindow.isMaximized() : false;
    });

    // Database operations
    ipcMain.handle('db:insert', async (event, table, data) => {
      return localDb.insert(table, data);
    });

    ipcMain.handle('db:update', async (event, table, id, data) => {
      return localDb.update(table, id, data);
    });

    ipcMain.handle('db:delete', async (event, table, id) => {
      return localDb.delete(table, id);
    });

    ipcMain.handle('db:findAll', async (event, table, where, params) => {
      return localDb.findAll(table, where, params);
    });

    ipcMain.handle('db:findById', async (event, table, id) => {
      return localDb.findById(table, id);
    });

    // Sync operations
    ipcMain.handle('sync:getStatus', async () => {
      return syncManager.getConnectionStatus();
    });

    ipcMain.handle('sync:force', async () => {
      return syncManager.forcSync();
    });

    // Print operations
    ipcMain.handle('print:ticket', async (event, ticketData) => {
      try {
        await printManager.printTicket(ticketData);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('print:report', async (event, reportData, reportType) => {
      try {
        await printManager.printReport(reportData, reportType);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('print:toPDF', async (event, ticketData, outputPath) => {
      try {
        const html = printManager.generateTicketHTML(ticketData);
        const filePath = await printManager.printToPDF(html, outputPath);
        return { success: true, filePath };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // App operations
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('app:showSaveDialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result;
    });

    ipcMain.handle('app:showOpenDialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });

    ipcMain.handle('app:showMessageBox', async (event, options) => {
      const result = await dialog.showMessageBox(this.mainWindow, options);
      return result;
    });
  }

  createMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Ticket',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('menu:new-ticket');
            }
          },
          { type: 'separator' },
          {
            label: 'Print Current Ticket',
            accelerator: 'CmdOrCtrl+P',
            click: () => {
              this.mainWindow.webContents.send('menu:print-ticket');
            }
          },
          {
            label: 'Export to PDF',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: () => {
              this.mainWindow.webContents.send('menu:export-pdf');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Sync',
        submenu: [
          {
            label: 'Sync Now',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              syncManager.forcSync();
              this.mainWindow.webContents.send('menu:sync-status');
            }
          },
          {
            label: 'Connection Status',
            click: () => {
              const status = syncManager.getConnectionStatus();
              dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Connection Status',
                message: `Status: ${status.isOnline ? 'Online' : 'Offline'}\\nSync in Progress: ${status.syncInProgress ? 'Yes' : 'No'}`,
                buttons: ['OK']
              });
            }
          },
          { type: 'separator' },
          {
            label: 'Work Offline',
            type: 'checkbox',
            checked: false,
            click: (menuItem) => {
              // Toggle offline mode
              const isOffline = menuItem.checked;
              syncManager.setOnlineStatus(!isOffline);
              this.mainWindow.webContents.send('menu:offline-mode', isOffline);
            }
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Flynns',
            click: () => {
              this.showAboutDialog();
            }
          },
          { type: 'separator' },
          {
            label: 'User Manual',
            click: () => {
              shell.openExternal('https://repairgrid.com/manual');
            }
          },
          {
            label: 'Support',
            click: () => {
              shell.openExternal('https://repairgrid.com/support');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupAppEvents() {
    app.whenReady().then(() => {
      this.initialize();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', (event) => {
      this.isQuitting = true;
      this.cleanup();
    });
  }

  async handleWindowClose() {
    // Check if there are unsaved changes
    const unsyncedData = {
      customers: localDb.getUnsyncedRecords('customers'),
      technicians: localDb.getUnsyncedRecords('technicians'),
      tickets: localDb.getUnsyncedRecords('tickets'),
      parts: localDb.getUnsyncedRecords('parts')
    };

    const totalUnsynced = Object.values(unsyncedData).reduce((total, records) => total + records.length, 0);

    if (totalUnsynced > 0) {
      const response = await dialog.showMessageBox(this.mainWindow, {
        type: 'warning',
        title: 'Unsaved Changes',
        message: `You have ${totalUnsynced} unsaved changes that haven't been synced to the server.`,
        detail: 'Do you want to exit anyway? Your changes will be saved locally and synced when you reconnect.',
        buttons: ['Exit Anyway', 'Cancel'],
        defaultId: 1,
        cancelId: 1
      });

      if (response.response === 0) {
        this.isQuitting = true;
        app.quit();
      }
    } else {
      this.isQuitting = true;
      app.quit();
    }
  }

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Flynns',
      message: 'Flynns Repair Management System',
      detail: `Version: ${app.getVersion()}\\n\\nFlynns Professional Repair Shop Management\\n\\nFeatures:\\n• Ticket Management\\n• Customer Database\\n• Technician Tracking\\n• Parts Inventory\\n• Offline Support\\n• Print Integration\\n• Real-time Sync\\n\\nBuilt with Electron, React, and Convex`,
      buttons: ['OK']
    });
  }

  cleanup() {
    // Stop sync manager
    syncManager.stop();
    
    // Close database
    localDb.close();
  }
}

// Create and run the app
const repairGridApp = new RepairGridApp();

// Handle app ready event
app.whenReady().then(() => {
  repairGridApp.initialize();
});

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
}); 