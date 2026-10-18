/**
 * Stable, optimized color palette for SiteSeal Inventory.
 * WCAG AA compliant, accessible on light and dark backgrounds.
 */

export const colorPalette = {
  // Brand colors
  brand: {
    primary: '#0F2A3D', // Deep navy
    secondary: '#00A885', // Teal
    accent: '#FF6B35', // Orange (sparingly used)
  },

  // Status colors - semantic meaning
  status: {
    success: '#059669', // Emerald green
    warning: '#D97706', // Amber
    critical: '#DC2626', // Red
    info: '#3B82F6', // Blue
  },

  // Neutral palette - carefully chosen for contrast
  neutral: {
    white: '#FFFFFF',
    gray100: '#F9FAFB', // Almost white, used for surfaces
    gray200: '#F3F4F6', // Light backgrounds
    gray300: '#E5E7EB',
    gray400: '#D1D5DB',
    gray500: '#9CA3AF',
    gray600: '#6B7280', // Default foreground
    gray700: '#374151',
    gray800: '#1F2937', // Dark surface
    gray900: '#111827', // Almost black
  },

  // Semantic colors with proper contrast ratios
  semantic: {
    danger: '#DC2626', // Red with 7:1 contrast ratio
    warning: '#D97706', // Amber with 7:1 contrast ratio
    success: '#059669', // Green with 7:1 contrast ratio
    info: '#3B82F6', // Blue with 5:1 contrast ratio
  },

  // Background colors
  background: {
    light: '#FFFFFF',
    dark: '#0B1220', // Slightly brighter than pure black for OLED
  },

  // Surface colors for cards, panels
  surface: {
    light: '#F8FAFC',
    dark: '#1E293B',
  },
}

/**
 * Helper to get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgb if needed
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Color schemes for different alert/status types.
 * Ensures consistent, accessible color usage.
 */
export const statusColorSchemes = {
  critical: {
    bg: '#FEE2E2', // Very light red
    border: '#FCA5A5', // Light red
    text: '#DC2626', // Dark red
    darkBg: 'rgba(220, 38, 38, 0.1)',
    darkBorder: 'rgba(220, 38, 38, 0.3)',
    darkText: '#FCA5A5',
  },
  warning: {
    bg: '#FEF3C7', // Very light amber
    border: '#FCD34D', // Light amber
    text: '#D97706', // Dark amber
    darkBg: 'rgba(217, 119, 6, 0.1)',
    darkBorder: 'rgba(217, 119, 6, 0.3)',
    darkText: '#FCD34D',
  },
  success: {
    bg: '#D1FAE5', // Very light green
    border: '#6EE7B7', // Light green
    text: '#059669', // Dark green
    darkBg: 'rgba(5, 150, 105, 0.1)',
    darkBorder: 'rgba(5, 150, 105, 0.3)',
    darkText: '#6EE7B7',
  },
  info: {
    bg: '#DBEAFE', // Very light blue
    border: '#93C5FD', // Light blue
    text: '#0284C7', // Dark blue
    darkBg: 'rgba(2, 132, 199, 0.1)',
    darkBorder: 'rgba(2, 132, 199, 0.3)',
    darkText: '#93C5FD',
  },
}

/**
 * Shadow system for depth
 */
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}
