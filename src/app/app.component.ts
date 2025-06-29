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
import { DragDropModule } from '@angular/cdk/drag-drop';
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
import { NavigationService } from './services/navigation.service';
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
  private navigationService = inject(NavigationService);

  // Navigation state IDs
  private readonly CALENDAR_SIDEBAR_ID = 'calendar-sidebar';
  private readonly FRIENDS_SIDEBAR_ID = 'friends-sidebar';

  constructor() {
    // CDK drag and drop handles all drag events, so we don't need global listeners
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
        this.closeFriendsSidebar();
      }
      
      if (this.calendarSidebarOpen) {
        this.closeCalendarSidebar();
      } else {
        this.openCalendarSidebar();
      }
    } else {
      // Desktop behavior remains the same
      this.calendarSidebarOpen = !this.calendarSidebarOpen;
    }
  }

  toggleFriendsSidebar(): void {
    if (this.isMobileView()) {
      // On mobile, close calendar sidebar if open, then toggle friends
      if (this.calendarSidebarOpen) {
        this.closeCalendarSidebar();
      }
      
      if (this.friendsSidebarOpen) {
        this.closeFriendsSidebar();
      } else {
        this.openFriendsSidebar();
      }
    } else {
      // Desktop behavior remains the same
      this.friendsSidebarOpen = !this.friendsSidebarOpen;
    }
  }

  private openCalendarSidebar(): void {
    this.calendarSidebarOpen = true;
    this.updateBodyClass();
    
    if (this.isMobileView()) {
      this.navigationService.pushState({
        id: this.CALENDAR_SIDEBAR_ID,
        type: 'sidebar',
        closeCallback: () => this.closeCalendarSidebar()
      });
    }
  }

  private closeCalendarSidebar(): void {
    this.calendarSidebarOpen = false;
    this.updateBodyClass();
    
    if (this.navigationService.isInStack(this.CALENDAR_SIDEBAR_ID)) {
      this.navigationService.closeItem(this.CALENDAR_SIDEBAR_ID);
    }
  }

  private openFriendsSidebar(): void {
    this.friendsSidebarOpen = true;
    this.updateBodyClass();
    
    if (this.isMobileView()) {
      this.navigationService.pushState({
        id: this.FRIENDS_SIDEBAR_ID,
        type: 'sidebar',
        closeCallback: () => this.closeFriendsSidebar()
      });
    }
  }

  private closeFriendsSidebar(): void {
    this.friendsSidebarOpen = false;
    this.updateBodyClass();
    
    if (this.navigationService.isInStack(this.FRIENDS_SIDEBAR_ID)) {
      this.navigationService.closeItem(this.FRIENDS_SIDEBAR_ID);
    }
  }

  closeAllSidebars(): void {
    this.calendarSidebarOpen = false;
    this.friendsSidebarOpen = false;
    this.updateBodyClass();
    
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
      const dialogRef = this.mobileDialogService.openWithContent(
        'Help & User Guide',
        HelpDialogComponent,
        { showBackButton: true }
      );
      
      // Add to navigation stack
      const dialogId = `help-dialog-${Date.now()}`;
      this.navigationService.pushState({
        id: dialogId,
        type: 'dialog',
        closeCallback: () => dialogRef.close()
      });
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
      const dialogRef = this.mobileDialogService.openWithContent(
        'Settings',
        SettingsDialogComponent,
        { showBackButton: true }
      );
      
      // Add to navigation stack
      const dialogId = `settings-dialog-${Date.now()}`;
      this.navigationService.pushState({
        id: dialogId,
        type: 'dialog',
        closeCallback: () => dialogRef.close()
      });
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
      const dialogRef = this.mobileDialogService.openWithContent(
        'Legal Information',
        LegalDialogComponent,
        { showBackButton: true }
      );
      
      // Add to navigation stack
      const dialogId = `legal-dialog-${Date.now()}`;
      this.navigationService.pushState({
        id: dialogId,
        type: 'dialog',
        closeCallback: () => dialogRef.close()
      });
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
      const dialogRef = this.mobileDialogService.openWithContent(
        'Add Friend',
        FriendDialogComponent,
        {
          data: { events, isEdit: false },
          showBackButton: true
        }
      );
      
      // Add to navigation stack
      const dialogId = `add-friend-dialog-${Date.now()}`;
      this.navigationService.pushState({
        id: dialogId,
        type: 'dialog',
        closeCallback: () => dialogRef.close()
      });
      
      dialogRef.afterClosed().subscribe(result => {
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
      const dialogRef = this.mobileDialogService.openWithContent(
        'Add Event',
        EventEditDialogComponent,
        {
          data: { event: newEvent, friends, isNew: true },
          showBackButton: true
        }
      );
      
      // Add to navigation stack
      const dialogId = `add-event-dialog-${Date.now()}`;
      this.navigationService.pushState({
        id: dialogId,
        type: 'dialog',
        closeCallback: () => dialogRef.close()
      });
      
      dialogRef.afterClosed().subscribe(result => {
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
}