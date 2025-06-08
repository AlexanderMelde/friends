import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Friend } from '../../models/friend.model';
import { GraphService } from '../../services/graph.service';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ConnectedFriend {
  friend: Friend;
  sharedEventCount: number;
}

@Component({
  selector: 'app-connected-friends-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './connected-friends-list.component.html',
  styleUrls: ['./connected-friends-list.component.css']
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