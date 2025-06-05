import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Friend</h2>
    <mat-dialog-content>
      <div class="form-container">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="friend.name" required>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Photo URL</mat-label>
          <div class="photo-url-container">
            <input matInput [(ngModel)]="friend.photoUrl" required>
            <button mat-icon-button 
                    type="button" 
                    (click)="getRandomPicture()"
                    matTooltip="Get Random Picture"
                    class="random-picture-button">
              <mat-icon>shuffle</mat-icon>
            </button>
          </div>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Bio</mat-label>
          <textarea matInput [(ngModel)]="friend.bio" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Events</mat-label>
          <mat-select [(ngModel)]="selectedEvents" multiple>
            <mat-option *ngFor="let event of availableEvents" [value]="event.id">
              {{event.title}}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" (click)="onSave()">Save</button>
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

    .photo-url-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .random-picture-button {
      margin-top: -16px;
      margin-bottom: -16px;
    }

    ::ng-deep .photo-url-container .mat-form-field-infix {
      width: calc(100% - 40px) !important;
    }
  `]
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
        eventCount: 0,
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
    this.friend.eventCount = this.selectedEvents.length;
    this.dialogRef.close({
      friend: this.friend,
      selectedEvents: this.selectedEvents
    });
  }
}