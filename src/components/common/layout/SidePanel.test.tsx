import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SidePanel } from './SidePanel'

describe('SidePanel', () => {
  it('shows its title and content when open', () => {
    render(
      <SidePanel open onClose={() => {}} title="Edit site">
        <p>Site form</p>
      </SidePanel>,
    )
    expect(screen.getByRole('dialog', { name: 'Edit site' })).toBeInTheDocument()
    expect(screen.getByText('Site form')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <SidePanel open={false} onClose={() => {}} title="Edit site">
        <p>Site form</p>
      </SidePanel>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <SidePanel open onClose={onClose} title="Edit site">
        <p>Site form</p>
      </SidePanel>,
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores Escape when it is not dismissible', () => {
    const onClose = vi.fn()
    render(
      <SidePanel open onClose={onClose} title="Confirm bill" dismissible={false}>
        <p>Locked</p>
      </SidePanel>,
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
