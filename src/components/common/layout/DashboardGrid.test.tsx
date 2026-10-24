import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardGrid } from './DashboardGrid'

const widgets = {
  expiryTimeline: <p>expiry</p>,
  consumptionTrend: <p>consumption</p>,
  categoryMix: <p>category</p>,
  stockBySite: null,
  topMaterials: <p>top</p>,
  recentActivity: false as const,
}

describe('DashboardGrid', () => {
  it('skips widgets that are off, and rows with nothing visible', () => {
    render(<DashboardGrid widgets={widgets} />)
    expect(screen.getByText('expiry')).toBeInTheDocument()
    expect(screen.queryByText('activity')).not.toBeInTheDocument()
  })

  it('gives a row as many columns as the sum of its widget spans', () => {
    const { container } = render(<DashboardGrid widgets={widgets} />)
    const rows = container.querySelectorAll<HTMLElement>('[style*="--row-units"]')
    // Row 2 is consumptionTrend (span 2) + categoryMix (span 1) = 3 columns.
    expect(rows[1].style.getPropertyValue('--row-units')).toBe('3')
    const consumption = screen.getByText('consumption').parentElement
    expect(consumption).toHaveAttribute('data-span', '2')
  })

  it('keeps single-width widgets at span 1', () => {
    render(<DashboardGrid widgets={widgets} />)
    expect(screen.getByText('category').parentElement).toHaveAttribute('data-span', '1')
  })
})
