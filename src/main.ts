import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideNativeDateAdapter(),
    importProvidersFrom(
      MatButtonModule,
      MatIconModule,
      MatToolbarModule
    )
  ]
}).catch(err => console.error(err));