export const APP_CONSTANTS = {
  // Breakpoints
  MOBILE_BREAKPOINT: 800,
  SMALL_MOBILE_BREAKPOINT: 480,
  
  // Animation durations (ms)
  SIDEBAR_ANIMATION_DURATION: 300,
  DIALOG_ANIMATION_DURATION: 250,
  TOOLTIP_DELAY: 500,
  
  // Z-index layers
  Z_INDEX: {
    SIDEBAR: 40,
    MOBILE_OVERLAY: 1000,
    DIALOG: 2000,
    DRAG_PREVIEW: 2001,
    TOOLTIP: 20
  },
  
  // Graph visualization
  GRAPH: {
    MIN_NODE_RADIUS: 25,
    MAX_NODE_RADIUS: 60,
    NODE_RADIUS_MULTIPLIER: 3,
    LINK_DISTANCE_BASE: 140,
    LINK_DISTANCE_MULTIPLIER: 8,
    COLLISION_PADDING: 5
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    FRIENDS: 'friends',
    EVENTS: 'events',
    UI_PREFERENCES: 'ui-preferences'
  },
  
  // File export
  EXPORT: {
    JSON_FILENAME_PREFIX: 'social-network-backup',
    ICAL_FILENAME_PREFIX: 'social-network-calendar-contacts'
  }
} as const;

export type AppConstants = typeof APP_CONSTANTS;