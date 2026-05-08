import { Button } from '@/components/ui/Button'
import styles from './DataTable.module.css'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => string
}

interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  tone?: 'primary' | 'danger'
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage: string
  actions?: RowAction<T>[]
}

function valueFor<T>(row: T, column: Column<T>): string {
  if (column.render) return column.render(row)
  const value = row[column.key as keyof T]
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : ''
}

export function DataTable<T extends { id: string }>({ columns, data, loading = false, emptyMessage, actions = [] }: DataTableProps<T>) {
  if (loading) {
    return <div className={styles.skeleton} aria-label="Loading table" />
  }

  if (data.length === 0) return <p className={styles.empty}>{emptyMessage}</p>

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead><tr>{columns.map(column => <th key={String(column.key)}>{column.header}</th>)}<th>Actions</th></tr></thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              {columns.map(column => <td key={String(column.key)} data-label={column.header}>{valueFor(row, column)}</td>)}
              <td data-label="Actions">
                <div className={styles.actions}>
                  {actions.map(action => (
                    <Button key={action.label} type="button" size="sm" variant={action.tone === 'danger' ? 'danger' : 'secondary'} onClick={() => action.onClick(row)}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>Showing {data.length} rows</div>
    </div>
  )
}
