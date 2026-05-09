import React from 'react'
import styles from './EmptyState.module.css'
import { Button } from '../Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  return (
    <div className={styles.empty} role="status">
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      <div className={styles.title}>{title}</div>
      {message ? <div className={styles.message}>{message}</div> : null}
      <div className={styles.action}>{action}</div>
    </div>
  )
}

export default EmptyState
