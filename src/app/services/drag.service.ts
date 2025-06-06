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

  readonly isDragging = this._isDragging.asReadonly();
  readonly draggedFriend = this._draggedFriend.asReadonly();
  readonly dragType = this._dragType.asReadonly();
  readonly draggedFromEventId = this._draggedFromEventId.asReadonly();
  readonly currentDropTarget = this._currentDropTarget.asReadonly();

  startDrag(friend: any, type: 'friend' | 'attendee' = 'friend', fromEventId?: string): void {
    this._isDragging.set(true);
    this._draggedFriend.set(friend);
    this._dragType.set(type);
    this._draggedFromEventId.set(fromEventId || null);
    this._currentDropTarget.set(null);
  }

  setDropTarget(eventId: string | null): void {
    this._currentDropTarget.set(eventId);
  }

  endDrag(): void {
    this._isDragging.set(false);
    this._draggedFriend.set(null);
    this._dragType.set(null);
    this._draggedFromEventId.set(null);
    this._currentDropTarget.set(null);
    
    // Remove all drag highlights from the DOM
    this.clearAllDragHighlights();
  }

  private clearAllDragHighlights(): void {
    // Use setTimeout to ensure this runs after the current event loop
    // This allows any pending DOM updates to complete first
    setTimeout(() => {
      // Remove drag-active class from all attendee-avatars
      const dragActiveElements = document.querySelectorAll('.attendee-avatars.drag-active');
      dragActiveElements.forEach(element => {
        element.classList.remove('drag-active');
      });

      // Remove drag-hover class from all attendee-avatars
      const dragHoverElements = document.querySelectorAll('.attendee-avatars.drag-hover');
      dragHoverElements.forEach(element => {
        element.classList.remove('drag-hover');
      });

      // Remove drag-source class from all attendee-avatars
      const dragSourceElements = document.querySelectorAll('.attendee-avatars.drag-source');
      dragSourceElements.forEach(element => {
        element.classList.remove('drag-source');
      });

      // Remove drop-zone class from all attendee-avatars
      const dropZoneElements = document.querySelectorAll('.attendee-avatars.drop-zone');
      dropZoneElements.forEach(element => {
        element.classList.remove('drop-zone');
      });
    }, 0);
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