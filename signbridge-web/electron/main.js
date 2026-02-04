const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0a0a0f',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
};

// app.disableHardwareAcceleration(); // Re-enabled for better video rendering performance

app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'camera', 'microphone'];
        if (allowedPermissions.includes(permission)) {
            console.log(`Allowing permission: ${permission}`);
            return callback(true);
        }
        callback(false);
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission, origin) => {
        const allowedPermissions = ['media', 'camera', 'microphone'];
        if (allowedPermissions.includes(permission)) return true;
        return false;
    });

    session.defaultSession.on('will-download', (event, item, webContents) => {
        // Set the save path, making Electron use the default Save As dialog
        // or just save it automatically to the downloads folder.
        const fileName = item.getFilename();
        const savePath = path.join(app.getPath('downloads'), fileName);

        item.setSavePath(savePath);
        console.log(`Downloading ${fileName} to ${savePath}`);

        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed');
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused');
                } else {
                    console.log(`Received bytes: ${item.getReceivedBytes()}`);
                }
            }
        });

        item.once('done', (event, state) => {
            if (state === 'completed') {
                console.log('Download successfully');
            } else {
                console.log(`Download failed: ${state}`);
            }
        });
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
