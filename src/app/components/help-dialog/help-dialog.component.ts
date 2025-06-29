import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { SectionHeaderComponent } from '../section-header/section-header.component';

@Component({
  selector: 'app-help-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    SectionHeaderComponent
  ],
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDialogComponent {
  // Component logic can be added here if needed
}