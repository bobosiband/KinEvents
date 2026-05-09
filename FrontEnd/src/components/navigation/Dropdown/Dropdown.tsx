import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Dropdown.module.css'

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  className?: string
  align?: 'left' | 'right'
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  { trigger, items, className, align = 'right' },
  ref
) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const menuId = useId()
  const enabledItems = useMemo(
    () => items.map((item, index) => ({ ...item, originalIndex: index })).filter((item) => !item.disabled),
    [items]
  )

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 8
    const menuWidth = 220

    const left =
      align === 'left'
        ? rect.left + window.scrollX
        : rect.right + window.scrollX - menuWidth

    setPosition({
      top: rect.bottom + window.scrollY + gap,
      left: Math.max(8, left),
    })
  }, [align])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  const openMenu = useCallback(() => {
    updatePosition()
    setIsOpen(true)

    const firstEnabledIndex = items.findIndex((item) => !item.disabled)
    setActiveIndex(firstEnabledIndex)
  }, [items, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }

      closeMenu()
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
        triggerRef.current?.focus()
      }
    }

    const handleWindowChange = () => updatePosition()

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', handleWindowChange, true)
    }
  }, [closeMenu, isOpen, updatePosition])

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isOpen) {
        openMenu()
      }
    }
  }

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen || enabledItems.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()

      const currentEnabled = enabledItems.findIndex((item) => item.originalIndex === activeIndex)
      const nextEnabled = (currentEnabled + 1) % enabledItems.length
      setActiveIndex(enabledItems[nextEnabled].originalIndex)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      const currentEnabled = enabledItems.findIndex((item) => item.originalIndex === activeIndex)
      const nextEnabled =
        currentEnabled <= 0 ? enabledItems.length - 1 : currentEnabled - 1
      setActiveIndex(enabledItems[nextEnabled].originalIndex)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()

      const current = items[activeIndex]
      if (!current || current.disabled) return

      current.onSelect?.()
      closeMenu()
      triggerRef.current?.focus()
      return
    }

    if (event.key === 'Tab') {
      closeMenu()
    }
  }

  const rootClasses = [styles.root, className || ''].filter(Boolean).join(' ')

  return (
    <div ref={ref} className={rootClasses}>
      <div ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onClick={() => (isOpen ? closeMenu() : openMenu())}
          onKeyDown={onTriggerKeyDown}
        >
          {trigger}
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            className={styles.menu}
            style={{ top: position.top, left: position.left }}
            onKeyDown={onMenuKeyDown}
          >
            {items.map((item, index) => {
              const itemClasses = [
                styles.item,
                index === activeIndex ? styles.active : '',
                item.danger ? styles.danger : '',
                item.disabled ? styles.disabled : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={itemClasses}
                  disabled={item.disabled}
                  onMouseEnter={() => !item.disabled && setActiveIndex(index)}
                  onClick={() => {
                    if (item.disabled) return

                    item.onSelect?.()
                    closeMenu()
                    triggerRef.current?.focus()
                  }}
                >
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  <span className={styles.label}>{item.label}</span>
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
})

Dropdown.displayName = 'Dropdown'

export default Dropdown
