import React from 'react'
import styles from './Pagination.module.css'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisible?: number
  className?: string
}

/**
 * Pagination Component
 * 
 * Navigate between pages of content with previous/next buttons
 * and page number shortcuts.
 * 
 * @example
 * <Pagination 
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 * />
 */
export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  function Pagination({ currentPage, totalPages, onPageChange, maxVisible = 5, className }, ref) {
    const getPageNumbers = () => {
      const pages: (number | string)[] = []
      const halfVisible = Math.floor(maxVisible / 2)

      let startPage = Math.max(1, currentPage - halfVisible)
      let endPage = Math.min(totalPages, currentPage + halfVisible)

      if (endPage - startPage + 1 < maxVisible) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisible - 1)
        } else {
          startPage = Math.max(1, endPage - maxVisible + 1)
        }
      }

      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }

      return pages
    }

    const pages = getPageNumbers()
    const canGoPrevious = currentPage > 1
    const canGoNext = currentPage < totalPages

    return (
      <nav ref={ref} className={`${styles.pagination} ${className || ''}`} aria-label="Pagination">
        <button
          className={`${styles.button} ${styles.prev} ${!canGoPrevious ? styles.disabled : ''}`}
          onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Previous page"
        >
          ←
        </button>

        <div className={styles.pages}>
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                  ...
                </span>
              )
            }

            const isActive = page === currentPage

            return (
              <button
                key={page}
                className={`${styles.pageButton} ${isActive ? styles.active : ''}`}
                onClick={() => onPageChange(page as number)}
                aria-label={`Page ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          className={`${styles.button} ${styles.next} ${!canGoNext ? styles.disabled : ''}`}
          onClick={() => canGoNext && onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Next page"
        >
          →
        </button>
      </nav>
    )
  }
)

Pagination.displayName = 'Pagination'

export default Pagination
