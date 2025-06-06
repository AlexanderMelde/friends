import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  private _isDragging = signal(false);
  private _draggedFriend = signal<any>(null);
  private _dragType = signal<'friend' | 'attendee' | null>(null);
  private _draggedFromEventId = signal<string | null>(null);
  private _currentDropTarget = signal<string | null>(null);
  private _dropSuccessful = signal(false);

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();
  readonly draggedFromEventId = this._draggedFromEventId.asReadonly();
  readonly currentDropTarget = this._currentDropTarget.asReadonly();
  readonly dropSuccessful = this._dropSuccessful.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend', fromEventId?: string): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
    this._draggedFromEventId.set(fromEventId || null);
    this._currentDropTarget.set(null);
    this._dropSuccessful.set(false);
  }

  setDropTarget(eventId: string | null): void {
    this._currentDropTarget.set(eventId);
    // If a drop target is set, mark as potentially successful
    if (eventId !== null) {
      this._dropSuccessful.set(true);
    }
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
    this._dragType.set(null);
    this._draggedFromEventId.set(null);
    this._currentDropTarget.set(null);
    this._dropSuccessful.set(false);
  }

  // Helper to determine if the current drag will result in a move or delete
  getDropAction(): 'move' | 'delete' | 'none' {
    const dragType = this._dragType();
    const fromEventId = this._draggedFromEventId();
    const dropTarget = this._currentDropTarget();

    if (dragType !== 'attendee' || !fromEventId) {
      return 'none';
    }

    if (dropTarget && dropTarget !== fromEventId) {
      return 'move';
    }

    if (dropTarget === null) {
      return 'delete';
    }

    return 'none';
  }
}