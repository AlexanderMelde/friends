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

  get isValid(): boolean {
    return !!(this.friend.name && this.friend.photoUrl);
  }

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

  onKeyDown(event: KeyboardEvent): void {
    // Check if Enter key is pressed and form is valid
    if (event.key === 'Enter' && this.isValid) {
      // Prevent default behavior to avoid triggering other actions
      event.preventDefault();
      event.stopPropagation();
      
      // Check if the target is not a textarea (allow Enter in bio field)
      const target = event.target as HTMLElement;
      if (target.tagName.toLowerCase() !== 'textarea') {
        this.onSave();
      }
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
    if (this.isValid) {
      this.dialogRef.close({
        friend: this.friend,
        selectedEvents: this.selectedEvents
      });
    }
  }
}