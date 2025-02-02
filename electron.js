const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let serverProcess;

app.on('ready', () => {
    // Start Express backend
    serverProcess = exec('node server/server.js', (err, stdout, stderr) => {
        if (err) {
            console.error('Failed to start server:', err);
        }
        console.log(stdout);
        console.error(stderr);
    });

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Load Vue frontend from built files
    mainWindow.loadFile(path.join(__dirname, 'client/dist/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

// Stop Express server when Electron exits
app.on('quit', () => {
    if (serverProcess) serverProcess.kill();
});
