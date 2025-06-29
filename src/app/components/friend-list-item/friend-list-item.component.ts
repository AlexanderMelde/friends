import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Friend } from '../../models/friend.model';
import { DragService } from '../../services/drag.service';

@Component({
  selector: 'app-friend-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, DragDropModule],
  templateUrl: './friend-list-item.component.html',
  styleUrls: ['./friend-list-item.component.css']
})
export class FriendListItemComponent {
  @Input() friend!: Friend & { eventCount: number };
  @Input() compactView: boolean = false;
  @Input() showEditButton: boolean = true;
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

  onCdkDragStarted(): void {
    this.dragService.startDrag(this.friend, 'friend');
  }

  onCdkDragEnded(): void {
    this.dragService.endDrag();
  }
}