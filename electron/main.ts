import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import log from 'electron-log';
import { ToonStorage } from './storage';
import { initUpdater, isUpdateDownloaded, quitAndInstall, checkForUpdates } from './updater';
import type { Todo } from '../src/types/Todo';
import type { Project } from '../src/types/Project';
import type { AppSettings } from '../src/types/Settings';

// ===================================
// Data Path Helpers
// ===================================

const getUserDataPath = (): string => app.getPath('userData');

// IPC handler for getting todos file path
ipcMain.handle('get-todos-path', () => {
  return path.join(getUserDataPath(), 'todos.toon');
});

// IPC handler for getting projects file path
ipcMain.handle('get-projects-path', () => {
  return path.join(getUserDataPath(), 'projects.toon');
});

// IPC handler for getting settings file path
ipcMain.handle('get-settings-path', () => {
  return path.join(getUserDataPath(), 'settings.toon');
});

// ===================================
// Todo IPC Handlers
// ===================================

ipcMain.handle('load-todos', async (_event, filePath: string) => {
  return await ToonStorage.load(filePath);
});

ipcMain.handle('save-todos', async (_event, filePath: string, todos: Todo[]) => {
  await ToonStorage.save(filePath, todos);
});

ipcMain.handle('delete-todos-file', async (_event, projectId: string) => {
  const filePath = path.join(getUserDataPath(), `todos-${projectId}.toon`);
  await ToonStorage.deleteTodosFile(filePath);
});

// ===================================
// Project IPC Handlers
// ===================================

ipcMain.handle('load-projects', async (_event, filePath: string) => {
  return await ToonStorage.loadProjects(filePath);
});

ipcMain.handle('save-projects', async (_event, filePath: string, projects: Project[]) => {
  await ToonStorage.saveProjects(filePath, projects);
});

// ===================================
// Settings IPC Handlers
// ===================================

ipcMain.handle('load-settings', async (_event, filePath: string) => {
  return await ToonStorage.loadSettings(filePath);
});

ipcMain.handle('save-settings', async (_event, filePath: string, settings: AppSettings) => {
  await ToonStorage.saveSettings(filePath, settings);
});

// ===================================
// Migration IPC Handler
// ===================================

ipcMain.handle('check-migration-needed', async () => {
  const fs = await import('fs/promises');
  const userDataPath = getUserDataPath();
  const oldTodosPath = path.join(userDataPath, 'todos.toon');
  const projectsPath = path.join(userDataPath, 'projects.toon');

  try {
    // Check if old format exists (todos.toon) but new format doesn't (projects.toon)
    const [todosExists, projectsExists] = await Promise.all([
      fs.access(oldTodosPath).then(() => true).catch(() => false),
      fs.access(projectsPath).then(() => true).catch(() => false)
    ]);

    return todosExists && !projectsExists;
  } catch {
    return false;
  }
});

ipcMain.handle('run-migration', async () => {
  const fs = await import('fs/promises');
  const userDataPath = getUserDataPath();
  const oldTodosPath = path.join(userDataPath, 'todos.toon');
  const projectsPath = path.join(userDataPath, 'projects.toon');
  const settingsPath = path.join(userDataPath, 'settings.toon');

  try {
    log.info('Migration started', { hasOldFormat: true });

    // Create backup
    const backupPath = `${oldTodosPath}.backup`;
    await fs.copyFile(oldTodosPath, backupPath);
    log.info('Backup created', { backupPath });

    // Generate default project UUID
    const crypto = await import('crypto');
    const defaultProjectId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Create default project
    const defaultProject: Project = {
      id: defaultProjectId,
      name: 'Default',
      createdAt
    };

    // Rename todos.toon to todos-{defaultProjectId}.toon
    const newTodosPath = path.join(userDataPath, `todos-${defaultProjectId}.toon`);
    await fs.rename(oldTodosPath, newTodosPath);
    log.info('Todos file renamed', { from: oldTodosPath, to: newTodosPath });

    // Create projects.toon with Default project
    await ToonStorage.saveProjects(projectsPath, [defaultProject]);
    log.info('Projects file created', { projectsPath });

    // Create settings.toon
    const defaultSettings: AppSettings = {
      activeProjectId: defaultProjectId,
      windowBounds: { x: 100, y: 100, width: 600, height: 400 },
      version: '1.0'
    };
    await ToonStorage.saveSettings(settingsPath, defaultSettings);
    log.info('Settings file created', { settingsPath });

    log.warn('Migration completed', { backupPath, newProjectId: defaultProjectId });

    return { success: true, projectId: defaultProjectId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Migration failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
});

// IPC handler for getting app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// IPC handler for manual update check (Ctrl+U shortcut)
ipcMain.on('check-for-updates-manual', () => {
  log.info('Manual update check triggered by user');
  checkForUpdates();
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
