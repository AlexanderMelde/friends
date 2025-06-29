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

  /**
   * Check if a specific attendee is being dragged for removal
   * This happens when:
   * 1. We're dragging an attendee (not a friend from the friends list)
   * 2. The dragged attendee is this specific attendee
   * 3. We're not over a different event's drop list (meaning it will be removed)
   * 4. The current event is the source event where the drag started
   */
  public isDraggingAttendeeForRemoval(attendee: { id: string }): boolean {
    const isDraggingAttendee = this.dragService.isDraggingAttendee();
    const isOverDifferentEvent = this.dragService.isOverDifferentEventDropList();
    const draggedFriend = this.dragService.draggedFriend();
    const dragSourceEventId = this.dragService.dragSourceEventId();
    
    if (!isDraggingAttendee || isOverDifferentEvent || !draggedFriend) {
      return false;
    }
    
    // Only show trash bin in the source event where the drag started
    if (dragSourceEventId !== this.event.id) {
      return false;
    }
    
    // Check if this specific attendee is the one being dragged
    const draggedFriendId = draggedFriend.friend?.id || draggedFriend.id;
    return draggedFriendId === attendee.id;
  }

  selectAttendee(attendee: { id: string }, e: MouseEvent): void {
    e.stopPropagation();
    this.graphService.selectAttendeeById(attendee.id);
  }

  onCdkDragStarted(event: CdkDragStart): void {
    const dragData = event.source.data;
    // Pass the source event ID when starting the drag
    this.dragService.startDrag(dragData.friend, 'attendee', this.event.id);
  }

  onCdkDragEnded(event: CdkDragEnd): void {
    const dragData = event.source.data;
    
    // Check if we were dragging an attendee and it wasn't dropped over a different event
    if (this.dragService.isDraggingAttendee() && !this.dragService.isOverDifferentEventDropList()) {
      const sourceEventId = dragData.sourceEventId;
      const friend = dragData.friend;
      
      if (sourceEventId && friend) {
        this.dataService.removeAttendeeFromEvent(friend.id, sourceEventId);
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
        this.dataService.addAttendeeToEvent(draggedItem.id, this.event.id);
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
          this.dataService.moveAttendeeBetweenEvents(friend.id, sourceEventId, this.event.id);
        }
      }
    }
  }
}