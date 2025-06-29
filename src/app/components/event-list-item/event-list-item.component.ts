import { Component, Input, Output, EventEmitter, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList, CdkDragStart, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Event } from '../../models/event.model';
import { Friend } from '../../models/friend.model';
import { GraphService } from '../../services/graph.service';
import { DataService } from '../../services/data.service';
import { DragService } from '../../services/drag.service';

@Component({
  selector: 'app-event-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, DragDropModule],
  templateUrl: './event-list-item.component.html',
  styleUrls: ['./event-list-item.component.css']
})
export class EventListItemComponent {
  @Input() event!: Event;
  @Input() showEditButton: boolean = true;
  @Output() editEventClicked = new EventEmitter<Event>();
  
  selectedType: string = '';
  showDropHint: boolean = false;

  private graphService = inject(GraphService);
  private dataService = inject(DataService);
  public dragService = inject(DragService);

  // Computed property to get attendees for this event
  attendees = computed(() => {
    const friends = this.dataService.friends();
    return friends.filter(friend => this.event.attendees.includes(friend.id));
  });

  // Computed property to check if dragging is active
  isDragging = computed(() => this.dragService.isDragging());

  // Computed property to check if the dragged friend is already an attendee
  isDraggedFriendAlreadyAttendee = computed(() => {
    const draggedFriend = this.dragService.draggedFriend();
    if (!draggedFriend) return false;
    
    // Handle both friend objects and attendee drag data
    const friendId = draggedFriend.id || draggedFriend.friend?.id;
    return this.event.attendees.includes(friendId);
  });

  // Predicate function to determine if a dragged item can be dropped into this list
  canEnterDropList = (drag: CdkDrag, drop: CdkDropList): boolean => {
    const dragData = drag.data;
    const targetEventId = drop.data;
    
    // If dragging a friend from friends list
    if (dragData.id) {
      // Don't allow if friend is already an attendee
      return !this.event.attendees.includes(dragData.id);
    }
    
    // If dragging an attendee from another event
    if (dragData.friend && dragData.sourceEventId) {
      // Don't allow if it's the same event or friend is already an attendee
      return dragData.sourceEventId !== targetEventId && 
             !this.event.attendees.includes(dragData.friend.id);
    }
    
    return false;
  };

  constructor() {
    // Use effect to react to filter signal changes
    effect(() => {
      this.selectedType = this.graphService.filter();
    });

    // Effect to show/hide drop hint based on drag state
    effect(() => {
      const isDragging = this.isDragging();
      this.showDropHint = isDragging;
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

  onCdkDragStarted(event: CdkDragStart): void {
    const dragData = event.source.data;
    this.dragService.startDrag(dragData.friend, 'attendee');
  }

  onCdkDragEnded(event: CdkDragEnd): void {
    const dragData = event.source.data;
    
    // If the item was not dropped into a valid drop container, remove it from the source event
    if (!event.dropPoint || !event.source.dropContainer) {
      // Check if the drop point is outside the viewport or not over a valid drop zone
      const sourceEventId = dragData.sourceEventId;
      const friendId = dragData.friend.id;
      
      if (sourceEventId) {
        const sourceEvent = this.dataService.events().find(e => e.id === sourceEventId);
        if (sourceEvent) {
          const updatedEvent: Event = {
            ...sourceEvent,
            attendees: sourceEvent.attendees.filter(id => id !== friendId)
          };
          this.dataService.updateEvent(updatedEvent);
        }
      }
    }
    
    this.dragService.endDrag();
  }

  onCdkDropListDropped(event: CdkDragDrop<any, any, any>): void {
    const draggedItem = event.item.data;
    const targetEventId = event.container.data;
    
    // If dragging a friend from friends list
    if (draggedItem.id) {
      // Check if friend is not already an attendee
      if (!this.event.attendees.includes(draggedItem.id)) {
        const updatedEvent: Event = {
          ...this.event,
          attendees: [...this.event.attendees, draggedItem.id]
        };
        this.dataService.updateEvent(updatedEvent);
      }
    }
    
    // If dragging an attendee from another event
    if (draggedItem.friend && draggedItem.sourceEventId) {
      const sourceEventId = draggedItem.sourceEventId;
      const friendId = draggedItem.friend.id;
      
      // Only proceed if it's a different event
      if (sourceEventId !== targetEventId) {
        // Remove from source event
        const sourceEvent = this.dataService.events().find(e => e.id === sourceEventId);
        if (sourceEvent) {
          const updatedSourceEvent: Event = {
            ...sourceEvent,
            attendees: sourceEvent.attendees.filter(id => id !== friendId)
          };
          this.dataService.updateEvent(updatedSourceEvent);
        }

        // Add to target event if not already present
        if (!this.event.attendees.includes(friendId)) {
          const updatedEvent: Event = {
            ...this.event,
            attendees: [...this.event.attendees, friendId]
          };
          this.dataService.updateEvent(updatedEvent);
        }
      }
    }
  }
}