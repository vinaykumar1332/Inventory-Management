import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ResponsiveTable, type Column } from './ResponsiveTable'

interface Item {
  id: string
  name: string
  qty: number
}

const rows: Item[] = [
  { id: '1', name: 'Cement', qty: 40 },
  { id: '2', name: 'Bricks', qty: 900 },
  { id: '3', name: 'Sand', qty: 12 },
]

const columns: Column<Item>[] = [
  { key: 'name', header: 'Name', cell: (r) => r.name, sortValue: (r) => r.name },
  { key: 'qty', header: 'Qty', cell: (r) => r.qty, sortValue: (r) => r.qty, align: 'right' },
]

function bodyNames() {
  const table = screen.getByRole('table')
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)
}

describe('ResponsiveTable', () => {
  it('sorts by the first column ascending by default', () => {
    render(<ResponsiveTable columns={columns} rows={rows} rowKey={(r) => r.id} />)
    expect(bodyNames()).toEqual(['Bricks', 'Cement', 'Sand'])
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('reverses the order when a sortable header is clicked again', () => {
    render(<ResponsiveTable columns={columns} rows={rows} rowKey={(r) => r.id} />)
    const nameButton = within(screen.getByRole('columnheader', { name: /name/i })).getByRole('button')
    fireEvent.click(nameButton)
    expect(bodyNames()).toEqual(['Sand', 'Cement', 'Bricks'])
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'descending')
  })

  it('sorts numeric columns by value, not text', () => {
    render(<ResponsiveTable columns={columns} rows={rows} rowKey={(r) => r.id} />)
    const qtyButton = within(screen.getByRole('columnheader', { name: /qty/i })).getByRole('button')
    fireEvent.click(qtyButton)
    expect(bodyNames()).toEqual(['Sand', 'Cement', 'Bricks'])
  })

  it('renders the empty state when there are no rows', () => {
    render(<ResponsiveTable columns={columns} rows={[]} rowKey={(r) => r.id} empty={<p>Nothing here</p>} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('leaves non-sortable columns without a sort button', () => {
    const cols: Column<Item>[] = [{ key: 'name', header: 'Name', cell: (r) => r.name }]
    render(<ResponsiveTable columns={cols} rows={rows} rowKey={(r) => r.id} />)
    expect(within(screen.getByRole('columnheader', { name: 'Name' })).queryByRole('button')).toBeNull()
  })
})
