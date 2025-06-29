import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DragService } from '../../services/drag.service';

@Component({
  selector: 'app-trash-bin',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="trash-bin" 
         [class.visible]="shouldShow()"
         [class.active]="shouldShow()">
      <div class="trash-bin-icon">
        <mat-icon>delete</mat-icon>
      </div>
      <div class="trash-bin-text">Drop to remove</div>
    </div>
  `,
  styles: [`
    .trash-bin {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f44336;
      color: white;
      border-radius: 12px;
      padding: 16px 24px;
      box-shadow: 0 8px 24px rgba(244, 67, 54, 0.4);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      pointer-events: none;
      min-width: 120px;
      text-align: center;
    }

    .trash-bin.visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      visibility: visible;
    }

    .trash-bin.active {
      background-color: #d32f2f;
      box-shadow: 0 12px 32px rgba(244, 67, 54, 0.6);
      transform: translateX(-50%) translateY(0) scale(1.05);
    }

    .trash-bin-icon {
      margin-bottom: 8px;
    }

    .trash-bin-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .trash-bin-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    /* Mobile adjustments */
    @media (max-width: 800px) {
      .trash-bin {
        bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        padding: 12px 20px;
      }

      .trash-bin-icon mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .trash-bin-text {
        font-size: 13px;
      }
    }

    /* Small mobile devices */
    @media (max-width: 480px) {
      .trash-bin {
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        padding: 10px 16px;
      }

      .trash-bin-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .trash-bin-text {
        font-size: 12px;
      }
    }

    /* Accessibility improvements */
    @media (prefers-reduced-motion: reduce) {
      .trash-bin {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrashBinComponent {
  private dragService = inject(DragService);

  readonly shouldShow = computed(() => this.dragService.shouldShowTrashBin());
}