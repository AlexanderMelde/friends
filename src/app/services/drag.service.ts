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

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();
  readonly isDraggingAttendee = this._isDraggingAttendee.asReadonly();
  readonly isOverAnyDropList = this._isOverAnyDropList.asReadonly();
  readonly isOverDifferentEventDropList = this._isOverDifferentEventDropList.asReadonly();
  readonly dragSourceEventId = this._dragSourceEventId.asReadonly();
  readonly isOverValidDropTarget = this._isOverValidDropTarget.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend', sourceEventId?: string): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
    this._isDraggingAttendee.set(type === 'attendee');
    this._isOverAnyDropList.set(false);
    this._isOverDifferentEventDropList.set(false);
    this._dragSourceEventId.set(sourceEventId || null);
    this._isOverValidDropTarget.set(false);
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
  }

  setDropListState(dropListData: string, dragSourceEventId: string | null, isEntering: boolean): void {
    this._isOverAnyDropList.set(isEntering);
    
    // Only set isOverDifferentEventDropList if we're over a different event's drop list
    if (isEntering && dragSourceEventId && dropListData !== dragSourceEventId && dropListData !== 'friends-list') {
      this._isOverDifferentEventDropList.set(true);
    } else if (!isEntering) {
      this._isOverDifferentEventDropList.set(false);
    }
  }

  setOverValidDropTarget(isOver: boolean): void {
    this._isOverValidDropTarget.set(isOver);
  }
}