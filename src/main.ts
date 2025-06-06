import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideNativeDateAdapter(),
    importProvidersFrom(
      MatButtonModule,
      MatIconModule,
      MatToolbarModule,
      MatSnackBarModule,
      MatMenuModule,
      MatDividerModule,
      MatTabsModule,
      MatExpansionModule
    )
  ]
}).catch(err => console.error(err));