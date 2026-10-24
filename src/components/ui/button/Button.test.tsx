import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Button, IconButton } from './Button'

describe('Button', () => {
  it('defaults to type="button" so it does not submit forms by accident', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('applies the requested variant class', () => {
    render(<Button variant="danger">Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-danger')
  })

  it('disables itself and sets aria-busy while loading', () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Saving' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not set a button type when rendered as a child element', () => {
    render(
      <Button asChild>
        <a href="/sites">Sites</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Sites' })
    expect(link).not.toHaveAttribute('type')
    expect(link).toHaveClass('inline-flex')
  })
})

describe('IconButton', () => {
  it('requires an accessible name and uses the icon size', () => {
    render(
      <IconButton aria-label="Clear search">
        <span>x</span>
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'Clear search' })
    expect(button).toHaveClass('size-11')
  })
})
