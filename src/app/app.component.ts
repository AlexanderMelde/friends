import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { GraphVisualizationComponent } from './components/graph-visualization/graph-visualization.component';
import { CalendarSidebarComponent } from './components/calendar-sidebar/calendar-sidebar.component';
import { FriendsSidebarComponent } from './components/friends-sidebar/friends-sidebar.component';
import { FriendDialogComponent } from './components/friend-dialog/friend-dialog.component';
import { EventEditDialogComponent } from './components/event-edit-dialog/event-edit-dialog.component';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { HelpDialogComponent } from './components/help-dialog/help-dialog.component';
import { LegalDialogComponent } from './components/legal-dialog/legal-dialog.component';
import { DataService } from './services/data.service';
import { DragService } from './services/drag.service';
import { GraphService } from './services/graph.service';
import { MobileDialogService } from './services/mobile-dialog.service';
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
    GraphVisualizationComponent,
    CalendarSidebarComponent,
    FriendsSidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Friends!';
  calendarSidebarOpen = false;
  friendsSidebarOpen = false;
  graphService = inject(GraphService);

  private dialog = inject(MatDialog);
  private dataService = inject(DataService);
  private dragService = inject(DragService);
  private mobileDialogService = inject(MobileDialogService);

  constructor() {
    // Add global drop event listener to handle drops outside of valid zones
    document.addEventListener('drop', this.onGlobalDrop.bind(this));
    document.addEventListener('dragover', this.onGlobalDragOver.bind(this));
  }

  // Check if mobile overlay should be active
  isOverlayActive(): boolean {
    return this.isMobileView() && (this.calendarSidebarOpen || this.friendsSidebarOpen);
  }

  // Check if current viewport is mobile
  private isMobileView(): boolean {
    return window.innerWidth <= 800;
  }

  // Handle window resize to close overlays when switching to desktop
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    // Close sidebars when switching from mobile to desktop to prevent layout issues
    if (!this.isMobileView() && this.isOverlayActive()) {
      this.closeAllSidebars();
    }
  }

  // Handle escape key to close overlays
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOverlayActive()) {
      this.closeAllSidebars();
      event.preventDefault();
    }
  }

  // Prevent body scroll when overlay is active
  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this.isOverlayActive()) {
      event.preventDefault();
    }
  }

  toggleCalendarSidebar(): void {
    if (this.isMobileView()) {
      // On mobile, close friends sidebar if open, then toggle calendar
      if (this.friendsSidebarOpen) {
        this.friendsSidebarOpen = false;
      }
      this.calendarSidebarOpen = !this.calendarSidebarOpen;
      this.updateBodyClass();
    } else {
      // Desktop behavior remains the same
      this.calendarSidebarOpen = !this.calendarSidebarOpen;
    }
  }

  toggleFriendsSidebar(): void {
    if (this.isMobileView()) {
      // On mobile, close calendar sidebar if open, then toggle friends
      if (this.calendarSidebarOpen) {
        this.calendarSidebarOpen = false;
      }
      this.friendsSidebarOpen = !this.friendsSidebarOpen;
      this.updateBodyClass();
    } else {
      // Desktop behavior remains the same
      this.friendsSidebarOpen = !this.friendsSidebarOpen;
    }
  }

  closeAllSidebars(): void {
    this.calendarSidebarOpen = false;
    this.friendsSidebarOpen = false;
    this.updateBodyClass();
  }

  // Handle overlay backdrop clicks
  onOverlayBackdropClick(event: MouseEvent): void {
    // Only close if clicking the backdrop itself, not the content
    if (event.target === event.currentTarget) {
      this.closeAllSidebars();
    }
  }

  // Update body class for overlay state
  private updateBodyClass(): void {
    if (this.isOverlayActive()) {
      document.body.classList.add('overlay-active');
    } else {
      document.body.classList.remove('overlay-active');
    }
  }

  openHelp(): void {
    if (this.isMobileView()) {
      this.mobileDialogService.openWithContent(
        'Help & User Guide',
        HelpDialogComponent,
        { showBackButton: true }
      );
    } else {
      this.dialog.open(HelpDialogComponent, {
        width: '700px',
        maxWidth: '90vw',
        maxHeight: '90vh'
      });
    }
  }

  openSettings(): void {
    if (this.isMobileView()) {
      this.mobileDialogService.openWithContent(
        'Settings',
        SettingsDialogComponent,
        { showBackButton: true }
      );
    } else {
      this.dialog.open(SettingsDialogComponent, {
        width: '600px',
        maxWidth: '90vw',
        disableClose: false
      });
    }
  }

  openLegal(): void {
    if (this.isMobileView()) {
      this.mobileDialogService.openWithContent(
        'Legal Information',
        LegalDialogComponent,
        { showBackButton: true }
      );
    } else {
      this.dialog.open(LegalDialogComponent, {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh'
      });
    }
  }

  addFriend(): void {
    const events = this.dataService.events();
    
    if (this.isMobileView()) {
      this.mobileDialogService.openWithContent(
        'Add Friend',
        FriendDialogComponent,
        {
          data: { events, isEdit: false },
          showBackButton: true
        }
      ).afterClosed().subscribe(result => {
        if (result) {
          this.dataService.addFriend(result.friend, result.selectedEvents);
        }
      });
    } else {
      const dialogRef = this.dialog.open(FriendDialogComponent, {
        data: { events, isEdit: false }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.dataService.addFriend(result.friend, result.selectedEvents);
        }
      });
    }
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

    if (this.isMobileView()) {
      this.mobileDialogService.openWithContent(
        'Add Event',
        EventEditDialogComponent,
        {
          data: { event: newEvent, friends, isNew: true },
          showBackButton: true
        }
      ).afterClosed().subscribe(result => {
        if (result) {
          this.dataService.addEvent(result);
        }
      });
    } else {
      const dialogRef = this.dialog.open(EventEditDialogComponent, {
        data: { event: newEvent, friends, isNew: true }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.dataService.addEvent(result);
        }
      });
    }
  }

  onDocumentDragLeave(event: DragEvent): void {
    // Only handle attendee drags
    if (this.dragService.dragType() === 'attendee') {
      // Check if we're leaving the document boundaries
      const rect = document.documentElement.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      
      if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
        this.dragService.setDropTarget(null);
      }
    }
  }

  private onGlobalDragOver(event: DragEvent): void {
    // Prevent default to allow drop
    event.preventDefault();
  }

  private onGlobalDrop(event: DragEvent): void {
    // Only handle attendee drags
    if (this.dragService.dragType() === 'attendee') {
      const draggedFriend = this.dragService.draggedFriend();
      const draggedFromEventId = this.dragService.draggedFromEventId();
      const currentDropTarget = this.dragService.currentDropTarget();

      // If no drop target was set, this means the drop happened outside any valid zone
      if (!currentDropTarget && draggedFriend && draggedFromEventId) {
        // Find the source event and remove the attendee
        const sourceEvent = this.dataService.events().find(e => e.id === draggedFromEventId);
        if (sourceEvent) {
          const updatedEvent: Event = {
            ...sourceEvent,
            attendees: sourceEvent.attendees.filter(id => id !== draggedFriend.id)
          };
          this.dataService.updateEvent(updatedEvent);
        }
      }
    }

    // End the drag operation to clean up state
    this.dragService.endDrag();

    // Prevent default behavior
    event.preventDefault();
  }
}