import { Component } from '@angular/core';
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

  constructor(
    private dialog: MatDialog,
    private dataService: DataService
  ) {}

  toggleCalendarSidebar(): void {
    this.calendarSidebarOpen = !this.calendarSidebarOpen;
  }

  closeCalendarSidebar(): void {
    this.calendarSidebarOpen = false;
  }

  toggleFriendsSidebar(): void {
    this.friendsSidebarOpen = !this.friendsSidebarOpen;
  }

  closeFriendsSidebar(): void {
    this.friendsSidebarOpen = false;
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
}