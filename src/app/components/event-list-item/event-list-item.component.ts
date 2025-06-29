import { Component, Input, Output, EventEmitter, effect, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event } from '../../models/event.model';
import { Friend } from '../../models/friend.model';
import { GraphService } from '../../services/graph.service';
import { DataService } from '../../services/data.service';
import { AttendeeListComponent } from '../attendee-list/attendee-list.component';

@Component({
  selector: 'app-event-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, AttendeeListComponent],
  templateUrl: './event-list-item.component.html',
  styleUrls: ['./event-list-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListItemComponent {
  @Input() event!: Event;
  @Input() showEditButton: boolean = true;
  @Output() editEventClicked = new EventEmitter<Event>();
  
  selectedType: string = '';

  private graphService = inject(GraphService);
  private dataService = inject(DataService);

  constructor() {
    // Use effect to react to filter signal changes
    effect(() => {
      this.selectedType = this.graphService.filter();
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  editEvent(event: Event, e?: MouseEvent): void {
    if (e) {
      e.stopPropagation();
    }
    this.editEventClicked.emit(event);
  }

  filterByType(type: string, e: MouseEvent): void {
    e.stopPropagation();
    
    // Toggle filter
    if (this.selectedType === type) {
      this.graphService.setFilter('');
    } else {
      this.graphService.setFilter(type);
    }
  }

  isTypeSelected(type: string): boolean {
    return this.selectedType === type;
  }

  // Handle attendee list events - now using data service methods
  onAttendeeAdded(data: { friend: Friend, targetEventId: string }): void {
    this.dataService.addAttendeeToEvent(data.friend.id, data.targetEventId);
  }

  onAttendeeRemoved(data: { friend: Friend, sourceEventId: string }): void {
    this.dataService.removeAttendeeFromEvent(data.friend.id, data.sourceEventId);
  }

  onAttendeeMoved(data: { friend: Friend, sourceEventId: string, targetEventId: string }): void {
    this.dataService.moveAttendeeBetweenEvents(data.friend.id, data.sourceEventId, data.targetEventId);
  }

  selectAttendee(attendee: Friend): void {
    // Find the corresponding node in the graph nodes
    const nodes = this.graphService.nodes();
    const node = nodes.find(n => n.id === attendee.id);
    
    if (node) {
      this.graphService.selectNode(node);
    }
  }
}