// Admin feature configuration
export const adminConfig = {
  // Admin page features
  features: {
    userManagement: true,
    resetDemo: true,
    accessMatrix: true,
  },
  // User roles that can access admin
  requiredRoles: ['super_admin', 'admin'] as const,
} as const
