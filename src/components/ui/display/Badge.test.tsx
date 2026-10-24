import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, type BadgeTone } from './Badge'

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-muted',
  primary: 'bg-primary-soft',
  accent: 'bg-sidebar-accent/15',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  info: 'bg-info-soft',
  navy: 'bg-navy',
}

describe('Badge', () => {
  it.each(Object.keys(TONE_CLASS) as BadgeTone[])('applies the %s tone', (tone) => {
    render(<Badge tone={tone}>{tone}</Badge>)
    expect(screen.getByText(tone)).toHaveClass(TONE_CLASS[tone])
  })

  it('defaults to the neutral tone', () => {
    render(<Badge>Draft</Badge>)
    expect(screen.getByText('Draft')).toHaveClass('bg-muted')
  })
})
