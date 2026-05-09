import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';

  /**
   * Button size
   *
   * Supports both the existing design-system sizes
   * ('small' | 'medium' | 'large') and legacy aliases
   * ('sm' | 'md' | 'lg') used throughout the app.
   */
  size?: 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg';


  /**
   * Show loading state with spinner
   * @default false
   */
  isLoading?: boolean

  /**
   * Legacy loading alias used in older pages.
   * Prefer `isLoading`.
   */
  loading?: boolean


  /**
   * Icon element to display
   */
  icon?: React.ReactNode;

  /**
   * Position of icon relative to text
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';

  /**
   * Make button full width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Custom className for additional styling
   */
  className?: string;
}
