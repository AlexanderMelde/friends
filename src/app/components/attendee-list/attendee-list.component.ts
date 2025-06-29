import { Component, Input, computed, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList, CdkDragStart, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Event } from '../../models/event.model';
import { GraphService } from '../../services/graph.service';
import { DataService } from '../../services/data.service';
import { DragService } from '../../services/drag.service';

@Component({
  selector: 'app-attendee-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, DragDropModule],
  templateUrl: './attendee-list.component.html',
  styleUrls: ['./attendee-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendeeListComponent {
  @Input() event!: Event;

  private graphService = inject(GraphService);
  private dataService = inject(DataService);
  public dragService = inject(DragService);

  showDropHint: boolean = false;

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
    // Effect to show/hide drop hint based on drag state
    effect(() => {
      this.showDropHint = this.dragService.isDragging();
    });
  }

  selectAttendee(attendee: { id: string }, e: MouseEvent): void {
    e.stopPropagation();
    this.graphService.selectAttendeeById(attendee.id);
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
      const friend = dragData.friend;
      
      if (sourceEventId && friend) {
        this.removeAttendeeFromEvent(friend.id, sourceEventId);
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
        this.addAttendeeToEvent(draggedItem.id, this.event.id);
      }
    }
    
    // If dragging an attendee from another event
    if (draggedItem.friend && draggedItem.sourceEventId) {
      const sourceEventId = draggedItem.sourceEventId;
      const friend = draggedItem.friend;
      
      // Only proceed if it's a different event
      if (sourceEventId !== targetEventId) {
        // Check if friend is not already an attendee in target event
        if (!this.event.attendees.includes(friend.id)) {
          this.moveAttendeeBetweenEvents(friend.id, sourceEventId, this.event.id);
        }
      }
    }
  }

  // Attendee management methods - moved from data service
  private async addAttendeeToEvent(friendId: string, eventId: string): Promise<void> {
    try {
      const event = await this.dataService.getEvent(eventId);
      if (!event) {
        throw new Error(`Event with id ${eventId} not found`);
      }

      // Check if friend is not already an attendee
      if (!event.attendees.includes(friendId)) {
        const updatedEvent = {
          ...event,
          attendees: [...event.attendees, friendId]
        };
        
        await this.dataService.updateEvent(updatedEvent);
      }
    } catch (error) {
      console.error('Failed to add attendee to event:', error);
    }
  }

  private async removeAttendeeFromEvent(friendId: string, eventId: string): Promise<void> {
    try {
      const event = await this.dataService.getEvent(eventId);
      if (!event) {
        throw new Error(`Event with id ${eventId} not found`);
      }

      const updatedEvent = {
        ...event,
        attendees: event.attendees.filter(id => id !== friendId)
      };
      
      await this.dataService.updateEvent(updatedEvent);
    } catch (error) {
      console.error('Failed to remove attendee from event:', error);
    }
  }

  private async moveAttendeeBetweenEvents(friendId: string, sourceEventId: string, targetEventId: string): Promise<void> {
    try {
      // Remove from source event
      const sourceEvent = await this.dataService.getEvent(sourceEventId);
      if (sourceEvent) {
        const updatedSourceEvent = {
          ...sourceEvent,
          attendees: sourceEvent.attendees.filter(id => id !== friendId)
        };
        await this.dataService.updateEvent(updatedSourceEvent);
      }

      // Add to target event
      const targetEvent = await this.dataService.getEvent(targetEventId);
      if (targetEvent && !targetEvent.attendees.includes(friendId)) {
        const updatedTargetEvent = {
          ...targetEvent,
          attendees: [...targetEvent.attendees, friendId]
        };
        await this.dataService.updateEvent(updatedTargetEvent);
      }
    } catch (error) {
      console.error('Failed to move attendee between events:', error);
    }
  }
}