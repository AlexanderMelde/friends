export interface SidebarState {
  isOpen: boolean;
  type: 'calendar' | 'friends';
}

export interface ViewportState {
  isMobile: boolean;
  width: number;
  height: number;
}

export interface OverlayState {
  isActive: boolean;
  type: 'sidebar' | 'dialog' | null;
}

export interface UiState {
  sidebar: {
    calendar: SidebarState;
    friends: SidebarState;
  };
  viewport: ViewportState;
  overlay: OverlayState;
}

export const MOBILE_BREAKPOINT = 800;
export const SIDEBAR_ANIMATION_DURATION = 300;
export const DIALOG_ANIMATION_DURATION = 250;