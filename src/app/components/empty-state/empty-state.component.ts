import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p *ngIf="description">{{ description }}</p>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: #666;
      padding: 32px 16px;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
      max-width: 280px;
    }

    /* Mobile adjustments */
    @media (max-width: 800px) {
      .empty-state {
        padding: 24px 12px;
      }
    }

    /* Small mobile devices */
    @media (max-width: 480px) {
      .empty-state {
        padding: 16px 8px;
      }
      
      .empty-state mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
      
      .empty-state h3 {
        font-size: 16px;
      }
      
      .empty-state p {
        font-size: 13px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}