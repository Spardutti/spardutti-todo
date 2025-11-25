import { describe, it, expect } from 'vitest'
import type { AppSettings, WindowBounds } from '@/types/Settings'

describe('WindowBounds interface', () => {
  describe('type exports', () => {
    it('should allow creating a valid WindowBounds object', () => {
      const bounds: WindowBounds = {
        x: 100,
        y: 100,
        width: 600,
        height: 400,
      }

      expect(bounds.x).toBe(100)
      expect(bounds.y).toBe(100)
      expect(bounds.width).toBe(600)
      expect(bounds.height).toBe(400)
    })

    it('should have all required properties', () => {
      const bounds: WindowBounds = {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      }

      expect(bounds).toHaveProperty('x')
      expect(bounds).toHaveProperty('y')
      expect(bounds).toHaveProperty('width')
      expect(bounds).toHaveProperty('height')
    })
  })

  describe('interface shape', () => {
    it('should accept negative coordinates (for multi-monitor)', () => {
      const bounds: WindowBounds = {
        x: -1920,
        y: -100,
        width: 600,
        height: 400,
      }

      expect(bounds.x).toBe(-1920)
      expect(bounds.y).toBe(-100)
    })

    it('should accept zero values', () => {
      const bounds: WindowBounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }

      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(0)
      expect(bounds.height).toBe(0)
    })
  })
})

describe('AppSettings interface', () => {
  describe('type exports', () => {
    it('should allow creating a valid AppSettings object', () => {
      const settings: AppSettings = {
        activeProjectId: '550e8400-e29b-41d4-a716-446655440000',
        windowBounds: { x: 100, y: 100, width: 600, height: 400 },
        version: '1.0',
      }

      expect(settings.activeProjectId).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(settings.windowBounds).toEqual({ x: 100, y: 100, width: 600, height: 400 })
      expect(settings.version).toBe('1.0')
    })

    it('should have all required properties', () => {
      const settings: AppSettings = {
        activeProjectId: 'test-id',
        windowBounds: { x: 0, y: 0, width: 800, height: 600 },
        version: '1.0',
      }

      expect(settings).toHaveProperty('activeProjectId')
      expect(settings).toHaveProperty('windowBounds')
      expect(settings).toHaveProperty('version')
    })
  })

  describe('interface shape', () => {
    it('should nest WindowBounds correctly', () => {
      const settings: AppSettings = {
        activeProjectId: 'test-id',
        windowBounds: { x: 200, y: 150, width: 1024, height: 768 },
        version: '1.0',
      }

      expect(settings.windowBounds.x).toBe(200)
      expect(settings.windowBounds.y).toBe(150)
      expect(settings.windowBounds.width).toBe(1024)
      expect(settings.windowBounds.height).toBe(768)
    })

    it('should accept UUID v4 format for activeProjectId', () => {
      const settings: AppSettings = {
        activeProjectId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        windowBounds: { x: 0, y: 0, width: 600, height: 400 },
        version: '1.0',
      }

      expect(settings.activeProjectId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('should accept semantic version format for version', () => {
      const settings: AppSettings = {
        activeProjectId: 'test-id',
        windowBounds: { x: 0, y: 0, width: 600, height: 400 },
        version: '2.1.0',
      }

      expect(settings.version).toBe('2.1.0')
    })
  })
})
