import { Component, Inject, OnInit, OnDestroy, HostListener, ViewChild, ViewContainerRef, ComponentRef, AfterViewInit, ViewEncapsulation, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface MobileDialogData {
  title: string;
  component?: any;
  data?: any;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  headerActions?: Array<{
    icon: string;
    label: string;
    action: () => void;
  }>;
}

@Component({
  selector: 'app-mobile-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule
  ],
  template: `
    <div class="mobile-dialog-container" [@slideIn]="animationState">
      <!-- Header -->
      <mat-toolbar class="mobile-dialog-header" color="primary">
        <!-- Back/Close Button -->
        <button mat-icon-button 
                (click)="onBackClick()"
                class="header-nav-button"
                [attr.aria-label]="data.showBackButton ? 'Go back' : 'Close dialog'">
          <mat-icon>{{ data.showBackButton ? 'arrow_back' : 'close' }}</mat-icon>
        </button>

        <!-- Title -->
        <span class="dialog-title">{{ data.title }}</span>

        <!-- Header Actions -->
        <div class="header-actions">
          <button mat-icon-button 
                  *ngFor="let action of data.headerActions"
                  (click)="action.action()"
                  [attr.aria-label]="action.label"
                  class="header-action-button">
            <mat-icon>{{ action.icon }}</mat-icon>
          </button>
        </div>
      </mat-toolbar>

      <!-- Content Area -->
      <div class="mobile-dialog-content" #contentArea>
        <!-- Dynamic Component Container -->
        <div #dynamicComponentContainer class="dynamic-component-container"></div>
        
        <!-- Fallback Content -->
        <ng-content></ng-content>
      </div>

      <!-- Optional Footer -->
      <div class="mobile-dialog-footer" *ngIf="hasFooterContent">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./mobile-dialog.component.css'],
  animations: [
    trigger('slideIn', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('enter', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      state('exit', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      transition('void => enter', animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')),
      transition('enter => exit', animate('250ms cubic-bezier(0.25, 0.8, 0.25, 1)'))
    ])
  ]
})
export class MobileDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: true }) 
  dynamicComponentContainer!: ViewContainerRef;

  animationState = 'enter';
  hasFooterContent = false;
  private componentRef: ComponentRef<any> | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MobileDialogData,
    private dialogRef: MatDialogRef<MobileDialogComponent>,
    private injector: Injector
  ) {
    // Set default values
    this.data = {
      showBackButton: false,
      showCloseButton: true,
      headerActions: [],
      ...this.data
    };
  }

  ngOnInit(): void {
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  }

  ngAfterViewInit(): void {
    // Create dynamic component if provided
    if (this.data.component && this.dynamicComponentContainer) {
      this.createDynamicComponent();
    }
  }

  ngOnDestroy(): void {
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';

    // Clean up component reference
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private createDynamicComponent(): void {
    if (!this.data.component || !this.dynamicComponentContainer) return;

    try {
      // Clear any existing component
      this.dynamicComponentContainer.clear();

      // Create a custom injector that provides MAT_DIALOG_DATA and MatDialogRef
      const customInjector = Injector.create({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: this.data.data || {}
          },
          {
            provide: MatDialogRef,
            useValue: {
              close: (result?: any) => this.closeDialog(result),
              afterClosed: () => this.dialogRef.afterClosed(),
              beforeClosed: () => this.dialogRef.beforeClosed(),
              backdropClick: () => this.dialogRef.backdropClick(),
              keydownEvents: () => this.dialogRef.keydownEvents(),
              updatePosition: () => this.dialogRef.updatePosition(),
              updateSize: () => this.dialogRef.updateSize(),
              addPanelClass: (classes: string | string[]) => this.dialogRef.addPanelClass(classes),
              removePanelClass: (classes: string | string[]) => this.dialogRef.removePanelClass(classes),
              getState: () => this.dialogRef.getState(),
              disableClose: this.dialogRef.disableClose,
              id: this.dialogRef.id
            }
          }
        ],
        parent: this.injector
      });

      // Create the component with the custom injector
      this.componentRef = this.dynamicComponentContainer.createComponent(
        this.data.component,
        { injector: customInjector }
      );

      // Trigger change detection
      this.componentRef.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error creating dynamic component:', error);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    this.closeDialog();
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    // Handle browser back button
    this.closeDialog();
  }

  onBackClick(): void {
    this.closeDialog();
  }

  closeDialog(result?: any): void {
    this.animationState = 'exit';
    
    // Wait for animation to complete before closing
    setTimeout(() => {
      this.dialogRef.close(result);
    }, 250);
  }
}