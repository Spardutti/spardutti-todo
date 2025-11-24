import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import type { BrowserWindow } from 'electron'
import type { UpdateStatus } from '../src/types/UpdateStatus'

/**
 * Tracks whether an update has been downloaded and is ready to install.
 * Used by before-quit handler to conditionally call quitAndInstall().
 */
let _updateDownloaded = false

/**
 * Initializes the electron-updater system with logging and automatic update checks.
 *
 * @param mainWindow - The main BrowserWindow instance for IPC communication
 */
export function initUpdater(mainWindow: BrowserWindow): void {
  // Configure electron-updater to use electron-log for all logging
  autoUpdater.logger = log

  // Configure GitHub as the update provider
  // This tells electron-updater where to check for releases
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Spardutti',
    repo: 'spardutti-todo',
  })

  // Event: Checking for update
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
    // Note: Checking status not sent to renderer for automatic checks (transient state)
  })

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)

    // Send IPC message to renderer
    const status: UpdateStatus = {
      status: 'available',
      version: info.version,
      message: 'Update available. Downloading...',
    }
    mainWindow.webContents.send('update-status', status)
  })

  // Event: No update available
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info.version)
    // Silent for automatic checks - no IPC message sent
    // Manual checks will handle this differently in Story 6.3
  })

  // Event: Update downloaded and ready to install
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version)

    // Track downloaded state for quitAndInstall
    _updateDownloaded = true

    // Send IPC message to renderer
    const status: UpdateStatus = {
      status: 'downloaded',
      version: info.version,
      message: 'Update available. Restart to install.',
    }
    mainWindow.webContents.send('update-status', status)
  })

  // Event: Error occurred during update process
  // Offline-first design: Don't crash app, just log the error
  autoUpdater.on('error', (error) => {
    log.error('Update error:', error.message)
    // Silent for automatic checks - no IPC message sent
    // Manual checks will show error messages in Story 6.3
  })

  // Start initial update check on app launch
  autoUpdater.checkForUpdatesAndNotify()
}

/**
 * Manually triggers an update check (for Ctrl+U shortcut in future stories)
 */
export function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
}

/**
 * Returns whether an update has been downloaded and is ready to install.
 * Used by before-quit handler to conditionally call quitAndInstall().
 */
export function isUpdateDownloaded(): boolean {
  return _updateDownloaded
}

/**
 * Quits the application and installs the downloaded update
 */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
