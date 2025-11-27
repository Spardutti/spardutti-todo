// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'
import type { Todo } from '../src/types/Todo'
import type { Project } from '../src/types/Project'
import type { AppSettings, WindowBounds } from '../src/types/Settings'
import type { UpdateStatus } from '../src/types/UpdateStatus'

// Expose safe API to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Path getters
  getTodosPath: () => ipcRenderer.invoke('get-todos-path'),
  getProjectsPath: () => ipcRenderer.invoke('get-projects-path'),
  getSettingsPath: () => ipcRenderer.invoke('get-settings-path'),

  // Todo operations
  loadTodos: (filePath: string) => ipcRenderer.invoke('load-todos', filePath),
  saveTodos: (filePath: string, todos: Todo[]) => ipcRenderer.invoke('save-todos', filePath, todos),
  deleteTodosFile: (projectId: string) => ipcRenderer.invoke('delete-todos-file', projectId),

  // Project operations
  loadProjects: (filePath: string) => ipcRenderer.invoke('load-projects', filePath),
  saveProjects: (filePath: string, projects: Project[]) => ipcRenderer.invoke('save-projects', filePath, projects),

  // Settings operations
  loadSettings: (filePath: string) => ipcRenderer.invoke('load-settings', filePath),
  saveSettings: (filePath: string, settings: AppSettings) => ipcRenderer.invoke('save-settings', filePath, settings),

  // Migration operations
  checkMigrationNeeded: () => ipcRenderer.invoke('check-migration-needed'),
  runMigration: () => ipcRenderer.invoke('run-migration'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Window bounds operations (Story 8.1)
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setWindowBounds: (bounds: WindowBounds) => ipcRenderer.invoke('set-window-bounds', bounds),

  /**
   * Registers a callback to receive window bounds changes from the main process.
   * Called after debounced resize/move events (500ms delay).
   */
  onBoundsChanged: (callback: (bounds: WindowBounds) => void) => {
    ipcRenderer.on('bounds-changed', (_event, bounds: WindowBounds) => callback(bounds))
  }
})

// Expose updater API to renderer process
contextBridge.exposeInMainWorld('updater', {
  /**
   * Registers a callback to receive update status notifications from the main process.
   * @param callback - Function to call when update status changes
   */
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    ipcRenderer.on('update-status', (_event, status: UpdateStatus) => callback(status))
  },

  /**
   * Triggers a manual update check (for Ctrl+U shortcut).
   * Debouncing is handled in the main process.
   */
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates-manual')
  }
})
