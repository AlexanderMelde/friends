import { Injectable, ComponentRef, ViewContainerRef } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MobileDialogComponent, MobileDialogData } from '../components/mobile-dialog/mobile-dialog.component';
import { ComponentType } from '@angular/cdk/portal';

export interface MobileDialogConfig extends MobileDialogData {
  disableClose?: boolean;
  backdropClass?: string;
  panelClass?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MobileDialogService {
  private isMobile(): boolean {
    return window.innerWidth < 800;
  }

  constructor(private dialog: MatDialog) {}

  open<T = any>(
    component: ComponentType<T> | null,
    config: MobileDialogConfig
  ): MatDialogRef<any> {
    
    if (!this.isMobile()) {
      // For desktop, use regular dialog
      if (component) {
        return this.dialog.open(component, {
          width: config.panelClass?.includes('wide') ? '800px' : '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          disableClose: config.disableClose || false,
          data: config.data
        });
      }
    }

    // For mobile, use full-screen dialog
    const dialogConfig: MatDialogConfig = {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: ['mobile-dialog-panel', ...(config.panelClass ? [config.panelClass] : [])],
      backdropClass: config.backdropClass || 'mobile-dialog-backdrop',
      disableClose: config.disableClose || false,
      hasBackdrop: false, // We handle our own backdrop
      data: {
        ...config,
        component
      }
    };

    return this.dialog.open(MobileDialogComponent, dialogConfig);
  }

  openWithContent(
    title: string,
    content: string | ComponentType<any> | null,
    options: Partial<MobileDialogConfig> = {}
  ): MatDialogRef<any> {
    
    const config: MobileDialogConfig = {
      title,
      showBackButton: true,
      showCloseButton: false,
      ...options
    };

    if (typeof content === 'string') {
      // Handle string content
      config.data = { ...config.data, htmlContent: content };
      return this.open(null, config);
    } else {
      // Handle component content
      return this.open(content, config);
    }
  }

  openSettings(): MatDialogRef<any> {
    return this.openWithContent(
      'Settings',
      null, // We'll import the settings component
      {
        headerActions: [
          {
            icon: 'save',
            label: 'Save Settings',
            action: () => {
              // Handle save action
            }
          }
        ]
      }
    );
  }

  openHelp(): MatDialogRef<any> {
    return this.openWithContent(
      'Help & Support',
      null, // We'll import the help component
      {
        showBackButton: true
      }
    );
  }

  openFriendDetails(friendId: string): MatDialogRef<any> {
    return this.openWithContent(
      'Friend Details',
      null, // We'll import the friend details component
      {
        data: { friendId },
        headerActions: [
          {
            icon: 'edit',
            label: 'Edit Friend',
            action: () => {
              // Handle edit action
            }
          }
        ]
      }
    );
  }

  openEventDetails(eventId: string): MatDialogRef<any> {
    return this.openWithContent(
      'Event Details',
      null, // We'll import the event details component
      {
        data: { eventId },
        headerActions: [
          {
            icon: 'edit',
            label: 'Edit Event',
            action: () => {
              // Handle edit action
            }
          }
        ]
      }
    );
  }
}