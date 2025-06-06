import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Friend, FriendNode } from '../../models/friend.model';
import { Event } from '../../models/event.model';
import { DataService } from '../../services/data.service';
import { GraphService } from '../../services/graph.service';
import { EventsListComponent } from '../events-list/events-list.component';
import { ConnectedFriendsListComponent } from '../connected-friends-list/connected-friends-list.component';
import { FriendDialogComponent } from '../friend-dialog/friend-dialog.component';

interface ConnectedFriend {
  friend: Friend;
  sharedEventCount: number;
}

@Component({
  selector: 'app-friend-tooltip',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatDividerModule,
    MatButtonModule,
    EventsListComponent,
    ConnectedFriendsListComponent
  ],
  templateUrl: './friend-tooltip.component.html',
  styleUrls: ['./friend-tooltip.component.css']
})
export class FriendTooltipComponent {
  // Convert friend input to a signal to make it reactive
  private _friendSignal = signal<FriendNode | null>(null);
  
  @Input() 
  set friend(value: FriendNode | null) {
    this._friendSignal.set(value);
  }
  
  get friend(): FriendNode | null {
    return this._friendSignal();
  }

  // Computed event count that updates dynamically
  readonly computedEventCount = computed(() => {
    const friend = this._friendSignal();
    if (!friend) return 0;
    
    const allEvents = this.dataService.events();
    return allEvents.filter(event => event.attendees.includes(friend.id)).length;
  });

  readonly events = computed(() => {
    const friend = this._friendSignal();
    if (!friend) return [];
    
    const filter = this.graphService.filter();
    const events = this.dataService.getEventsForFriend(friend.id);
    
    return events
      .filter(event => !filter || event.type === filter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly connectedFriends = computed(() => {
    const friend = this._friendSignal();
    if (!friend) return [];
    
    const filter = this.graphService.filter();
    const friends = this.dataService.friendsWithEventCount();
    const otherFriends = friends.filter(f => f.id !== friend.id);
    
    return otherFriends.map(otherFriend => {
      const sharedEvents = this.dataService.getSharedEvents(friend.id, otherFriend.id);
      const filteredEvents = filter ? sharedEvents.filter(e => e.type === filter) : sharedEvents;
      
      return {
        friend: otherFriend,
        sharedEventCount: filteredEvents.length
      };
    })
    .filter(connection => connection.sharedEventCount > 0)
    .sort((a, b) => b.sharedEventCount - a.sharedEventCount);
  });
  
  constructor(
    private dataService: DataService,
    private graphService: GraphService,
    private dialog: MatDialog
  ) {}
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  editFriend(event: MouseEvent): void {
    event.stopPropagation();
    
    const friend = this._friendSignal();
    if (!friend) return;
    
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