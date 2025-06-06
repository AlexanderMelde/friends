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
      
      // Notify drag service that dragging has started
      this.dragService.startDrag(this.friend);
      
      // Create a circular drag image
      const canvas = document.createElement('canvas');
      const size = 48; // Size of the drag image
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
        ctx.clip();
        
        // Load and draw the friend's photo
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw the image to fill the circle
          ctx.drawImage(img, 0, 0, size, size);
          
          // Add a border
          ctx.globalCompositeOperation = 'source-over';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
          ctx.strokeStyle = '#3F51B5';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Convert canvas to image and set as drag image
          const dragImage = new Image();
          dragImage.src = canvas.toDataURL();
          dragImage.onload = () => {
            event.dataTransfer!.setDragImage(dragImage, size / 2, size / 2);
          };
        };
        
        // Fallback: if image fails to load, create a simple colored circle
        img.onerror = () => {
          ctx.fillStyle = '#3F51B5';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
          ctx.fill();
          
          // Add friend's initials
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const initials = this.friend.name.split(' ').map(n => n[0]).join('').toUpperCase();
          ctx.fillText(initials, size / 2, size / 2);
          
          const dragImage = new Image();
          dragImage.src = canvas.toDataURL();
          dragImage.onload = () => {
            event.dataTransfer!.setDragImage(dragImage, size / 2, size / 2);
          };
        };
        
        img.src = this.friend.photoUrl;
      }
    }
  }

  onDragEnd(event: DragEvent): void {
    // Notify drag service that dragging has ended
    this.dragService.endDrag();
  }
}