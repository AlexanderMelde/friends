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
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
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
      data: { event, friends: this.dataService.friendsWithEventCount() }
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