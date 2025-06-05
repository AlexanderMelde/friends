import { Component, Input, computed, signal, effect } from '@angular/core';
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
  @Input() friend: FriendNode | null = null;
  
  private _events = signal<Event[]>([]);
  private _connectedFriends = signal<ConnectedFriend[]>([]);

  readonly events = computed(() => {
    if (!this.friend) return [];
    
    const filter = this.graphService.filter();
    const events = this._events();
    
    return events
      .filter(event => !filter || event.type === filter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly connectedFriends = computed(() => {
    if (!this.friend) return [];
    
    const filter = this.graphService.filter();
    const friends = this.dataService.friends();
    const otherFriends = friends.filter(f => f.id !== this.friend?.id);
    
    return otherFriends.map(otherFriend => {
      const sharedEvents = this.dataService.getSharedEvents(this.friend!.id, otherFriend.id);
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
  ) {
    effect(() => {
      if (this.friend) {
        this._events.set(this.dataService.getEventsForFriend(this.friend.id));
      } else {
        this._events.set([]);
      }
    });
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  editFriend(event: MouseEvent): void {
    event.stopPropagation();
    
    if (!this.friend) return;
    
    const dialogRef = this.dialog.open(FriendDialogComponent, {
      data: { friend: this.friend, events: this.dataService.events(), isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.updateFriend(result.friend, result.selectedEvents);
      }
    });
  }
}