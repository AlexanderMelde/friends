import { Component, Input, Output, EventEmitter, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Friend } from '../../models/friend.model';
import { DataService } from '../../services/data.service';
import { GraphService } from '../../services/graph.service';
import { FriendListItemComponent } from '../friend-list-item/friend-list-item.component';

@Component({
  selector: 'app-friend-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    FriendListItemComponent
  ],
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendListComponent {
  @Input() compactView: boolean = false;
  @Input() showEditButton: boolean = true;
  @Output() friendSelected = new EventEmitter<Friend & { eventCount: number }>();
  @Output() editFriendRequested = new EventEmitter<Friend & { eventCount: number }>();

  private dataService = inject(DataService);
  private graphService = inject(GraphService);

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

  onFriendSelected(friend: Friend & { eventCount: number }): void {
    // Find the corresponding node in the graph and select it
    const nodes = this.graphService.nodes();
    const node = nodes.find(n => n.id === friend.id);
    
    if (node) {
      this.graphService.selectNode(node);
    }
    
    // Also emit the event for parent components
    this.friendSelected.emit(friend);
  }

  onEditFriendRequested(friend: Friend & { eventCount: number }): void {
    this.editFriendRequested.emit(friend);
  }
}