import { Component, Input, Output, EventEmitter, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event } from '../../models/event.model';
import { Friend } from '../../models/friend.model';
import { GraphService } from '../../services/graph.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-event-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './event-list-item.component.html',
  styleUrls: ['./event-list-item.component.css']
})
export class EventListItemComponent {
  @Input() event!: Event;
  @Input() showEditButton: boolean = true;
  @Output() editEventClicked = new EventEmitter<Event>();
  
  selectedType: string = '';
  isDragOver: boolean = false;

  private graphService = inject(GraphService);
  private dataService = inject(DataService);

  // Computed property to get attendees for this event
  attendees = computed(() => {
    const friends = this.dataService.friends();
    return friends.filter(friend => this.event.attendees.includes(friend.id));
  });

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

  selectAttendee(attendee: Friend, e: MouseEvent): void {
    e.stopPropagation();
    
    // Find the corresponding node in the graph nodes
    const nodes = this.graphService.nodes();
    const node = nodes.find(n => n.id === attendee.id);
    
    if (node) {
      this.graphService.selectNode(node);
    }
  }

  isTypeSelected(type: string): boolean {
    return this.selectedType === type;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const friendData = event.dataTransfer?.getData('application/json');
    if (friendData) {
      try {
        const friend: Friend = JSON.parse(friendData);
        
        // Check if friend is already an attendee
        if (!this.event.attendees.includes(friend.id)) {
          // Update the event to include the new attendee
          const updatedEvent: Event = {
            ...this.event,
            attendees: [...this.event.attendees, friend.id]
          };
          
          // Update the event in the data service
          this.dataService.updateEvent(updatedEvent);
        }
      } catch (error) {
        console.error('Error parsing dropped friend data:', error);
      }
    }
  }
}