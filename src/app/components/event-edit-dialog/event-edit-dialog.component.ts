import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Event } from '../../models/event.model';
import { Friend } from '../../models/friend.model';

@Component({
  selector: 'app-event-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './event-edit-dialog.component.html',
  styleUrls: ['./event-edit-dialog.component.css']
})
export class EventEditDialogComponent {
  editedEvent: Event;
  availableFriends: Friend[];
  isNew: boolean;

  get isValid(): boolean {
    return !!(
      this.editedEvent.title &&
      this.editedEvent.date &&
      this.editedEvent.location &&
      this.editedEvent.attendees.length > 0
    );
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { event: Event; friends: Friend[]; isNew: boolean },
    private dialogRef: MatDialogRef<EventEditDialogComponent>
  ) {
    this.editedEvent = { ...data.event };
    this.availableFriends = data.friends;
    this.isNew = data.isNew;
  }

  onKeyDown(event: KeyboardEvent): void {
    // Check if Enter key is pressed and form is valid
    if (event.key === 'Enter' && this.isValid) {
      // Prevent default behavior to avoid triggering other actions
      event.preventDefault();
      event.stopPropagation();
      
      // Check if the target is not a textarea (allow Enter in description field)
      const target = event.target as HTMLElement;
      if (target.tagName.toLowerCase() !== 'textarea') {
        this.onSave();
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isValid) {
      this.dialogRef.close(this.editedEvent);
    }
  }
}