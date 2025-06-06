import { Component, Input, Output, EventEmitter, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event } from '../../models/event.model';
import { Friend } from '../../models/friend.model';
import { GraphService } from '../../services/graph.service';
import { DataService } from '../../services/data.service';
import { DragService } from '../../services/drag.service';

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
    return this.event.attendees.includes(draggedFriend.id);
  });

  // Computed property to check if this event is the source of the drag
  isDragSource = computed(() => {
    const draggedFromEventId = this.dragService.draggedFromEventId();
    return draggedFromEventId === this.event.id;
  });

  // Computed property to get the drag action for this event
  dragAction = computed(() => {
    if (!this.isDragSource()) return 'none';
    return this.dragService.getDropAction();
  });

  constructor() {
    // Use effect to react to filter signal changes
    effect(() => {
      this.selectedType = this.graphService.filter();
    });

    // Effect to clear local drag state when dragging ends
    effect(() => {
      const isDragging = this.isDragging();
      if (!isDragging) {
        // Clear local drag over state when dragging ends
        this.isDragOver = false;
      }
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
    // Only handle if dragging is active
    if (!this.isDragging()) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
    
    // Update drop target in drag service
    this.dragService.setDropTarget(this.event.id);
  }

  onDragLeave(event: DragEvent): void {
    // Only handle if dragging is active
    if (!this.isDragging()) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // Check if we're actually leaving this element (not just moving to a child)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.isDragOver = false;
      // Clear drop target if leaving this event
      this.dragService.setDropTarget(null);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    // Clear drop target
    this.dragService.setDropTarget(null);

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

    // Handle attendee being moved from another event
    const attendeeData = event.dataTransfer?.getData('application/attendee');
    if (attendeeData) {
      try {
        const { friend, sourceEventId } = JSON.parse(attendeeData);
        
        // Only proceed if this is a different event
        if (sourceEventId !== this.event.id) {
          // Remove from source event
          const sourceEvent = this.dataService.events().find(e => e.id === sourceEventId);
          if (sourceEvent) {
            const updatedSourceEvent: Event = {
              ...sourceEvent,
              attendees: sourceEvent.attendees.filter(id => id !== friend.id)
            };
            this.dataService.updateEvent(updatedSourceEvent);
          }

          // Add to this event if not already present
          if (!this.event.attendees.includes(friend.id)) {
            const updatedEvent: Event = {
              ...this.event,
              attendees: [...this.event.attendees, friend.id]
            };
            this.dataService.updateEvent(updatedEvent);
          }
        }
      } catch (error) {
        console.error('Error parsing dropped attendee data:', error);
      }
    }

    // End the drag operation here - this is where the drag completes successfully
    this.dragService.endDrag();
  }

  onAttendeeDragStart(event: DragEvent, attendee: Friend): void {
    event.stopPropagation();
    
    if (event.dataTransfer) {
      // Set attendee data with source event information
      const attendeeData = {
        friend: attendee,
        sourceEventId: this.event.id
      };
      
      event.dataTransfer.setData('application/attendee', JSON.stringify(attendeeData));
      event.dataTransfer.effectAllowed = 'move';
      
      // Find the avatar image element and use it as the drag image
      const avatarImg = (event.target as HTMLElement).closest('.attendee-avatar') as HTMLImageElement;
      if (avatarImg) {
        // Use the existing avatar image as the drag image
        event.dataTransfer.setDragImage(avatarImg, 12, 12); // Center the 24px image
      }
      
      // Use setTimeout to delay the drag service notification slightly
      // This ensures the drag operation starts properly before we hide the avatar
      setTimeout(() => {
        this.dragService.startDrag(attendee, 'attendee', this.event.id);
      }, 0);
    }
  }

  onAttendeeDragEnd(event: DragEvent): void {
    // The global drop handler in AppComponent will handle removal if needed
    // Just notify drag service that dragging has ended
    this.dragService.endDrag();
  }
}