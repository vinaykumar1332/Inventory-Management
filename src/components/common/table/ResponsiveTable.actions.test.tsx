import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ResponsiveTable, type Column } from './ResponsiveTable'

interface Item {
  id: string
  name: string
  status: string
}

const rows: Item[] = [
  { id: '1', name: 'Cement', status: 'ok' },
  { id: '2', name: 'Sand', status: 'low' },
]

const columns: Column<Item>[] = [
  { key: 'name', header: 'Name', cell: (r) => r.name },
  { key: 'status', header: 'Status', cell: (r) => r.status, className: 'hidden 2xl:table-cell', hideOnMobile: true },
]

describe('ResponsiveTable row actions and row click', () => {
  it('runs the row action without also opening the row', () => {
    const onRowClick = vi.fn()
    const onEdit = vi.fn()
    render(
      <ResponsiveTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
        rowActions={(r) => (
          <button type="button" onClick={() => onEdit(r.id)}>
            Edit {r.name}
          </button>
        )}
      />,
    )
    const table = screen.getByRole('table')
    fireEvent.click(within(table).getByRole('button', { name: 'Edit Cement' }))
    expect(onEdit).toHaveBeenCalledWith('1')
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('opens the row when the row itself is clicked', () => {
    const onRowClick = vi.fn()
    render(<ResponsiveTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByRole('table').querySelectorAll('tbody tr')[1])
    expect(onRowClick).toHaveBeenCalledWith(rows[1])
  })

  it('applies a column class to its header and cells', () => {
    render(<ResponsiveTable columns={columns} rows={rows} rowKey={(r) => r.id} />)
    expect(screen.getByRole('columnheader', { name: 'Status' })).toHaveClass('hidden', '2xl:table-cell')
  })

  it('labels the actions column for screen readers', () => {
    render(<ResponsiveTable columns={columns} rows={rows} rowKey={(r) => r.id} rowActions={() => null} actionsLabel="Actions" />)
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
  })
})
