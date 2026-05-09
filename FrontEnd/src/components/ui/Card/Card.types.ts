import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   * @default 'elevated'
   */
  variant?: 'elevated' | 'flat' | 'interactive' | 'bordered'


  /**
   * Padding amount
   * @default 'medium'
   */
  padding?: 'small' | 'medium' | 'large'

  /**
   * Show hover effects
   * @default false
   */
  clickable?: boolean

  /**
   * If provided, renders as an anchor tag
   */
  href?: string

  /**
   * Custom className
   */
  className?: string

  /**
   * Card content
   */
  children: React.ReactNode
}
