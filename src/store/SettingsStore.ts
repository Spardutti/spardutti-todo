import type { AppSettings, WindowBounds } from '@/types/Settings'

/**
 * Default settings used when no settings file exists or on initialization.
 */
const DEFAULT_SETTINGS: AppSettings = {
  activeProjectId: '',
  windowBounds: {
    x: 100,
    y: 100,
    width: 600,
    height: 400,
  },
  version: '1.0',
}

/**
 * SettingsStore manages application settings including active project and window bounds.
 *
 * This class provides methods to load/save settings from disk and get/set individual
 * setting values. It uses a fire-and-forget pattern for saves to avoid blocking the UI.
 *
 * @example
 * ```typescript
 * const settingsStore = new SettingsStore('/path/to/settings.toon')
 * await settingsStore.load()
 * const projectId = settingsStore.getActiveProjectId()
 * settingsStore.setActiveProject('new-project-id')
 * ```
 */
export class SettingsStore {
  private _settings: AppSettings
  private _filePath: string

  /**
   * Creates a new SettingsStore with the specified file path for persistence.
   *
   * @param filePath - Absolute path to the settings.toon file
   */
  constructor(filePath: string) {
    this._settings = { ...DEFAULT_SETTINGS }
    this._filePath = filePath
  }

  /**
   * Loads settings from disk using ToonStorage.
   *
   * Populates the internal _settings object with settings from the file.
   * If the file doesn't exist, uses default settings (no error).
   *
   * @returns Promise<void>
   */
  async load(): Promise<void> {
    try {
      const loadedSettings = await window.electron.loadSettings(this._filePath)
      this._settings = loadedSettings
      console.log('Settings loaded', this._filePath)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
        console.log('Settings file not found, using defaults', this._filePath)
        this._settings = { ...DEFAULT_SETTINGS }
      } else {
        console.error('Settings load failed', errorMessage)
        this._settings = { ...DEFAULT_SETTINGS }
      }
    }
  }

  /**
   * Saves settings to disk using ToonStorage (fire-and-forget pattern).
   *
   * Catches all errors internally and logs them without throwing.
   * This ensures save failures don't block UI or crash the app.
   *
   * @returns Promise<void> (never throws)
   */
  async save(): Promise<void> {
    try {
      await window.electron.saveSettings(this._filePath, this._settings)
      console.log('Settings saved', this._filePath)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Settings save failed', errorMessage)
      // No throw - fire-and-forget pattern
    }
  }

  /**
   * Gets the currently active project ID.
   *
   * @returns The active project ID, or empty string if not set
   */
  getActiveProjectId = (): string => {
    return this._settings.activeProjectId || ''
  }

  /**
   * Sets the active project ID and triggers auto-save.
   *
   * @param projectId - The project ID to set as active
   */
  setActiveProject = (projectId: string): void => {
    this._settings.activeProjectId = projectId
    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()
  }

  /**
   * Gets the current window bounds.
   *
   * @returns The window bounds object with x, y, width, height
   */
  getWindowBounds = (): WindowBounds => {
    return this._settings.windowBounds
  }

  /**
   * Sets the window bounds and triggers auto-save.
   *
   * @param bounds - The window bounds to save
   */
  setWindowBounds = (bounds: WindowBounds): void => {
    this._settings.windowBounds = bounds
    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()
  }
}
