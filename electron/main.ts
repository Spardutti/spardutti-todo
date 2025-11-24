import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import log from 'electron-log';
import { ToonStorage } from './storage';
import { initUpdater, isUpdateDownloaded, quitAndInstall } from './updater';
import type { Todo } from '../src/types/Todo';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// IPC handler for getting todos file path
ipcMain.handle('get-todos-path', () => {
  return path.join(app.getPath('userData'), 'todos.toon');
});

// IPC handlers for file operations
ipcMain.handle('load-todos', async (_event, filePath: string) => {
  return await ToonStorage.load(filePath);
});

ipcMain.handle('save-todos', async (_event, filePath: string, todos: Todo[]) => {
  await ToonStorage.save(filePath, todos);
});

// IPC handler for getting app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Capture startup time before any async operations
const startTime = Date.now();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 400,
    minHeight: 300,
    backgroundColor: '#000000',
    title: 'spardutti-todo',
    show: false, // Don't show immediately - prevents white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show window only when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Initialize auto-updater after window is ready
    initUpdater(mainWindow);
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools in development only
  // Commented out - users can manually open with Ctrl+Shift+I if needed
  // if (process.env.NODE_ENV !== 'production') {
  //   mainWindow.webContents.openDevTools();
  // }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  // Log startup time and app info
  const startupMs = Date.now() - startTime;
  log.info('App ready', {
    version: app.getVersion(),
    startupMs,
    node: process.version,
    electron: process.versions.electron,
  });

  // Warn if startup time exceeds 2-second target
  if (startupMs > 2000) {
    log.warn('Startup time exceeds 2s target', { startupMs });
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle update installation on app quit
app.on('before-quit', () => {
  // Check if an update has been downloaded
  if (isUpdateDownloaded()) {
    log.info('Installing update before quit...');
    // quitAndInstall() will quit the app and run the installer
    quitAndInstall();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
