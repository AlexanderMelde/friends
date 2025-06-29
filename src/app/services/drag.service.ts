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

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();
  readonly isDraggingAttendee = this._isDraggingAttendee.asReadonly();
  readonly isOverValidDropTarget = this._isOverValidDropTarget.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend'): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
    this._isDraggingAttendee.set(type === 'attendee');
    this._isOverValidDropTarget.set(false);
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
    this._dragType.set(null);
    this._isDraggingAttendee.set(false);
    this._isOverValidDropTarget.set(false);
  }

  setOverValidDropTarget(isOver: boolean): void {
    this._isOverValidDropTarget.set(isOver);
  }
}