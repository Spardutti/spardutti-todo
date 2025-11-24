import { describe, it, expect, vi, beforeEach } from 'vitest'
import KeyboardManager from './KeyboardManager'

describe('KeyboardManager', () => {
  let km: KeyboardManager

  beforeEach(() => {
    km = new KeyboardManager()
  })

  describe('Class Structure', () => {
    it('should instantiate successfully', () => {
      expect(km).toBeInstanceOf(KeyboardManager)
    })

    it('should have all required methods', () => {
      expect(km.register).toBeDefined()
      expect(km.unregister).toBeDefined()
      expect(km.handle).toBeDefined()
      expect(km.getHints).toBeDefined()
    })
  })

  describe('register()', () => {
    it('should register a shortcut successfully', () => {
      const handler = vi.fn()
      expect(() => {
        km.register('enter', handler, 'Save todo')
      }).not.toThrow()
    })

    it('should normalize keys to lowercase', () => {
      const handler = vi.fn()
      km.register('Enter', handler, 'Save')

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should throw error on duplicate registration (conflict detection)', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      km.register('enter', handler1, 'Action 1')

      expect(() => {
        km.register('enter', handler2, 'Action 2')
      }).toThrow("Shortcut 'enter' already registered")
    })

    it('should detect conflicts for normalized keys', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      km.register('Enter', handler1, 'Action 1')

      expect(() => {
        km.register('ENTER', handler2, 'Action 2')
      }).toThrow("Shortcut 'enter' already registered")
    })

    it('should store handler with description', () => {
      const handler = vi.fn()
      km.register('j', handler, 'Next todo')

      const hints = km.getHints()
      expect(hints).toContain('Next todo')
    })

    it('should handle modifier keys (ctrl+d)', () => {
      const handler = vi.fn()
      km.register('ctrl+d', handler, 'Delete all')

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true
      })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Key Normalization', () => {
    it('should normalize "Enter" → "enter"', () => {
      const handler = vi.fn()
      km.register('enter', handler, 'Save')

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should normalize "KeyJ" → "j"', () => {
      const handler = vi.fn()
      km.register('j', handler, 'Next')

      const event = new KeyboardEvent('keydown', { key: 'KeyJ' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should normalize " " (space) → "space"', () => {
      const handler = vi.fn()
      km.register('space', handler, 'Toggle')

      const event = new KeyboardEvent('keydown', { key: ' ' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should normalize "ArrowDown" → "arrowdown"', () => {
      const handler = vi.fn()
      km.register('arrowdown', handler, 'Next item')

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should normalize "ArrowUp" → "arrowup"', () => {
      const handler = vi.fn()
      km.register('arrowup', handler, 'Previous item')

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle ctrl modifier', () => {
      const handler = vi.fn()
      km.register('ctrl+d', handler, 'Delete')

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true
      })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple modifiers (ctrl+shift+d)', () => {
      const handler = vi.fn()
      km.register('ctrl+shift+d', handler, 'Action')

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
        shiftKey: true
      })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should ignore modifier-only keys (Shift alone)', () => {
      const handler = vi.fn()
      km.register('shift', handler, 'Should not register')

      const event = new KeyboardEvent('keydown', { key: 'Shift' })
      const handled = km.handle(event)

      expect(handled).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should ignore modifier-only keys (Control alone)', () => {
      const handler = vi.fn()

      const event = new KeyboardEvent('keydown', { key: 'Control' })
      const handled = km.handle(event)

      expect(handled).toBe(false)
    })

    it('should ignore modifier-only keys (Alt alone)', () => {
      const event = new KeyboardEvent('keydown', { key: 'Alt' })
      const handled = km.handle(event)

      expect(handled).toBe(false)
    })
  })

  describe('handle()', () => {
    it('should call the registered handler for matching event', () => {
      const handler = vi.fn()
      km.register('j', handler, 'Next')

      const event = new KeyboardEvent('keydown', { key: 'j' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should return true for handled event', () => {
      const handler = vi.fn()
      km.register('enter', handler, 'Save')

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const handled = km.handle(event)

      expect(handled).toBe(true)
    })

    it('should return false for unhandled event', () => {
      const event = new KeyboardEvent('keydown', { key: 'z' })
      const handled = km.handle(event)

      expect(handled).toBe(false)
    })

    it('should call preventDefault() for handled keys', () => {
      const handler = vi.fn()
      km.register('space', handler, 'Toggle')

      const event = new KeyboardEvent('keydown', { key: ' ' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      km.handle(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should call stopPropagation() for handled keys', () => {
      const handler = vi.fn()
      km.register('enter', handler, 'Save')

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      km.handle(event)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it('should NOT call preventDefault() for unhandled keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'x' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      km.handle(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it('should handle multiple different shortcuts', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      km.register('j', handler1, 'Next')
      km.register('k', handler2, 'Previous')
      km.register('space', handler3, 'Toggle')

      km.handle(new KeyboardEvent('keydown', { key: 'j' }))
      km.handle(new KeyboardEvent('keydown', { key: 'k' }))
      km.handle(new KeyboardEvent('keydown', { key: ' ' }))

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })
  })

  describe('unregister()', () => {
    it('should remove a registered shortcut', () => {
      const handler = vi.fn()
      km.register('j', handler, 'Next')

      km.unregister('j')

      const event = new KeyboardEvent('keydown', { key: 'j' })
      km.handle(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should not throw error for non-existent key (idempotent)', () => {
      expect(() => {
        km.unregister('nonexistent')
      }).not.toThrow()
    })

    it('should normalize key before unregistering', () => {
      const handler = vi.fn()
      km.register('enter', handler, 'Save')

      km.unregister('ENTER') // Different case

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      km.handle(event)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('getHints()', () => {
    it('should return empty string when no shortcuts registered', () => {
      const hints = km.getHints()
      expect(hints).toBe('')
    })

    it('should return formatted hints for single shortcut', () => {
      km.register('enter', vi.fn(), 'Save todo')

      const hints = km.getHints()
      expect(hints).toBe('Enter: Save todo')
    })

    it('should return formatted hints for multiple shortcuts with pipe separator', () => {
      km.register('enter', vi.fn(), 'Save')
      km.register('space', vi.fn(), 'Toggle')
      km.register('ctrl+d', vi.fn(), 'Delete all')

      const hints = km.getHints()

      expect(hints).toContain('Enter: Save')
      expect(hints).toContain('Space: Toggle')
      expect(hints).toContain('Ctrl+D: Delete all')
      expect(hints).toMatch(/\|/) // Contains pipe separator
    })

    it('should format hints as "Key: Description | Key: Description"', () => {
      km.register('j', vi.fn(), 'Next')
      km.register('k', vi.fn(), 'Previous')

      const hints = km.getHints()

      // Verify format structure (Key: Description | Key: Description)
      expect(hints).toMatch(/^.+: .+ \| .+: .+$/)
      // Verify keys are capitalized and descriptions follow
      expect(hints).toContain('J: Next')
      expect(hints).toContain('K: Previous')
    })

    it('should include all registered shortcuts in hints', () => {
      km.register('enter', vi.fn(), 'Save')
      km.register('space', vi.fn(), 'Toggle')
      km.register('j', vi.fn(), 'Next')
      km.register('k', vi.fn(), 'Previous')
      km.register('ctrl+d', vi.fn(), 'Delete')

      const hints = km.getHints()

      expect(hints).toContain('Save')
      expect(hints).toContain('Toggle')
      expect(hints).toContain('Next')
      expect(hints).toContain('Previous')
      expect(hints).toContain('Delete')
    })

    it('should update hints after unregistering', () => {
      km.register('enter', vi.fn(), 'Save')
      km.register('space', vi.fn(), 'Toggle')

      km.unregister('space')

      const hints = km.getHints()

      expect(hints).toContain('Save')
      expect(hints).not.toContain('Toggle')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string key gracefully', () => {
      const handler = vi.fn()
      km.register('', handler, 'Empty')

      const hints = km.getHints()
      expect(hints).toContain('Empty')
    })

    it('should handle rapid repeated keypresses', () => {
      const handler = vi.fn()
      km.register('j', handler, 'Next')

      for (let i = 0; i < 50; i++) {
        km.handle(new KeyboardEvent('keydown', { key: 'j' }))
      }

      expect(handler).toHaveBeenCalledTimes(50)
    })

    it('should handle case-insensitive key registration', () => {
      const handler = vi.fn()
      km.register('EnTeR', handler, 'Save')

      const event = new KeyboardEvent('keydown', { key: 'enter' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle whitespace in key strings', () => {
      const handler = vi.fn()
      km.register('  enter  ', handler, 'Save')

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      km.handle(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should maintain separate handlers for different modifiers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      km.register('d', handler1, 'Delete single')
      km.register('ctrl+d', handler2, 'Delete all')

      km.handle(new KeyboardEvent('keydown', { key: 'd' }))
      km.handle(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }))

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })
})
