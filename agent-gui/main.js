const { app, BrowserWindow, ipcMain } = require("electron");
const { io } = require("socket.io-client");
const path = require("path");

const SERVER_URL = "https://rst.creativedesignit.in";
let mainWindow;
let socket;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 520,
    resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "icon.ico"),
  });
  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (socket) socket.disconnect();
  app.quit();
});

// Connect event from renderer
ipcMain.on("connect", (event, sessionCode) => {
  if (socket) socket.disconnect();

  socket = io(SERVER_URL, {
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    socket.emit("agent-join", { roomId: sessionCode });
    mainWindow.webContents.send("status", "connected", sessionCode);
  });

  socket.on("mouse-move", ({ x, y }) => {
    try { require("robotjs").moveMouse(x, y); } catch(e) {}
  });

  socket.on("mouse-click", ({ x, y, button }) => {
    try {
      const r = require("robotjs");
      r.moveMouse(x, y);
      r.mouseClick(button || "left");
    } catch(e) {}
  });

  socket.on("mouse-double-click", ({ x, y }) => {
    try {
      const r = require("robotjs");
      r.moveMouse(x, y);
      r.mouseClick("left", true);
    } catch(e) {}
  });

  socket.on("mouse-scroll", ({ y }) => {
    try { require("robotjs").scrollMouse(0, y > 0 ? 3 : -3); } catch(e) {}
  });

  socket.on("key-press", ({ key, modifier }) => {
    try {
      const r = require("robotjs");
      if (modifier) r.keyTap(key, modifier);
      else r.keyTap(key);
    } catch(e) {}
  });

  socket.on("disconnect", () => {
    mainWindow.webContents.send("status", "disconnected");
  });

  socket.on("connect_error", () => {
    mainWindow.webContents.send("status", "error");
  });
});

ipcMain.on("disconnect", () => {
  if (socket) socket.disconnect();
  mainWindow.webContents.send("status", "disconnected");
});
