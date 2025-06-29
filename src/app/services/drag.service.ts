import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  private _isDragging = signal(false);
  private _draggedFriend = signal<any>(null);
  private _dragType = signal<'friend' | 'attendee' | null>(null);
  private _isDraggingAttendee = signal(false);
  private _isOverAnyDropList = signal(false);
  private _isOverDifferentEventDropList = signal(false);
  private _dragSourceEventId = signal<string | null>(null);
  private _isOverValidDropTarget = signal(false);
  private _currentDropListId = signal<string | null>(null);

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();
  readonly isDraggingAttendee = this._isDraggingAttendee.asReadonly();
  readonly isOverAnyDropList = this._isOverAnyDropList.asReadonly();
  readonly isOverDifferentEventDropList = this._isOverDifferentEventDropList.asReadonly();
  readonly dragSourceEventId = this._dragSourceEventId.asReadonly();
  readonly isOverValidDropTarget = this._isOverValidDropTarget.asReadonly();
  readonly currentDropListId = this._currentDropListId.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend', sourceEventId?: string): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
    this._isDraggingAttendee.set(type === 'attendee');
    this._isOverAnyDropList.set(false);
    this._isOverDifferentEventDropList.set(false);
    this._dragSourceEventId.set(sourceEventId || null);
    this._isOverValidDropTarget.set(false);
    this._currentDropListId.set(null);
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
    this._dragType.set(null);
    this._isDraggingAttendee.set(false);
    this._isOverAnyDropList.set(false);
    this._isOverDifferentEventDropList.set(false);
    this._dragSourceEventId.set(null);
    this._isOverValidDropTarget.set(false);
    this._currentDropListId.set(null);
  }

  setDropListState(dropListData: string, dragSourceEventId: string | null, isEntering: boolean): void {
    this._isOverAnyDropList.set(isEntering);
    
    if (isEntering) {
      this._currentDropListId.set(dropListData);
      
      // Check if this is a valid drop target
      const isValidTarget = this.isValidDropTarget(dropListData, dragSourceEventId);
      this._isOverValidDropTarget.set(isValidTarget);
      
      // Only set isOverDifferentEventDropList if we're over a different event's drop list
      if (dragSourceEventId && dropListData !== dragSourceEventId && dropListData !== 'friends-list') {
        this._isOverDifferentEventDropList.set(true);
      }
    } else {
      this._currentDropListId.set(null);
      this._isOverValidDropTarget.set(false);
      this._isOverDifferentEventDropList.set(false);
    }
  }

  private isValidDropTarget(dropListData: string, dragSourceEventId: string | null): boolean {
    const dragType = this._dragType();
    
    // If dragging a friend from friends list, any event drop list is valid
    if (dragType === 'friend') {
      return dropListData !== 'friends-list';
    }
    
    // If dragging an attendee
    if (dragType === 'attendee' && dragSourceEventId) {
      // Same list is always a valid target (prevents removal)
      if (dropListData === dragSourceEventId) {
        return true;
      }
      
      // Different event lists are valid targets
      if (dropListData !== 'friends-list' && dropListData !== dragSourceEventId) {
        return true;
      }
    }
    
    return false;
  }

  setOverValidDropTarget(isOver: boolean): void {
    // This method is kept for compatibility but the logic is now handled in setDropListState
    // We only update if we're not currently over a drop list (to avoid conflicts)
    if (!this._isOverAnyDropList()) {
      this._isOverValidDropTarget.set(isOver);
    }
  }
}