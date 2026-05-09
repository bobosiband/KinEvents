import React, { useState, useRef } from 'react'
import styles from './Tooltip.module.css'

export interface TooltipProps {
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactElement
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position = 'top', children }) => {
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  function onEnter() {
    timer.current = window.setTimeout(() => setVisible(true), 300)
  }
  function onLeave() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setVisible(false)
  }

  return (
    <span className={styles.tooltipWrap} onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave}>
      {children}
      <span className={`${styles.tooltipBox} ${styles[position]} ${visible ? styles.visible : ''}`} role="tooltip">
        {content}
      </span>
    </span>
  )
}

export default Tooltip
