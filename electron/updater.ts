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
 * Tracks whether the current update check was triggered manually (Ctrl+U).
 * Manual checks show all results in footer, automatic checks are silent for not-available/error.
 */
let _isManualCheck = false

/**
 * Timestamp of the last update check for debouncing.
 * Prevents repeated checks within 10 seconds to avoid GitHub API spam.
 */
let _lastCheckTime = 0

/**
 * Reference to mainWindow for IPC communication from event handlers.
 */
let _mainWindow: BrowserWindow | null = null

/**
 * Initializes the electron-updater system with logging and automatic update checks.
 *
 * @param mainWindow - The main BrowserWindow instance for IPC communication
 */
export function initUpdater(mainWindow: BrowserWindow): void {
  // Store reference for event handlers
  _mainWindow = mainWindow

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

    // For manual checks, send "Checking..." message to footer
    if (_isManualCheck && _mainWindow) {
      const status: UpdateStatus = {
        status: 'checking',
        message: 'Checking for updates...',
      }
      _mainWindow.webContents.send('update-status', status)
    }
    // Note: Automatic checks don't send "checking" status (transient state)
  })

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)

    // Send IPC message to renderer (both manual and automatic checks)
    // Story 8.4: This will be immediately followed by download-progress events
    if (_mainWindow) {
      const status: UpdateStatus = {
        status: 'available',
        version: info.version,
        message: 'Update available. Downloading...',
      }
      _mainWindow.webContents.send('update-status', status)
    }

    // Reset manual check flag after handling
    _isManualCheck = false
  })

  // Event: Download progress (Story 8.4)
  // Emits real-time progress percentage during update download
  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.floor(progress.percent)
    log.info('Download progress:', { percent, transferred: progress.transferred, total: progress.total })

    if (_mainWindow) {
      const status: UpdateStatus = {
        status: 'downloading',
        percent,
        message: `Downloading update... ${percent}%`,
      }
      _mainWindow.webContents.send('update-status', status)
    }
  })

  // Event: No update available
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info.version)

    // Manual checks show "You're on the latest version." with auto-hide
    if (_isManualCheck && _mainWindow) {
      const status: UpdateStatus = {
        status: 'not-available',
        version: info.version,
        message: "You're on the latest version.",
      }
      _mainWindow.webContents.send('update-status', status)
    }
    // Automatic checks: Silent (no IPC message sent)

    // Reset manual check flag after handling
    _isManualCheck = false
  })

  // Event: Update downloaded and ready to install (Story 8.4: AC #3)
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version)

    // Track downloaded state for quitAndInstall
    _updateDownloaded = true

    // Send IPC message to renderer (both manual and automatic checks)
    // Story 8.4 AC #3: "Update ready. Restart to install." persists until restart
    if (_mainWindow) {
      const status: UpdateStatus = {
        status: 'downloaded',
        version: info.version,
        message: 'Update ready. Restart to install.',
      }
      _mainWindow.webContents.send('update-status', status)
    }

    // Reset manual check flag after handling
    _isManualCheck = false
  })

  // Event: Error occurred during update process (Story 8.4: AC #4)
  // Offline-first design: Don't crash app, just log the error
  // Story 8.4 AC #4: Show error for both manual and automatic checks during download
  autoUpdater.on('error', (error) => {
    log.error('Update error:', error.message)

    // Story 8.4 AC #4: Show error message for download failures
    // Red color, auto-hide after 5 seconds (handled in renderer)
    if (_mainWindow) {
      const status: UpdateStatus = {
        status: 'error',
        message: 'Update failed. Try again later.',
        error: error.message,
      }
      _mainWindow.webContents.send('update-status', status)
    }

    // Reset manual check flag after handling
    _isManualCheck = false
  })

  // Start initial update check on app launch
  autoUpdater.checkForUpdatesAndNotify()
}

/**
 * Manually triggers an update check with debouncing (for Ctrl+U shortcut).
 *
 * Debouncing prevents repeated checks within 10 seconds to avoid GitHub API spam.
 * Sets _isManualCheck flag so event handlers know to send feedback messages.
 */
export function checkForUpdates(): void {
  const now = Date.now()

  // Debounce: Prevent checks within 10 seconds
  if (now - _lastCheckTime < 10000) {
    log.info('Update check debounced (within 10 seconds)')
    return
  }

  _lastCheckTime = now
  _isManualCheck = true
  log.info('Manual update check initiated')
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
