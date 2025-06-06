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
      
      // Find the avatar image element within the friend item and use it as the drag image
      const friendItem = event.currentTarget as HTMLElement;
      const avatarImg = friendItem.querySelector('.friend-avatar')?.cloneNode(true) as HTMLImageElement;
      if (avatarImg) {
        // Use the existing avatar image as the drag image
        avatarImg.style.height = "24px";
        avatarImg.style.width = "24px";
        event.dataTransfer.setDragImage(avatarImg, 12, 12);
      }
      
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
}