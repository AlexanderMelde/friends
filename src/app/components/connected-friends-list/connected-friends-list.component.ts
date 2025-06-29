import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Friend } from '../../models/friend.model';
import { GraphService } from '../../services/graph.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SectionHeaderComponent } from '../section-header/section-header.component';

interface ConnectedFriend {
  friend: Friend;
  sharedEventCount: number;
}

@Component({
  selector: 'app-connected-friends-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, SectionHeaderComponent],
  templateUrl: './connected-friends-list.component.html',
  styleUrls: ['./connected-friends-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectedFriendsListComponent {
  @Input() connectedFriends: ConnectedFriend[] = [];
  @Input() currentFriendId: string = '';

  constructor(private graphService: GraphService) {}

  selectFriend(connection: ConnectedFriend, event: MouseEvent): void {
    event.stopPropagation();
    
    // Find the corresponding node in the graph nodes
    const nodes = this.graphService.nodes();
    const node = nodes.find(n => n.id === connection.friend.id);
    
    if (node) {
      this.graphService.selectNode(node);
    }
    
    // Also try to select the link between the current friend and the selected friend
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