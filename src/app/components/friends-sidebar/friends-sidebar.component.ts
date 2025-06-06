import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Friend, FriendNode } from '../../models/friend.model';
import { DataService } from '../../services/data.service';
import { GraphService } from '../../services/graph.service';
import { FriendListItemComponent } from '../friend-list-item/friend-list-item.component';

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

  readonly sortedFriends = computed(() => {
    const friends = this.dataService.friendsWithEventCount();
    const filter = this.graphService.filter();
    
    // Calculate event counts based on current filter
    const events = this.dataService.events();
    const filteredEvents = filter ? events.filter(e => e.type === filter) : events;
    
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
}