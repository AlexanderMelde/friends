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
      // Allow dropping on same event (this prevents removal)
      if (dragData.sourceEventId === targetEventId) {
        return true;
      }
      
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
   * 3. We're not over a valid drop target (meaning it will be removed)
   * 4. The current event is the source event where the drag started
   */
  public isDraggingAttendeeForRemoval(attendee: { id: string }): boolean {
    const isDraggingAttendee = this.dragService.isDraggingAttendee();
    const isOverValidTarget = this.dragService.isOverValidDropTarget();
    const draggedFriend = this.dragService.draggedFriend();
    const dragSourceEventId = this.dragService.dragSourceEventId();
    
    if (!isDraggingAttendee || isOverValidTarget || !draggedFriend) {
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
    
    // Check if we were dragging an attendee and it wasn't dropped over a valid target
    // BUT only remove if it wasn't dropped back on the same list
    if (this.dragService.isDraggingAttendee() && !this.dragService.isOverValidDropTarget()) {
      const sourceEventId = dragData.sourceEventId;
      const friend = dragData.friend;
      const currentDropListId = this.dragService.currentDropListId();
      
      // Only remove if we're not dropping back on the same list
      // If currentDropListId is null, it means we're dropping outside any drop list
      // If currentDropListId equals sourceEventId, it means we dropped on the same list
      if (sourceEventId && friend && currentDropListId !== sourceEventId) {
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
      return; // Exit early for friend drops
    }
    
    // If dragging an attendee from another event (or same event)
    if (draggedItem.friend && draggedItem.sourceEventId) {
      const sourceEventId = draggedItem.sourceEventId;
      const friend = draggedItem.friend;
      
      // If dropping on the same list, do nothing (this prevents removal)
      if (sourceEventId === targetEventId) {
        return; // Exit early - no action needed for same-list drops
      }
      
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