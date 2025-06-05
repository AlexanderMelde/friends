import { Component, Input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event } from '../../models/event.model';
import { DataService } from '../../services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { EventEditDialogComponent } from '../event-edit-dialog/event-edit-dialog.component';
import { GraphService } from '../../services/graph.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="events-list">
      <h3 class="section-title">
        <mat-icon class="section-icon">event</mat-icon>
        {{ title }}
      </h3>
      <div *ngFor="let event of events" class="event-item">
        <div class="event-date">{{ formatDate(event.date) }}</div>
        <div class="event-details">
          <div class="event-title">
            {{ event.title }}
            <button mat-icon-button (click)="editEvent(event, $event)" class="edit-button">
              <mat-icon>edit</mat-icon>
            </button>
          </div>
          <div class="event-type" 
               *ngIf="event.type" 
               (click)="filterByType(event.type, $event)"
               [class.active]="isTypeSelected(event.type)">
            {{ event.type }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .events-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .section-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 12px 0;
      color: #333;
      display: flex;
      align-items: center;
    }

    .section-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
      margin-right: 8px;
      color: #3F51B5;
    }

    .event-item {
      display: flex;
      margin-bottom: 12px;
    }

    .event-item:last-child {
      margin-bottom: 0;
    }

    .event-date {
      font-size: 12px;
      color: #666;
      min-width: 80px;
      margin-right: 8px;
    }

    .event-details {
      flex: 1;
    }

    .event-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .event-type {
      font-size: 12px;
      color: #666;
      padding: 2px 8px;
      background-color: #f0f0f0;
      border-radius: 12px;
      display: inline-block;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .event-type:hover {
      background-color: #e0e0e0;
    }

    .event-type.active {
      background-color: #3F51B5;
      color: white;
    }

    .edit-button {
      opacity: 0.6;
      transition: opacity 0.2s;
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .edit-button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }

    .edit-button:hover {
      opacity: 1;
    }
  `]
})
export class EventsListComponent {
  @Input() events: Event[] = [];
  @Input() title: string = 'Events';
  selectedType: string = '';

  constructor(
    private dialog: MatDialog,
    private dataService: DataService,
    private graphService: GraphService
  ) {
    // Use effect to react to filter signal changes
    effect(() => {
      this.selectedType = this.graphService.filter();
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  editEvent(event: Event, e?: MouseEvent): void {
    if (e) {
      e.stopPropagation();
    }
    
    const dialogRef = this.dialog.open(EventEditDialogComponent, {
      data: { event, friends: this.dataService.friends() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.updateEvent(result);
      }
    });
  }

  filterByType(type: string, e: MouseEvent): void {
    e.stopPropagation();
    
    // Toggle filter
    if (this.selectedType === type) {
      this.graphService.setFilter('');
    } else {
      this.graphService.setFilter(type);
    }
  }

  isTypeSelected(type: string): boolean {
    return this.selectedType === type;
  }
}