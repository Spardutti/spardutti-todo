/**
 * Represents the status of the auto-update system.
 *
 * Used for IPC communication between main process (electron-updater events)
 * and renderer process (footer notifications).
 */
export interface UpdateStatus {
  /**
   * Current update check/download status
   */
  status: 'checking' | 'available' | 'not-available' | 'downloaded' | 'error'

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
