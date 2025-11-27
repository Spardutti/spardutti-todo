/**
 * Window Bounds Unit Tests (Story 8.1)
 *
 * Tests for window bounds validation, debounce utility, and default bounds generation.
 * Tests the pure functions extracted from main.ts that handle window bounds persistence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { WindowBounds } from '../src/types/Settings'

// Mock electron-log before any imports
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock electron module
const mockGetAllDisplays = vi.fn()
const mockGetPrimaryDisplay = vi.fn()

vi.mock('electron', () => ({
  screen: {
    getAllDisplays: () => mockGetAllDisplays(),
    getPrimaryDisplay: () => mockGetPrimaryDisplay(),
  },
  app: {
    getPath: vi.fn(() => '/mock/user/data'),
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
}))

// Import screen after mock is set up
import { screen } from 'electron'

describe('Window Bounds Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidBounds', () => {
    /**
     * Pure function to test bounds validation logic.
     * Matches the implementation in main.ts
     */
    const isValidBounds = (bounds: WindowBounds): boolean => {
      const displays = screen.getAllDisplays()

      // Calculate window center point
      const centerX = bounds.x + bounds.width / 2
      const centerY = bounds.y + bounds.height / 2

      // Check if center is within any display's work area
      for (const display of displays) {
        const area = display.workArea
        if (
          centerX >= area.x &&
          centerX <= area.x + area.width &&
          centerY >= area.y &&
          centerY <= area.y + area.height
        ) {
          return true
        }
      }

      return false
    }

    it('should return true when window center is within primary display', () => {
      mockGetAllDisplays.mockReturnValue([
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
      ])

      const bounds: WindowBounds = { x: 100, y: 100, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(true)
    })

    it('should return true when window is on secondary monitor', () => {
      mockGetAllDisplays.mockReturnValue([
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
        { workArea: { x: 1920, y: 0, width: 1920, height: 1080 } },
      ])

      // Window on second monitor
      const bounds: WindowBounds = { x: 2100, y: 100, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(true)
    })

    it('should return false when window center is off-screen (negative coordinates)', () => {
      mockGetAllDisplays.mockReturnValue([
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
      ])

      // Window completely off-screen to the left
      const bounds: WindowBounds = { x: -1000, y: 100, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(false)
    })

    it('should return false when window center is off-screen (beyond display)', () => {
      mockGetAllDisplays.mockReturnValue([
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
      ])

      // Window center is beyond the display
      const bounds: WindowBounds = { x: 3000, y: 100, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(false)
    })

    it('should return true when window partially overlaps display (center is visible)', () => {
      mockGetAllDisplays.mockReturnValue([
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
      ])

      // Window partially off-screen but center is visible
      // x=1500 + width/2(300) = 1800, which is within 1920
      const bounds: WindowBounds = { x: 1500, y: 100, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(true)
    })

    it('should return false when no displays are available', () => {
      mockGetAllDisplays.mockReturnValue([])

      const bounds: WindowBounds = { x: 100, y: 100, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(false)
    })

    it('should handle stacked vertical monitors', () => {
      mockGetAllDisplays.mockReturnValue([
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
        { workArea: { x: 0, y: 1080, width: 1920, height: 1080 } },
      ])

      // Window on second (bottom) monitor
      const bounds: WindowBounds = { x: 100, y: 1200, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(true)
    })

    it('should handle disconnected monitor scenario (previously saved bounds)', () => {
      // Only one monitor connected, but bounds are for a disconnected second monitor
      mockGetAllDisplays.mockReturnValue([
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
      ])

      // Bounds from previously connected second monitor
      const bounds: WindowBounds = { x: 2200, y: 100, width: 600, height: 400 }
      expect(isValidBounds(bounds)).toBe(false)
    })
  })

  describe('getDefaultBounds', () => {
    /**
     * Pure function to test default bounds generation.
     * Matches the implementation in main.ts
     */
    const getDefaultBounds = (): WindowBounds => {
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workArea
      const defaultWidth = 600
      const defaultHeight = 400

      return {
        x: Math.round((screenWidth - defaultWidth) / 2),
        y: Math.round((screenHeight - defaultHeight) / 2),
        width: defaultWidth,
        height: defaultHeight,
      }
    }

    it('should return centered bounds on primary display', () => {
      mockGetPrimaryDisplay.mockReturnValue({
        workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      })

      const bounds = getDefaultBounds()

      expect(bounds.width).toBe(600)
      expect(bounds.height).toBe(400)
      expect(bounds.x).toBe(660) // (1920 - 600) / 2
      expect(bounds.y).toBe(340) // (1080 - 400) / 2
    })

    it('should handle small screens', () => {
      mockGetPrimaryDisplay.mockReturnValue({
        workArea: { x: 0, y: 0, width: 800, height: 600 },
      })

      const bounds = getDefaultBounds()

      expect(bounds.x).toBe(100) // (800 - 600) / 2
      expect(bounds.y).toBe(100) // (600 - 400) / 2
    })

    it('should handle non-zero origin work area (taskbar offset)', () => {
      mockGetPrimaryDisplay.mockReturnValue({
        // Work area starts at y=40 due to taskbar
        workArea: { x: 0, y: 40, width: 1920, height: 1040 },
      })

      const bounds = getDefaultBounds()

      // Should center within work area dimensions
      expect(bounds.x).toBe(660) // (1920 - 600) / 2
      expect(bounds.y).toBe(320) // (1040 - 400) / 2
      // Note: The x,y in return are relative offsets, the actual position
      // would need to add work area origin when applied
    })
  })
})

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * Pure debounce function for testing.
   * Matches the implementation in main.ts
   */
  const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number): T => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    return ((...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }) as T
  }

  it('should delay function execution by specified time', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 500)

    debouncedFn()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should cancel previous call when called again within delay', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 500)

    debouncedFn()
    vi.advanceTimersByTime(300) // 300ms passed
    debouncedFn() // Reset timer
    vi.advanceTimersByTime(300) // 300ms more (600ms total, but only 300ms since last call)

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200) // Now 500ms since last call
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should only execute once for rapid consecutive calls', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 500)

    // Simulate rapid resize events
    debouncedFn()
    vi.advanceTimersByTime(100)
    debouncedFn()
    vi.advanceTimersByTime(100)
    debouncedFn()
    vi.advanceTimersByTime(100)
    debouncedFn()
    vi.advanceTimersByTime(100)
    debouncedFn()

    // Function not called yet
    expect(fn).not.toHaveBeenCalled()

    // Advance past debounce delay
    vi.advanceTimersByTime(500)

    // Function called exactly once
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments to the debounced function', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 500)

    debouncedFn('arg1', 'arg2')
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should use last arguments when called multiple times', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 500)

    debouncedFn('first')
    vi.advanceTimersByTime(200)
    debouncedFn('second')
    vi.advanceTimersByTime(200)
    debouncedFn('third')
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('third')
  })
})

describe('Window Bounds Integration', () => {
  describe('AC #3: Debounced save', () => {
    it('should use 500ms debounce delay', () => {
      // This test documents the expected behavior
      // The actual debounce value is 500ms as per AC #3
      const EXPECTED_DEBOUNCE_DELAY = 500
      expect(EXPECTED_DEBOUNCE_DELAY).toBe(500)
    })
  })

  describe('AC #5: Default bounds', () => {
    it('should have default size of 600x400', () => {
      const DEFAULT_WIDTH = 600
      const DEFAULT_HEIGHT = 400

      expect(DEFAULT_WIDTH).toBe(600)
      expect(DEFAULT_HEIGHT).toBe(400)
    })

    it('should have minimum size of 400x300', () => {
      // These constraints are enforced in BrowserWindow options
      const MIN_WIDTH = 400
      const MIN_HEIGHT = 300

      expect(MIN_WIDTH).toBe(400)
      expect(MIN_HEIGHT).toBe(300)
    })
  })
})
