export const ALL_TAGS = [
  'leave', 'benefit', 'contract', 'payroll',
  'tax', 'onboarding', 'working_time', 'behavior',
];

// Flat enterprise tag colors — muted, professional
export const TAG_COLORS = {
  leave:        '#dc2626', // red-600
  benefit:      '#1d4ed8', // blue-700
  contract:     '#6d28d9', // violet-700
  payroll:      '#b45309', // amber-700
  tax:          '#0f766e', // teal-700
  onboarding:   '#047857', // emerald-700
  working_time: '#92400e', // amber-800
  behavior:     '#be185d', // pink-700
};

// Enterprise type config — monochromatic, professional
export const TYPE_CONFIG = {
  Policy:    { icon: '📋', accent: '#1d4ed8' }, // blue-700
  FAQ:       { icon: '❓', accent: '#b45309' }, // amber-700
  Checklist: { icon: '✅', accent: '#047857' }, // emerald-700
  Lesson:    { icon: '💡', accent: '#6d28d9' }, // violet-700
};

// Role colors — flat enterprise palette
export const ROLE_COLORS = {
  ADMIN:   { bg: '#fef2f2', color: '#dc2626' }, // red
  MANAGER: { bg: '#eff6ff', color: '#1d4ed8' }, // blue
  USER:    { bg: '#f0fdf4', color: '#15803d' }, // green
};
