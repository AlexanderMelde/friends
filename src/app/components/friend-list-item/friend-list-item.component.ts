import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Friend } from '../../models/friend.model';
import { DragService } from '../../services/drag.service';

@Component({
  selector: 'app-friend-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './friend-list-item.component.html',
  styleUrls: ['./friend-list-item.component.css']
})
export class FriendListItemComponent {
  @Input() friend!: Friend & { eventCount: number };
  @Output() friendSelected = new EventEmitter<Friend & { eventCount: number }>();
  @Output() editFriendRequested = new EventEmitter<Friend & { eventCount: number }>();

  private dragService = inject(DragService);

  selectFriend(event: MouseEvent): void {
    event.stopPropagation();
    this.friendSelected.emit(this.friend);
  }

  editFriend(event: MouseEvent): void {
    event.stopPropagation();
    this.editFriendRequested.emit(this.friend);
  }

  onDragStart(event: DragEvent): void {
    if (event.dataTransfer) {
      // Set the friend data as JSON string
      event.dataTransfer.setData('application/json', JSON.stringify(this.friend));
      event.dataTransfer.effectAllowed = 'copy';
      
      // Create drag image first, then notify drag service
      this.createSimpleDragImage(event, this.friend.name, '#3F51B5', 48);
      
      // Use setTimeout to ensure drag image is set before starting drag service
      setTimeout(() => {
        this.dragService.startDrag(this.friend, 'friend');
      }, 0);
    }
  }

  onDragEnd(event: DragEvent): void {
    // Notify drag service that dragging has ended
    this.dragService.endDrag();
  }

  private createSimpleDragImage(event: DragEvent, name: string, borderColor: string, size: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Fill with a solid color background
      ctx.fillStyle = borderColor;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add initials
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      ctx.fillText(initials, size / 2, size / 2);
      
      // Convert canvas to blob and create object URL for better reliability
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const dragImage = new Image();
          dragImage.onload = () => {
            event.dataTransfer!.setDragImage(dragImage, size / 2, size / 2);
            URL.revokeObjectURL(url); // Clean up
          };
          dragImage.src = url;
        }
      });
      
      // Fallback: also try the immediate approach
      try {
        const dataUrl = canvas.toDataURL();
        const fallbackImage = new Image();
        fallbackImage.src = dataUrl;
        event.dataTransfer!.setDragImage(fallbackImage, size / 2, size / 2);
      } catch (e) {
        // If both fail, the browser will use default drag image
        console.warn('Could not set custom drag image');
      }
    }
  }
}