const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple MVP; consider contextBridge for production
            webSecurity: false // Allow loading local resources (CORS fix for file://)
        },
    });

    // Load the index.html of the app.
    // In dev, load localhost. In prod, load built file.
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5175');
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        // DEBUG: Open DevTools in production to see errors
        mainWindow.webContents.openDevTools();
    }
};

// Disable GPU Acceleration to prevent black screen issues
app.disableHardwareAcceleration();

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    // Permission handling
    const session = require('electron').session;
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            return callback(true);
        }
        callback(false);
    });

    createWindow();

    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
