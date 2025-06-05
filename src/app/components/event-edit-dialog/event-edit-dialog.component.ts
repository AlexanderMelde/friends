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
  template: `
    <h2 mat-dialog-title>{{ isNew ? 'Add' : 'Edit' }} Event</h2>
    <mat-dialog-content>
      <div class="form-container">
        <mat-form-field appearance="fill">
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="editedEvent.title" required>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="editedEvent.date" required>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Location</mat-label>
          <input matInput [(ngModel)]="editedEvent.location" required>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Type</mat-label>
          <input matInput [(ngModel)]="editedEvent.type">
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="editedEvent.description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Attendees</mat-label>
          <mat-select [(ngModel)]="editedEvent.attendees" multiple>
            <mat-option *ngFor="let friend of availableFriends" [value]="friend.id">
              {{friend.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" (click)="onSave()" [disabled]="!isValid">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 300px;
      padding: 16px 0;
    }
  `]
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

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isValid) {
      this.dialogRef.close(this.editedEvent);
    }
  }
}