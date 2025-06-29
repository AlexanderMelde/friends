import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private destroyRef = inject(DestroyRef);

  // Core UI state signals
  private _calendarSidebarOpen = signal(false);
  private _friendsSidebarOpen = signal(false);
  private _isMobileView = signal(false);

  // Public readonly signals
  readonly calendarSidebarOpen = this._calendarSidebarOpen.asReadonly();
  readonly friendsSidebarOpen = this._friendsSidebarOpen.asReadonly();
  readonly isMobileView = this._isMobileView.asReadonly();

  // Computed signals
  readonly isOverlayActive = computed(() => {
    return this._isMobileView() && (this._calendarSidebarOpen() || this._friendsSidebarOpen());
  });

  readonly bothSidebarsOpen = computed(() => {
    return this._calendarSidebarOpen() && this._friendsSidebarOpen();
  });

  constructor() {
    // Initialize mobile view state
    this.updateMobileViewState();
    
    // Set up event listeners using RxJS and DestroyRef
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Window resize listener using RxJS
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateMobileViewState();
        
        // Close sidebars when switching from mobile to desktop to prevent layout issues
        if (!this._isMobileView() && this.isOverlayActive()) {
          this.closeAllSidebars();
        }
      });

    // Escape key listener using RxJS
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape' && this.isOverlayActive()) {
          this.closeAllSidebars();
          event.preventDefault();
        }
      });

    // Touch move listener for mobile overlay using RxJS
    fromEvent<TouchEvent>(document, 'touchmove')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: TouchEvent) => {
        if (this.isOverlayActive()) {
          event.preventDefault();
        }
      });
  }

  private updateMobileViewState(): void {
    const isMobile = window.innerWidth <= 800;
    this._isMobileView.set(isMobile);
    this.updateBodyClass();
  }

  private updateBodyClass(): void {
    if (this.isOverlayActive()) {
      document.body.classList.add('overlay-active');
    } else {
      document.body.classList.remove('overlay-active');
    }
  }

  // Calendar sidebar methods
  toggleCalendarSidebar(): void {
    if (this._isMobileView()) {
      // On mobile, close friends sidebar if open, then toggle calendar
      if (this._friendsSidebarOpen()) {
        this._friendsSidebarOpen.set(false);
      }
      
      this._calendarSidebarOpen.set(!this._calendarSidebarOpen());
    } else {
      // Desktop behavior
      this._calendarSidebarOpen.set(!this._calendarSidebarOpen());
    }
    this.updateBodyClass();
  }

  openCalendarSidebar(): void {
    this._calendarSidebarOpen.set(true);
    this.updateBodyClass();
  }

  closeCalendarSidebar(): void {
    this._calendarSidebarOpen.set(false);
    this.updateBodyClass();
  }

  // Friends sidebar methods
  toggleFriendsSidebar(): void {
    if (this._isMobileView()) {
      // On mobile, close calendar sidebar if open, then toggle friends
      if (this._calendarSidebarOpen()) {
        this._calendarSidebarOpen.set(false);
      }
      
      this._friendsSidebarOpen.set(!this._friendsSidebarOpen());
    } else {
      // Desktop behavior
      this._friendsSidebarOpen.set(!this._friendsSidebarOpen());
    }
    this.updateBodyClass();
  }

  openFriendsSidebar(): void {
    this._friendsSidebarOpen.set(true);
    this.updateBodyClass();
  }

  closeFriendsSidebar(): void {
    this._friendsSidebarOpen.set(false);
    this.updateBodyClass();
  }

  // General methods
  closeAllSidebars(): void {
    this._calendarSidebarOpen.set(false);
    this._friendsSidebarOpen.set(false);
    this.updateBodyClass();
  }

  // Method for overlay backdrop clicks
  handleOverlayBackdropClick(event: MouseEvent): boolean {
    // Only close if clicking the backdrop itself, not the content
    if (event.target === event.currentTarget) {
      this.closeAllSidebars();
      return true;
    }
    return false;
  }
}