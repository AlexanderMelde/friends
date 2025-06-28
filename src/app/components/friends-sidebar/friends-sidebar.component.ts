import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Friend } from '../../models/friend.model';
import { DataService } from '../../services/data.service';
import { GraphService } from '../../services/graph.service';
import { MobileDialogService } from '../../services/mobile-dialog.service';
import { FriendListComponent } from '../friend-list/friend-list.component';
import { FriendDialogComponent } from '../friend-dialog/friend-dialog.component';
import { AppHeaderBarComponent, HeaderAction } from '../app-header-bar/app-header-bar.component';

@Component({
  selector: 'app-friends-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    FriendListComponent,
    AppHeaderBarComponent
  ],
  templateUrl: './friends-sidebar.component.html',
  styleUrls: ['./friends-sidebar.component.css']
})
export class FriendsSidebarComponent {
  @Input() isOpen: boolean = false;
  @Input() calendarSidebarOpen: boolean = false;
  @Output() closeRequested = new EventEmitter<void>();
  @Output() addFriendRequested = new EventEmitter<void>();

  private dataService = inject(DataService);
  private graphService = inject(GraphService);
  private dialog = inject(MatDialog);
  private mobileDialogService = inject(MobileDialogService);

  // Computed property for header actions
  readonly headerActions = computed((): HeaderAction[] => [
    {
      icon: 'person_add',
      label: 'Add Friend',
      action: () => this.addFriend()
    }
  ]);

  private isMobileView(): boolean {
    return window.innerWidth <= 800;
  }

  close(): void {
    this.closeRequested.emit();
  }

  addFriend(): void {
    this.addFriendRequested.emit();
  }

  selectFriend(friend: Friend & { eventCount: number }): void {
    // Find the corresponding node in the graph
    const nodes = this.graphService.nodes();
    const node = nodes.find(n => n.id === friend.id);
    
    if (node) {
      this.graphService.selectNode(node);
    }
  }

  editFriend(friend: Friend & { eventCount: number }): void {
    if (this.isMobileView()) {
      this.mobileDialogService.openWithContent(
        'Edit Friend',
        FriendDialogComponent,
        {
          data: { friend: friend, events: this.dataService.events(), isEdit: true },
          showBackButton: true
        }
      ).afterClosed().subscribe(result => {
        if (result) {
          this.dataService.updateFriend(result.friend, result.selectedEvents);
        }
      });
    } else {
      const dialogRef = this.dialog.open(FriendDialogComponent, {
        data: { friend: friend, events: this.dataService.events(), isEdit: true }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.dataService.updateFriend(result.friend, result.selectedEvents);
        }
      });
    }
  }
}