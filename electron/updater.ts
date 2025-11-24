import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import type { BrowserWindow } from 'electron'

/**
 * Initializes the electron-updater system with logging and automatic update checks.
 *
 * @param mainWindow - The main BrowserWindow instance for potential IPC communication
 */
export function initUpdater(mainWindow: BrowserWindow): void {
  // Configure electron-updater to use electron-log for all logging
  autoUpdater.logger = log

  // Event: Checking for update
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
  })

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)
  })

  // Event: No update available
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info.version)
  })

  // Event: Update downloaded and ready to install
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version)
  })

  // Event: Error occurred during update process
  // Offline-first design: Don't crash app, just log the error
  autoUpdater.on('error', (error) => {
    log.error('Update error:', error.message)
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
 * Quits the application and installs the downloaded update
 */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
