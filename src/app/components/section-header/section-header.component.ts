import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <h3 class="section-title">
      <mat-icon class="section-icon">{{ icon }}</mat-icon>
      {{ title }}
    </h3>
  `,
  styles: [`
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
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
}