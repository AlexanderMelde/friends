import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friend } from '../../models/friend.model';

@Component({
  selector: 'app-friend-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-list-item.component.html',
  styleUrls: ['./friend-list-item.component.css']
})
export class FriendListItemComponent {
  @Input() friend!: Friend & { eventCount: number };
  @Output() friendSelected = new EventEmitter<Friend & { eventCount: number }>();

  selectFriend(event: MouseEvent): void {
    event.stopPropagation();
    this.friendSelected.emit(this.friend);
  }
}