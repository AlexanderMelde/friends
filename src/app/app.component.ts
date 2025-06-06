import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GraphVisualizationComponent } from './components/graph-visualization/graph-visualization.component';
import { FilterControlsComponent } from './components/filter-controls/filter-controls.component';
import { CalendarSidebarComponent } from './components/calendar-sidebar/calendar-sidebar.component';
import { FriendsSidebarComponent } from './components/friends-sidebar/friends-sidebar.component';
import { FriendDialogComponent } from './components/friend-dialog/friend-dialog.component';
import { EventEditDialogComponent } from './components/event-edit-dialog/event-edit-dialog.component';
import { DataService } from './services/data.service';
import { DragService } from './services/drag.service';
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
    GraphVisualizationComponent,
    FilterControlsComponent,
    CalendarSidebarComponent,
    FriendsSidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Social Network Visualization';
  calendarSidebarOpen = false;
  friendsSidebarOpen = false;

  private dialog = inject(MatDialog);
  private dataService = inject(DataService);
  private dragService = inject(DragService);

  constructor() {
    // Add global drop event listener to handle drops outside of valid zones
    document.addEventListener('drop', this.onGlobalDrop.bind(this));
    document.addEventListener('dragover', this.onGlobalDragOver.bind(this));
  }

  toggleCalendarSidebar(): void {
    this.calendarSidebarOpen = !this.calendarSidebarOpen;
  }

  toggleFriendsSidebar(): void {
    this.friendsSidebarOpen = !this.friendsSidebarOpen;
  }

  addFriend(): void {
    const events = this.dataService.events();
    const dialogRef = this.dialog.open(FriendDialogComponent, {
      data: { events, isEdit: false }
    });

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

    const dialogRef = this.dialog.open(EventEditDialogComponent, {
      data: { event: newEvent, friends, isNew: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.addEvent(result);
      }
    });
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