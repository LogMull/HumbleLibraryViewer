const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let serverProcess;

app.on("ready", () => {
  // Start Express backend
//   serverProcess = spawn("node", ["server/server.js"], {
//     cwd: __dirname,
//     shell: true,
//     detached: false, // Allows independent process control
//     stdio: "inherit", 
//   });
serverProcess = spawn("node", ["server/server.js"], { stdio: "inherit" });
  serverProcess.unref(); // Allows Electron to exit cleanly

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load Vue frontend from built files
  mainWindow.loadFile(path.join(__dirname, "client/dist/index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

// Kill backend when all windows are closed
app.on("window-all-closed", () => {
  stopServerProcess();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Ensure the backend is killed when Electron quits
app.on("quit", () => {
  stopServerProcess();
});

function stopServerProcess() {
    if (serverProcess) {
      try {
        process.kill(serverProcess.pid); // Kill only if process exists
      } catch (err) {
        if (err.code !== "ESRCH") {
          console.error("Failed to kill server process:", err);
        }
      }
      serverProcess = null;
    }
  }
  
