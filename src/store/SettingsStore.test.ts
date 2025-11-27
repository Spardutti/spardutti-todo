import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SettingsStore } from './SettingsStore'
import type { AppSettings } from '@/types/Settings'

// Mock window.electron
global.window = {
  electron: {
    getTodosPath: vi.fn(),
    loadTodos: vi.fn(),
    saveTodos: vi.fn(),
    getAppVersion: vi.fn(),
    loadProjects: vi.fn(),
    saveProjects: vi.fn(),
    deleteTodosFile: vi.fn(),
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
  },
} as any

describe('SettingsStore', () => {
  let store: SettingsStore
  const mockFilePath = '/mock/settings.toon'

  beforeEach(() => {
    vi.clearAllMocks()
    store = new SettingsStore(mockFilePath)
  })

  describe('constructor', () => {
    it('should initialize with default settings', () => {
      const testStore = new SettingsStore('/test/path.toon')
      expect(testStore.getActiveProjectId()).toBe('')
      expect(testStore.getWindowBounds()).toEqual({
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      })
    })
  })

  describe('default settings values', () => {
    it('should have correct default activeProjectId (empty string)', () => {
      expect(store.getActiveProjectId()).toBe('')
    })

    it('should have correct default windowBounds', () => {
      expect(store.getWindowBounds()).toEqual({
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      })
    })
  })

  describe('load()', () => {
    it('should populate settings from loaded data', async () => {
      const mockSettings: AppSettings = {
        activeProjectId: 'test-project-id',
        windowBounds: { x: 200, y: 150, width: 800, height: 600 },
        version: '1.0',
      }

      vi.mocked(window.electron.loadSettings).mockResolvedValue(mockSettings)

      await store.load()

      expect(window.electron.loadSettings).toHaveBeenCalledWith(mockFilePath)
      expect(store.getActiveProjectId()).toBe('test-project-id')
      expect(store.getWindowBounds()).toEqual({
        x: 200,
        y: 150,
        width: 800,
        height: 600,
      })
    })

    it('should return default settings when file does not exist (ENOENT)', async () => {
      const mockError = new Error('ENOENT: no such file or directory')
      vi.mocked(window.electron.loadSettings).mockRejectedValue(mockError)

      await store.load()

      expect(store.getActiveProjectId()).toBe('')
      expect(store.getWindowBounds()).toEqual({
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      })
    })

    it('should return default settings when file does not exist (no such file message)', async () => {
      const mockError = new Error('no such file')
      vi.mocked(window.electron.loadSettings).mockRejectedValue(mockError)

      await store.load()

      expect(store.getActiveProjectId()).toBe('')
      expect(store.getWindowBounds()).toEqual({
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      })
    })

    it('should return default settings on other load errors', async () => {
      const mockError = new Error('Invalid format')
      vi.mocked(window.electron.loadSettings).mockRejectedValue(mockError)

      await store.load()

      expect(store.getActiveProjectId()).toBe('')
      expect(store.getWindowBounds()).toEqual({
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      })
    })
  })

  describe('save()', () => {
    it('should save settings to window.electron.saveSettings', async () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()

      await store.save()

      expect(window.electron.saveSettings).toHaveBeenCalledWith(
        mockFilePath,
        expect.objectContaining({
          activeProjectId: '',
          windowBounds: { x: 100, y: 100, width: 600, height: 400 },
          version: '1.0',
        })
      )
    })

    it('should not throw on save error (fire-and-forget pattern)', async () => {
      const mockError = new Error('Disk full')
      vi.mocked(window.electron.saveSettings).mockRejectedValue(mockError)

      await expect(store.save()).resolves.toBeUndefined()
    })

    it('should log errors when save fails', async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Write permission denied')
      vi.mocked(window.electron.saveSettings).mockRejectedValue(mockError)

      await store.save()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Settings save failed',
        'Write permission denied'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getActiveProjectId()', () => {
    it('should return current active project ID', async () => {
      const mockSettings: AppSettings = {
        activeProjectId: 'my-project-123',
        windowBounds: { x: 0, y: 0, width: 800, height: 600 },
        version: '1.0',
      }

      vi.mocked(window.electron.loadSettings).mockResolvedValue(mockSettings)

      await store.load()

      expect(store.getActiveProjectId()).toBe('my-project-123')
    })

    it('should return empty string when activeProjectId is not set', () => {
      expect(store.getActiveProjectId()).toBe('')
    })

    it('should return empty string when activeProjectId is undefined', async () => {
      const mockSettings = {
        windowBounds: { x: 0, y: 0, width: 800, height: 600 },
        version: '1.0',
      } as unknown as AppSettings

      vi.mocked(window.electron.loadSettings).mockResolvedValue(mockSettings)

      await store.load()

      expect(store.getActiveProjectId()).toBe('')
    })
  })

  describe('setActiveProject()', () => {
    it('should update activeProjectId value', () => {
      store.setActiveProject('new-project-id')

      expect(store.getActiveProjectId()).toBe('new-project-id')
    })

    it('should trigger save (fire-and-forget)', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')

      store.setActiveProject('another-project')

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should return immediately without waiting for save', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()

      store.setActiveProject('quick-project')

      expect(store.getActiveProjectId()).toBe('quick-project')
    })

    it('should allow setting empty string', () => {
      store.setActiveProject('some-project')
      store.setActiveProject('')

      expect(store.getActiveProjectId()).toBe('')
    })
  })

  describe('getWindowBounds()', () => {
    it('should return current windowBounds object', async () => {
      const mockSettings: AppSettings = {
        activeProjectId: '',
        windowBounds: { x: 300, y: 200, width: 1024, height: 768 },
        version: '1.0',
      }

      vi.mocked(window.electron.loadSettings).mockResolvedValue(mockSettings)

      await store.load()

      expect(store.getWindowBounds()).toEqual({
        x: 300,
        y: 200,
        width: 1024,
        height: 768,
      })
    })

    it('should return default bounds after initialization', () => {
      expect(store.getWindowBounds()).toEqual({
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      })
    })
  })

  describe('setWindowBounds()', () => {
    it('should update windowBounds value', () => {
      const newBounds = { x: 50, y: 75, width: 1200, height: 900 }

      store.setWindowBounds(newBounds)

      expect(store.getWindowBounds()).toEqual(newBounds)
    })

    it('should trigger save (fire-and-forget)', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')

      store.setWindowBounds({ x: 0, y: 0, width: 500, height: 300 })

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should return immediately without waiting for save', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()

      const bounds = { x: 10, y: 20, width: 800, height: 600 }
      store.setWindowBounds(bounds)

      expect(store.getWindowBounds()).toEqual(bounds)
    })
  })

  describe('auto-save integration', () => {
    it('should call save() after setActiveProject()', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')

      store.setActiveProject('test-id')

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should call save() after setWindowBounds()', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')

      store.setWindowBounds({ x: 0, y: 0, width: 800, height: 600 })

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should not await save in setActiveProject() (fire-and-forget)', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()

      store.setActiveProject('fast-project')

      expect(store.getActiveProjectId()).toBe('fast-project')
    })

    it('should not await save in setWindowBounds() (fire-and-forget)', () => {
      vi.mocked(window.electron.saveSettings).mockResolvedValue()

      const bounds = { x: 100, y: 100, width: 700, height: 500 }
      store.setWindowBounds(bounds)

      expect(store.getWindowBounds()).toEqual(bounds)
    })
  })
})
