import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface HeaderAction {
  icon: string;
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-header-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './app-header-bar.component.html',
  styleUrls: ['./app-header-bar.component.css']
})
export class AppHeaderBarComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() headerColor: string = 'primary';
  @Input() headerActions: HeaderAction[] = [];
  @Output() navButtonClick = new EventEmitter<void>();

  onNavButtonClick(): void {
    this.navButtonClick.emit();
  }

  onActionClick(action: HeaderAction): void {
    action.action();
  }
}