/**
 * Represents the status of the auto-update system.
 *
 * Used for IPC communication between main process (electron-updater events)
 * and renderer process (footer notifications).
 */
export interface UpdateStatus {
  /**
   * Current update check/download status
   * - 'checking': Manual update check in progress
   * - 'available': Update found, about to download (Story 8.4: superseded by downloading)
   * - 'downloading': Update download in progress with percentage (Story 8.4)
   * - 'not-available': No update available
   * - 'downloaded': Update ready for install (Story 8.4: "Update ready. Restart to install.")
   * - 'error': Update check or download failed (Story 8.4: red color, auto-hide)
   */
  status: 'checking' | 'available' | 'downloading' | 'not-available' | 'downloaded' | 'error'

  /**
   * Download progress percentage (0-100)
   * Present when status is 'downloading'
   */
  percent?: number

  /**
   * Version string of the available/downloaded update (if applicable)
   * Present when status is 'available' or 'downloaded'
   */
  version?: string

  /**
   * Display message for the footer notification
   * Examples:
   * - "Checking for updates..."
   * - "Update available. Downloading..."
   * - "Update available. Restart to install."
   * - "You're on the latest version."
   * - "Update check failed. Try again later."
   */
  message: string

  /**
   * Error details (if status is 'error')
   * Only present for manual update checks (Story 6.3)
   */
  error?: string
}
