import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Friend } from '../../models/friend.model';

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
      
      // Create a custom drag image using the friend's avatar
      const dragImage = new Image();
      dragImage.src = this.friend.photoUrl;
      dragImage.width = 48;
      dragImage.height = 48;
      event.dataTransfer.setDragImage(dragImage, 24, 24);
    }
  }
}