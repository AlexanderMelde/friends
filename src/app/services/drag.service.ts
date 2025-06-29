import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  private _isDragging = signal(false);
  private _draggedFriend = signal<any>(null);
  private _dragType = signal<'friend' | 'attendee' | null>(null);
  private _isOverValidDropZone = signal(false);
  private _draggedFromEventId = signal<string | null>(null);

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();
  readonly isOverValidDropZone = this._isOverValidDropZone.asReadonly();
  readonly draggedFromEventId = this._draggedFromEventId.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend', sourceEventId?: string): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
    this._isOverValidDropZone.set(false);
    this._draggedFromEventId.set(sourceEventId || null);
  }

  setOverValidDropZone(isOver: boolean): void {
    this._isOverValidDropZone.set(isOver);
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
    this._dragType.set(null);
    this._isOverValidDropZone.set(false);
    this._draggedFromEventId.set(null);
  }

  shouldShowTrashBin(): boolean {
    return this._isDragging() && 
           this._dragType() === 'attendee' && 
           !this._isOverValidDropZone();
  }
}