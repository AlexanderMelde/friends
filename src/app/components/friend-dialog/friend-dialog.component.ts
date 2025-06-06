import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Friend } from '../../models/friend.model';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-friend-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './friend-dialog.component.html',
  styleUrls: ['./friend-dialog.component.css']
})
export class FriendDialogComponent {
  friend: Friend;
  availableEvents: Event[];
  selectedEvents: string[] = [];
  isEdit: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { friend?: Friend; events: Event[]; isEdit: boolean },
    private dialogRef: MatDialogRef<FriendDialogComponent>
  ) {
    this.isEdit = data.isEdit;
    this.availableEvents = data.events;
    
    if (data.friend) {
      this.friend = { ...data.friend };
      this.selectedEvents = this.availableEvents
        .filter(event => event.attendees.includes(data.friend!.id))
        .map(event => event.id);
    } else {
      this.friend = {
        id: crypto.randomUUID(),
        name: '',
        photoUrl: '',
        bio: '',
        joinDate: new Date()
      };
    }
  }

  getRandomPicture(): void {
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    const number = Math.floor(Math.random() * 99);
    this.friend.photoUrl = `https://randomuser.me/api/portraits/${gender}/${number}.jpg`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({
      friend: this.friend,
      selectedEvents: this.selectedEvents
    });
  }
}