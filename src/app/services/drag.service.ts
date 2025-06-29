import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  private _isDragging = signal(false);
  private _draggedFriend = signal<any>(null);
  private _dragType = signal<'friend' | 'attendee' | null>(null);
  private _isDraggingAttendee = signal(false);
  private _isOverValidDropTarget = signal(false);
  private _dragSourceEventId = signal<string | null>(null);

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();
  readonly isDraggingAttendee = this._isDraggingAttendee.asReadonly();
  readonly isOverValidDropTarget = this._isOverValidDropTarget.asReadonly();
  readonly dragSourceEventId = this._dragSourceEventId.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend', sourceEventId?: string): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
    this._isDraggingAttendee.set(type === 'attendee');
    this._isOverValidDropTarget.set(false);
    this._dragSourceEventId.set(sourceEventId || null);
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
    this._dragType.set(null);
    this._isDraggingAttendee.set(false);
    this._isOverValidDropTarget.set(false);
    this._dragSourceEventId.set(null);
  }

  setOverValidDropTarget(isOver: boolean): void {
    this._isOverValidDropTarget.set(isOver);
  }
}