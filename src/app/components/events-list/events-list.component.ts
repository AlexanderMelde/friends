import { Component, Input, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event } from '../../models/event.model';
import { DataService } from '../../services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { EventEditDialogComponent } from '../event-edit-dialog/event-edit-dialog.component';
import { MobileDialogService } from '../../services/mobile-dialog.service';
import { NavigationService } from '../../services/navigation.service';
import { GraphService } from '../../services/graph.service';
import { EventListItemComponent } from '../event-list-item/event-list-item.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, EventListItemComponent, SectionHeaderComponent],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventsListComponent {
  @Input() events: Event[] = [];
  @Input() title: string = 'Events';

  constructor(
    private dialog: MatDialog,
    private dataService: DataService,
    private graphService: GraphService,
    private mobileDialogService: MobileDialogService,
    private navigationService: NavigationService
  ) {}

  private isMobileView(): boolean {
    return window.innerWidth <= 800;
  }

  editEvent(event: Event): void {
    if (this.isMobileView()) {
      const dialogRef = this.mobileDialogService.openWithContent(
        'Edit Event',
        EventEditDialogComponent,
        {
          data: { event, friends: this.dataService.friendsWithEventCount() },
          showBackButton: true
        }
      );
      
      // Add to navigation stack
      const dialogId = `edit-event-dialog-${Date.now()}`;
      this.navigationService.pushState({
        id: dialogId,
        type: 'dialog',
        closeCallback: () => dialogRef.close()
      });
      
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.dataService.updateEvent(result);
        }
      });
    } else {
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
}