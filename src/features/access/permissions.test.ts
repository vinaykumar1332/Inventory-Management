import { describe, expect, it } from 'vitest'
import { rolesConfig } from '@/config'
import { can, canApprove, describeAccess, requiredApproverFor } from './permissions'

describe('describeAccess', () => {
  it('gives the super admin direct access to governed actions', () => {
    expect(describeAccess('super_admin', 'stock.adjust')).toBe('direct')
    expect(describeAccess('super_admin', 'site.update')).toBe('direct')
  })

  it('routes an admin change that needs review through approval', () => {
    expect(describeAccess('admin', 'stock.adjust')).toBe('needs_approval')
    expect(describeAccess('admin', 'manager.assign')).toBe('needs_approval')
  })

  it('denies site.update to admins', () => {
    expect(describeAccess('admin', 'site.update')).toBe('forbidden')
  })

  it('resolves permission aliases to their governed action', () => {
    expect(describeAccess('site_manager', 'upload_bills')).toBe(describeAccess('site_manager', 'bill.upload'))
    expect(describeAccess('site_manager', 'upload_bills')).toBe('needs_approval')
  })

  it('uses static permissions for non-governed screens', () => {
    expect(describeAccess('site_manager', 'view_bills')).toBe('direct')
    expect(describeAccess('admin', 'create_admin')).toBe('forbidden')
    expect(describeAccess('super_admin', 'create_admin')).toBe('direct')
  })

  it('denies everything when there is no signed-in role', () => {
    expect(describeAccess(undefined, 'upload_bills')).toBe('forbidden')
    expect(describeAccess(undefined, 'view_bills')).toBe('forbidden')
  })

  it('returns a valid mode for every row of the permission matrix', () => {
    const valid = new Set(['direct', 'needs_approval', 'forbidden'])
    for (const key of rolesConfig.permissionMatrixRows) {
      for (const role of rolesConfig.roles) {
        expect(valid.has(describeAccess(role, key as Parameters<typeof describeAccess>[1]))).toBe(true)
      }
    }
  })
})

describe('can', () => {
  it('is true for any mode other than forbidden', () => {
    expect(can('site_manager', 'upload_bills')).toBe(true)
    expect(can('site_manager', 'manage_sites')).toBe(false)
  })
})

describe('approval routing', () => {
  it('sends a site manager’s request to an admin and everyone else’s to a super admin', () => {
    expect(requiredApproverFor('site_manager')).toBe('admin')
    expect(requiredApproverFor('admin')).toBe('super_admin')
    expect(requiredApproverFor('super_admin')).toBe('super_admin')
  })

  it('lets a super admin approve anything', () => {
    expect(canApprove('super_admin', 'admin')).toBe(true)
    expect(canApprove('super_admin', 'super_admin')).toBe(true)
  })

  it('lets an admin approve only admin-level requests', () => {
    expect(canApprove('admin', 'admin')).toBe(true)
    expect(canApprove('admin', 'super_admin')).toBe(false)
  })

  it('never lets a site manager approve', () => {
    expect(canApprove('site_manager', 'admin')).toBe(false)
    expect(canApprove(undefined, 'admin')).toBe(false)
  })
})
