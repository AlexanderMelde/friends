import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  private _isDragging = signal(false);
  private _draggedFriend = signal<any>(null);
  private _dragType = signal<'friend' | 'attendee' | null>(null);

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend'): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
    this._dragType.set(null);
  }
}