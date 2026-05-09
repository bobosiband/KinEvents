import React, { useState, useRef } from 'react'

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
    <span className="relative inline-flex" onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave}>
      {children}
      <span className={[
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity duration-200',
        position === 'top' ? 'bottom-full left-1/2 mb-2 -translate-x-1/2' : '',
        position === 'bottom' ? 'left-1/2 top-full mt-2 -translate-x-1/2' : '',
        position === 'left' ? 'right-full top-1/2 mr-2 -translate-y-1/2' : '',
        position === 'right' ? 'left-full top-1/2 ml-2 -translate-y-1/2' : '',
        visible ? 'opacity-100' : 'opacity-0',
      ].filter(Boolean).join(' ')} role="tooltip">
        {content}
      </span>
    </span>
  )
}

export default Tooltip
