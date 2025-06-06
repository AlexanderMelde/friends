import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  private _isDragging = signal(false);
  private _draggedFriend = signal<any>(null);

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();

  startDrag(friend: any): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
  }
}