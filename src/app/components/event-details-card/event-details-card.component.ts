import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { EventsListComponent } from '../events-list/events-list.component';
import { FriendNode } from '../../models/friend.model';
import { EventLink } from '../../models/event.model';
import { GraphService } from '../../services/graph.service';

@Component({
  selector: 'app-event-details-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, EventsListComponent],
  templateUrl: './event-details-card.component.html',
  styleUrls: ['./event-details-card.component.css']
})
export class EventDetailsCardComponent implements OnInit {
  @Input() link: EventLink | null = null;
  
  get sourceNode() {
    return this.link && typeof this.link.source !== 'string' ? this.link.source : null;
  }
  
  get targetNode() {
    return this.link && typeof this.link.target !== 'string' ? this.link.target : null;
  }
  
  get connectionTitle(): string {
    if (this.sourceNode && this.targetNode) {
      return `${this.sourceNode.name} & ${this.targetNode.name}`;
    }
    return 'Connection Details';
  }
  
  constructor(private graphService: GraphService) {}
  
  ngOnInit() {
    // Filter shared events based on selected type
    if (this.link) {
      const filter = this.graphService.filter();
      this.link.sharedEvents = filter 
        ? this.link.sharedEvents.filter(e => e.type === filter)
        : this.link.sharedEvents;
    }
  }

  selectNode(node: FriendNode, event: MouseEvent) {
    event.stopPropagation();
    this.graphService.selectNode(node);
  }
}