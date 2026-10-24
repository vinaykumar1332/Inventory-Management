import * as React from 'react'
import { ErrorState } from './Feedback'

/**
 * Catches errors in one part of the screen (for example one page) so the shell and the
 * navigation keep working. Resets when resetKey changes, e.g. the current pathname.
 */
export class ErrorBoundary extends React.Component<{ resetKey?: string; children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (this.state.error) return <ErrorState onRetry={() => this.setState({ error: null })} />
    return this.props.children
  }
}
