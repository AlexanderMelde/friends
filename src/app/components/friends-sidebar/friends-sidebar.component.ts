import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Friend, FriendNode } from '../../models/friend.model';
import { DataService } from '../../services/data.service';
import { GraphService } from '../../services/graph.service';
import { FriendListItemComponent } from '../friend-list-item/friend-list-item.component';
import { FriendDialogComponent } from '../friend-dialog/friend-dialog.component';

@Component({
  selector: 'app-friends-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, FriendListItemComponent],
  templateUrl: './friends-sidebar.component.html',
  styleUrls: ['./friends-sidebar.component.css']
})
export class FriendsSidebarComponent {
  @Input() isOpen: boolean = false;
  @Input() calendarSidebarOpen: boolean = false;
  @Output() closeRequested = new EventEmitter<void>();
  @Output() addFriendRequested = new EventEmitter<void>();

  private dataService = inject(DataService);
  private graphService = inject(GraphService);
  private dialog = inject(MatDialog);

  readonly sortedFriends = computed(() => {
    const friends = this.dataService.friendsWithEventCount();
    // Use filtered events from graph service to get accurate counts
    const filteredEvents = this.graphService.filteredEvents();
    
    return friends.map(friend => {
      const eventCount = filteredEvents.filter(event => 
        event.attendees.includes(friend.id)
      ).length;
      
      return {
        ...friend,
        eventCount
      };
    }).sort((a, b) => {
      // Sort by event count (descending), then by name
      if (b.eventCount !== a.eventCount) {
        return b.eventCount - a.eventCount;
      }
      return a.name.localeCompare(b.name);
    });
  });

  close(): void {
    this.closeRequested.emit();
  }

  addFriend(): void {
    this.addFriendRequested.emit();
  }

  selectFriend(friend: Friend & { eventCount: number }): void {
    // Find the corresponding node in the graph
    const nodes = this.graphService.nodes();
    const node = nodes.find(n => n.id === friend.id);
    
    if (node) {
      this.graphService.selectNode(node);
    }
  }

  editFriend(friend: Friend & { eventCount: number }): void {
    const dialogRef = this.dialog.open(FriendDialogComponent, {
      data: { friend: friend, events: this.dataService.events(), isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.updateFriend(result.friend, result.selectedEvents);
      }
    });
  }
}