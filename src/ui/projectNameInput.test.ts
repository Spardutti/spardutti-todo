import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { showProjectNameInput, hideProjectNameInput, showCreateProjectInput, showRenameProjectInput } from './projectNameInput'

describe('projectNameInput', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    hideProjectNameInput()
  })

  describe('showProjectNameInput()', () => {
    it('should create overlay and input box', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const overlay = document.querySelector('.project-name-input-overlay')
      const box = document.querySelector('.project-name-input-box')

      expect(overlay).toBeTruthy()
      expect(box).toBeTruthy()
    })

    it('should create label with placeholder text', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({
        placeholder: 'Test Placeholder',
        onConfirm,
        onCancel
      })

      const label = document.querySelector('.project-name-input-label')
      expect(label?.textContent).toBe('Test Placeholder')
    })

    it('should create input field with placeholder', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({
        placeholder: 'Enter name',
        onConfirm,
        onCancel
      })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      expect(input).toBeTruthy()
      expect(input?.placeholder).toBe('Enter name')
    })

    it('should set initial value if provided', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({
        initialValue: 'Initial Value',
        onConfirm,
        onCancel
      })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      expect(input?.value).toBe('Initial Value')
    })

    it('should create hint text', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const hint = document.querySelector('.project-name-input-hint')
      expect(hint?.textContent).toBe('Enter: Confirm | Esc: Cancel')
    })

    it('should focus the input field', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      expect(document.activeElement).toBe(input)
    })

    it('should prevent multiple inputs at once', () => {
      const onConfirm1 = vi.fn()
      const onCancel1 = vi.fn()
      const onConfirm2 = vi.fn()
      const onCancel2 = vi.fn()

      showProjectNameInput({ onConfirm: onConfirm1, onCancel: onCancel1 })
      showProjectNameInput({ onConfirm: onConfirm2, onCancel: onCancel2 })

      const overlays = document.querySelectorAll('.project-name-input-overlay')
      expect(overlays.length).toBe(1)
    })
  })

  describe('Enter key handling', () => {
    it('should call onConfirm with trimmed value when Enter pressed with valid input', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = '  My Project  '

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(onConfirm).toHaveBeenCalledWith('My Project')
    })

    it('should hide overlay after Enter with valid input', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = 'Valid Name'

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      const overlay = document.querySelector('.project-name-input-overlay')
      expect(overlay).toBeFalsy()
    })

    it('should NOT call onConfirm when Enter pressed with empty input', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = ''

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should NOT call onConfirm when Enter pressed with whitespace-only input', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = '   '

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should show error styling when Enter pressed with empty input', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      const label = document.querySelector('.project-name-input-label') as HTMLElement
      input.value = ''

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(input.classList.contains('project-name-input-field--error')).toBe(true)
      expect(label.classList.contains('project-name-input-label--error')).toBe(true)
      expect(label.textContent).toBe('Name cannot be empty')
    })

    it('should keep overlay visible when Enter pressed with empty input', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = ''

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      const overlay = document.querySelector('.project-name-input-overlay')
      expect(overlay).toBeTruthy()
    })
  })

  describe('Escape key handling', () => {
    it('should call onCancel when Escape pressed', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      input.dispatchEvent(escEvent)

      expect(onCancel).toHaveBeenCalled()
    })

    it('should hide overlay when Escape pressed', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      input.dispatchEvent(escEvent)

      const overlay = document.querySelector('.project-name-input-overlay')
      expect(overlay).toBeFalsy()
    })

    it('should NOT call onConfirm when Escape pressed', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = 'Some Value'

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      input.dispatchEvent(escEvent)

      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('hideProjectNameInput()', () => {
    it('should remove overlay from DOM', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showProjectNameInput({ onConfirm, onCancel })

      let overlay = document.querySelector('.project-name-input-overlay')
      expect(overlay).toBeTruthy()

      hideProjectNameInput()

      overlay = document.querySelector('.project-name-input-overlay')
      expect(overlay).toBeFalsy()
    })

    it('should handle being called when no input is active', () => {
      expect(() => {
        hideProjectNameInput()
      }).not.toThrow()
    })
  })

  describe('showCreateProjectInput()', () => {
    it('should show input with "New project name" placeholder', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showCreateProjectInput(onConfirm, onCancel)

      const label = document.querySelector('.project-name-input-label')
      expect(label?.textContent).toBe('New project name')
    })

    it('should call onConfirm with project name on Enter', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showCreateProjectInput(onConfirm, onCancel)

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = 'New Project'

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(onConfirm).toHaveBeenCalledWith('New Project')
    })
  })

  describe('showRenameProjectInput()', () => {
    it('should show input with "Rename project" placeholder', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showRenameProjectInput('Old Name', onConfirm, onCancel)

      const label = document.querySelector('.project-name-input-label')
      expect(label?.textContent).toBe('Rename project')
    })

    it('should pre-fill with current project name', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showRenameProjectInput('Current Name', onConfirm, onCancel)

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      expect(input?.value).toBe('Current Name')
    })

    it('should call onConfirm with new name on Enter', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      showRenameProjectInput('Old Name', onConfirm, onCancel)

      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = 'New Name'

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(onConfirm).toHaveBeenCalledWith('New Name')
    })
  })
})
