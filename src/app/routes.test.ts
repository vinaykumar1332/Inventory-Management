import { describe, expect, it } from 'vitest'
import { ROUTES, paths, safeRedirect, suggestPath } from './routes'

describe('suggestPath', () => {
  it('suggests the closest real page for a mistyped path', () => {
    expect(suggestPath('/dashbrd')).toBe('/dashboard')
  })

  it('returns null for the root path', () => {
    expect(suggestPath('/')).toBeNull()
  })
})

describe('safeRedirect', () => {
  it('keeps in-app paths', () => {
    expect(safeRedirect('/sites/site-1?tab=stock')).toBe('/sites/site-1?tab=stock')
  })

  it('refuses external and protocol-relative targets', () => {
    expect(safeRedirect('https://example.com')).toBe(ROUTES.afterLogin)
    expect(safeRedirect('//example.com')).toBe(ROUTES.afterLogin)
  })

  it('falls back when there is no target or it points back at login', () => {
    expect(safeRedirect(undefined)).toBe(ROUTES.afterLogin)
    expect(safeRedirect(ROUTES.login)).toBe(ROUTES.afterLogin)
  })
})

describe('paths', () => {
  it('encodes ids in path segments', () => {
    expect(paths.site('a b')).toBe('/sites/a%20b')
    expect(paths.approval('x/y')).toBe('/approvals/x%2Fy')
  })

  it('builds optional query strings only when a value is given', () => {
    expect(paths.upload()).toBe('/upload')
    expect(paths.upload('inv-1')).toBe('/upload?invoice=inv-1')
    expect(paths.inventory()).toBe('/inventory')
    expect(paths.inventory({ productId: 'p1' })).toBe('/inventory?product=p1')
    expect(paths.inventory({ productId: 'p1', siteId: 's1' })).toBe('/inventory?product=p1&productSite=s1')
  })
})
