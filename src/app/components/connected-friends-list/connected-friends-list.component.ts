import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Friend } from '../../models/friend.model';
import { GraphService } from '../../services/graph.service';

interface ConnectedFriend {
  friend: Friend;
  sharedEventCount: number;
}

@Component({
  selector: 'app-connected-friends-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="connected-friends">
      <h3 class="section-title">
        <mat-icon class="section-icon">people</mat-icon>
        Connected Friends
      </h3>
      <div class="friends-list">
        <div *ngFor="let connection of connectedFriends" 
             class="friend-item" 
             (click)="selectFriend(connection, $event)"
             [style.cursor]="'pointer'">
          <img [src]="connection.friend.photoUrl" [alt]="connection.friend.name" class="friend-avatar">
          <div class="friend-details">
            <span class="friend-name">{{ connection.friend.name }}</span>
            <span class="shared-events">{{ connection.sharedEventCount }} shared {{ connection.sharedEventCount === 1 ? 'event' : 'events' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .connected-friends {
      margin: 16px 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 12px 0;
      color: #333;
      display: flex;
      align-items: center;
    }

    .section-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
      margin-right: 8px;
      color: #3F51B5;
    }

    .friends-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .friend-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .friend-item:last-child {
      border-bottom: none;
    }

    .friend-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 12px;
      object-fit: cover;
      border: 1px solid #3F51B5;
    }

    .friend-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .friend-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .shared-events {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class ConnectedFriendsListComponent {
  @Input() connectedFriends: ConnectedFriend[] = [];
  @Input() currentFriendId: string = '';

  constructor(private graphService: GraphService) {}

  selectFriend(connection: ConnectedFriend, event: MouseEvent): void {
    event.stopPropagation();
    
    const links = this.graphService.links();
    const link = links.find(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return (sourceId === this.currentFriendId && targetId === connection.friend.id) ||
             (sourceId === connection.friend.id && targetId === this.currentFriendId);
    });
    
    if (link) {
      this.graphService.selectLink(link);
    }
  }
}