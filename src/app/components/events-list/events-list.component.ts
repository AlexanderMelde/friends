import { Component, Input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event } from '../../models/event.model';
import { DataService } from '../../services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { EventEditDialogComponent } from '../event-edit-dialog/event-edit-dialog.component';
import { GraphService } from '../../services/graph.service';
import { EventListItemComponent } from '../event-list-item/event-list-item.component';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, EventListItemComponent],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent {
  @Input() events: Event[] = [];
  @Input() title: string = 'Events';

  constructor(
    private dialog: MatDialog,
    private dataService: DataService,
    private graphService: GraphService
  ) {}

  editEvent(event: Event): void {
    const dialogRef = this.dialog.open(EventEditDialogComponent, {
      data: { event, friends: this.dataService.friendsWithEventCount() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.updateEvent(result);
      }
    });
  }
}