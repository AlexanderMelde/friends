import { Component, inject, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GraphVisualizationComponent } from './components/graph-visualization/graph-visualization.component';
import { CalendarSidebarComponent } from './components/calendar-sidebar/calendar-sidebar.component';
import { FriendsSidebarComponent } from './components/friends-sidebar/friends-sidebar.component';
import { FriendDialogComponent } from './components/friend-dialog/friend-dialog.component';
import { EventEditDialogComponent } from './components/event-edit-dialog/event-edit-dialog.component';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { HelpDialogComponent } from './components/help-dialog/help-dialog.component';
import { LegalDialogComponent } from './components/legal-dialog/legal-dialog.component';
import { TrashBinComponent } from './components/trash-bin/trash-bin.component';
import { DataService } from './services/data.service';
import { DragService } from './services/drag.service';
import { GraphService } from './services/graph.service';
import { MobileDialogService } from './services/mobile-dialog.service';
import { NavigationService } from './services/navigation.service';
import { UiStateService } from './services/ui-state.service';
import { Event } from './models/event.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    MatToolbarModule, 
    MatIconModule, 
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    DragDropModule,
    GraphVisualizationComponent,
    CalendarSidebarComponent,
    FriendsSidebarComponent,
    TrashBinComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Friends!';
  
  private dialog = inject(MatDialog);
  private dataService = inject(DataService);
  private dragService = inject(DragService);
  private mobileDialogService = inject(MobileDialogService);
  private navigationService = inject(NavigationService);
  
  // Inject the centralized UI state service
  readonly uiStateService = inject(UiStateService);
  readonly graphService = inject(GraphService);

  // Navigation state IDs
  private readonly CALENDAR_SIDEBAR_ID = 'calendar-sidebar';
  private readonly FRIENDS_SIDEBAR_ID = 'friends-sidebar';

  constructor() {
    // CDK drag and drop handles all drag events, so we don't need global listeners
  }

  // Handle document drag leave event
  onDocumentDragLeave(event: DragEvent): void {
    // Check if the drag operation has left the entire document
    if (!event.relatedTarget) {
      this.dragService.endDrag();
    }
  }

  // Handle window resize to close overlays when switching to desktop
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    // This is now handled by UiStateService
  }

  // Handle escape key to close overlays
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    // This is now handled by UiStateService
  }

  // Prevent body scroll when overlay is active
  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    // This is now handled by UiStateService
  }

  toggleCalendarSidebar(): void {
    const wasOpen = this.uiStateService.calendarSidebarOpen();
    this.uiStateService.toggleCalendarSidebar();
    
    // Handle navigation state for mobile
    if (this.uiStateService.isMobileView()) {
      if (!wasOpen && this.uiStateService.calendarSidebarOpen()) {
        this.navigationService.pushState({
          id: this.CALENDAR_SIDEBAR_ID,
          type: 'sidebar',
          closeCallback: () => this.uiStateService.closeCalendarSidebar()
        });
      } else if (wasOpen && !this.uiStateService.calendarSidebarOpen()) {
        if (this.navigationService.isInStack(this.CALENDAR_SIDEBAR_ID)) {
          this.navigationService.closeItem(this.CALENDAR_SIDEBAR_ID);
        }
      }
    }
  }

  toggleFriendsSidebar(): void {
    const wasOpen = this.uiStateService.friendsSidebarOpen();
    this.uiStateService.toggleFriendsSidebar();
    
    // Handle navigation state for mobile
    if (this.uiStateService.isMobileView()) {
      if (!wasOpen && this.uiStateService.friendsSidebarOpen()) {
        this.navigationService.pushState({
          id: this.FRIENDS_SIDEBAR_ID,
          type: 'sidebar',
          closeCallback: () => this.uiStateService.closeFriendsSidebar()
        });
      } else if (wasOpen && !this.uiStateService.friendsSidebarOpen()) {
        if (this.navigationService.isInStack(this.FRIENDS_SIDEBAR_ID)) {
          this.navigationService.closeItem(this.FRIENDS_SIDEBAR_ID);
        }
      }
    }
  }

  closeAllSidebars(): void {
    this.uiStateService.closeAllSidebars();
    
    // Close any navigation items for these sidebars
    if (this.navigationService.isInStack(this.CALENDAR_SIDEBAR_ID)) {
      this.navigationService.closeItem(this.CALENDAR_SIDEBAR_ID);
    }
    if (this.navigationService.isInStack(this.FRIENDS_SIDEBAR_ID)) {
      this.navigationService.closeItem(this.FRIENDS_SIDEBAR_ID);
    }
  }

  // Handle overlay backdrop clicks
  onOverlayBackdropClick(event: MouseEvent): void {
    if (this.uiStateService.handleOverlayBackdropClick(event)) {
      // Also handle navigation cleanup
      if (this.navigationService.isInStack(this.CALENDAR_SIDEBAR_ID)) {
        this.navigationService.closeItem(this.CALENDAR_SIDEBAR_ID);
      }
      if (this.navigationService.isInStack(this.FRIENDS_SIDEBAR_ID)) {
        this.navigationService.closeItem(this.FRIENDS_SIDEBAR_ID);
      }
    }
  }

  openHelp(): void {
    // Centralized dialog opening - no mobile/desktop distinction needed here
    this.mobileDialogService.openWithContent(
      'Help & User Guide',
      HelpDialogComponent,
      { showBackButton: true }
    );
  }

  openSettings(): void {
    // Centralized dialog opening - no mobile/desktop distinction needed here
    this.mobileDialogService.openWithContent(
      'Settings',
      SettingsDialogComponent,
      { showBackButton: true }
    );
  }

  openLegal(): void {
    // Centralized dialog opening - no mobile/desktop distinction needed here
    this.mobileDialogService.openWithContent(
      'Legal Information',
      LegalDialogComponent,
      { showBackButton: true }
    );
  }

  addFriend(): void {
    const events = this.dataService.events();
    
    // Centralized dialog opening - no mobile/desktop distinction needed here
    const dialogRef = this.mobileDialogService.openWithContent(
      'Add Friend',
      FriendDialogComponent,
      {
        data: { events, isEdit: false },
        showBackButton: true
      }
    );
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.addFriend(result.friend, result.selectedEvents);
      }
    });
  }

  addEvent(): void {
    const friends = this.dataService.friendsWithEventCount();
    const newEvent: Event = {
      id: crypto.randomUUID(),
      title: '',
      date: new Date(),
      location: '',
      attendees: []
    };

    // Centralized dialog opening - no mobile/desktop distinction needed here
    const dialogRef = this.mobileDialogService.openWithContent(
      'Add Event',
      EventEditDialogComponent,
      {
        data: { event: newEvent, friends, isNew: true },
        showBackButton: true
      }
    );
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.addEvent(result);
      }
    });
  }
}