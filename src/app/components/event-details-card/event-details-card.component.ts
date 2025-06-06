import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { EventsListComponent } from '../events-list/events-list.component';
import { FriendNode } from '../../models/friend.model';
import { EventLink } from '../../models/event.model';
import { GraphService } from '../../services/graph.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-event-details-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, EventsListComponent],
  templateUrl: './event-details-card.component.html',
  styleUrls: ['./event-details-card.component.css']
})
export class EventDetailsCardComponent {
  // Convert link input to a signal to make it reactive
  private _linkSignal = signal<EventLink | null>(null);
  
  @Input() 
  set link(value: EventLink | null) {
    this._linkSignal.set(value);
  }
  
  get link(): EventLink | null {
    return this._linkSignal();
  }
  
  get sourceNode() {
    const link = this._linkSignal();
    return link && typeof link.source !== 'string' ? link.source : null;
  }
  
  get targetNode() {
    const link = this._linkSignal();
    return link && typeof link.target !== 'string' ? link.target : null;
  }
  
  get connectionTitle(): string {
    if (this.sourceNode && this.targetNode) {
      return `${this.sourceNode.name} & ${this.targetNode.name}`;
    }
    return 'Connection Details';
  }

  // Computed property for filtered shared events that updates reactively
  readonly filteredSharedEvents = computed(() => {
    const link = this._linkSignal();
    if (!link) return [];
    
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    // Get fresh shared events from data service
    const sharedEvents = this.dataService.getSharedEvents(sourceId, targetId);
    
    const filter = this.graphService.filter();
    return filter 
      ? sharedEvents.filter(e => e.type === filter)
      : sharedEvents;
  });
  
  constructor(
    private graphService: GraphService,
    private dataService: DataService
  ) {}

  selectNode(node: FriendNode, event: MouseEvent) {
    event.stopPropagation();
    
    // Find the corresponding node in the graph nodes to ensure we have the complete node data
    const nodes = this.graphService.nodes();
    const graphNode = nodes.find(n => n.id === node.id);
    
    if (graphNode) {
      this.graphService.selectNode(graphNode);
    }
  }
}