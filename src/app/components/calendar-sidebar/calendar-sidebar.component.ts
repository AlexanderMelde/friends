import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Event } from '../../models/event.model';
import { DataService } from '../../services/data.service';
import { GraphService } from '../../services/graph.service';
import { EventListItemComponent } from '../event-list-item/event-list-item.component';
import { EventEditDialogComponent } from '../event-edit-dialog/event-edit-dialog.component';

interface MonthGroup {
  month: string;
  events: Event[];
}

interface YearGroup {
  year: string;
  months: MonthGroup[];
}

@Component({
  selector: 'app-calendar-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, EventListItemComponent],
  templateUrl: './calendar-sidebar.component.html',
  styleUrls: ['./calendar-sidebar.component.css']
})
export class CalendarSidebarComponent {
  @Input() isOpen: boolean = false;
  @Output() closeRequested = new EventEmitter<void>();
  @Output() addEventRequested = new EventEmitter<void>();

  readonly groupedEvents = computed(() => {
    const events = this.dataService.events();
    const filter = this.graphService.filter();
    
    // Filter events if a filter is active
    const filteredEvents = filter 
      ? events.filter(e => e.type === filter)
      : events;
    
    // Sort events by date (newest first)
    const sortedEvents = [...filteredEvents].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Group by year and month only
    const yearGroups = new Map<string, Map<string, Event[]>>();
    
    sortedEvents.forEach(event => {
      const date = new Date(event.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      
      if (!yearGroups.has(year)) {
        yearGroups.set(year, new Map());
      }
      
      const yearGroup = yearGroups.get(year)!;
      if (!yearGroup.has(month)) {
        yearGroup.set(month, []);
      }
      
      yearGroup.get(month)!.push(event);
    });
    
    // Convert to array format
    const result: YearGroup[] = [];
    
    yearGroups.forEach((yearGroup, year) => {
      const months: MonthGroup[] = [];
      
      yearGroup.forEach((monthEvents, month) => {
        months.push({
          month,
          events: monthEvents.sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        });
      });
      
      result.push({ year, months });
    });
    
    return result;
  });

  constructor(
    private dataService: DataService,
    private graphService: GraphService,
    private dialog: MatDialog
  ) {}

  close(): void {
    this.closeRequested.emit();
  }

  addEvent(): void {
    this.addEventRequested.emit();
  }

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