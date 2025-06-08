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
import { MobileDialogService } from '../../services/mobile-dialog.service';
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

  // Computed property that gets the latest friend data from the data service
  readonly currentFriend = computed(() => {
    const selectedFriend = this._friendSignal();
    if (!selectedFriend) return null;
    
    // Get the latest friend data from the data service
    const allFriends = this.dataService.friends();
    const latestFriendData = allFriends.find(f => f.id === selectedFriend.id);
    
    if (!latestFriendData) return selectedFriend;
    
    // Merge the latest data with the node properties
    return {
      ...selectedFriend,
      ...latestFriendData
    };
  });

  // Computed event count that updates dynamically based on filtered events
  readonly computedEventCount = computed(() => {
    const friend = this.currentFriend();
    if (!friend) return 0;
    
    // Use filtered events from graph service
    const filteredEvents = this.graphService.filteredEvents();
    return filteredEvents.filter(event => event.attendees.includes(friend.id)).length;
  });

  readonly events = computed(() => {
    const friend = this.currentFriend();
    if (!friend) return [];
    
    // Use filtered events from graph service
    const filteredEvents = this.graphService.filteredEvents();
    const friendEvents = filteredEvents.filter(event => event.attendees.includes(friend.id));
    
    return friendEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly connectedFriends = computed(() => {
    const friend = this.currentFriend();
    if (!friend) return [];
    
    // Use filtered events from graph service
    const filteredEvents = this.graphService.filteredEvents();
    const friends = this.dataService.friendsWithEventCount();
    const otherFriends = friends.filter(f => f.id !== friend.id);
    
    return otherFriends.map(otherFriend => {
      const sharedEvents = filteredEvents.filter(event => 
        event.attendees.includes(friend.id) && event.attendees.includes(otherFriend.id)
      );
      
      return {
        friend: otherFriend,
        sharedEventCount: sharedEvents.length
      };
    })
    .filter(connection => connection.sharedEventCount > 0)
    .sort((a, b) => b.sharedEventCount - a.sharedEventCount);
  });
  
  constructor(
    private dataService: DataService,
    private graphService: GraphService,
    private dialog: MatDialog,
    private mobileDialogService: MobileDialogService
  ) {}

  private isMobileView(): boolean {
    return window.innerWidth <= 800;
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
    
    const friend = this.currentFriend();
    if (!friend) return;
    
    if (this.isMobileView()) {
      this.mobileDialogService.openWithContent(
        'Edit Friend',
        FriendDialogComponent,
        {
          data: { friend: friend, events: this.dataService.events(), isEdit: true },
          showBackButton: true
        }
      ).afterClosed().subscribe(result => {
        if (result) {
          this.dataService.updateFriend(result.friend, result.selectedEvents);
        }
      });
    } else {
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
}