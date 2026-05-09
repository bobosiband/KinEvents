import { Button } from '@/components/ui/Button'

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
    return <div className="h-48 rounded-2xl bg-muted animate-pulse" aria-label="Loading table" />
  }

  if (data.length === 0) return <p className="py-8 text-sm text-muted-foreground">{emptyMessage}</p>

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-muted/60">
          <tr>
            {columns.map(column => <th key={String(column.key)} className="px-4 py-3 text-left text-sm font-semibold">{column.header}</th>)}
            <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map(row => (
            <tr key={row.id} className="align-top">
              {columns.map(column => <td key={String(column.key)} data-label={column.header} className="px-4 py-3 text-sm">{valueFor(row, column)}</td>)}
              <td data-label="Actions" className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
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
      <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border">Showing {data.length} rows</div>
    </div>
  )
}
