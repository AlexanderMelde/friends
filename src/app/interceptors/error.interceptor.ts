import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private snackBar = inject(MatSnackBar);
  private logger = inject(LoggerService);

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logger.error(
          `HTTP Error: ${error.status} ${error.statusText}`,
          'ErrorInterceptor',
          { url: req.url, error }
        );

        // Show user-friendly error messages
        let message = 'An error occurred';
        
        if (error.status === 0) {
          message = 'Network error. Please check your connection.';
        } else if (error.status >= 400 && error.status < 500) {
          message = 'Invalid request. Please try again.';
        } else if (error.status >= 500) {
          message = 'Server error. Please try again later.';
        }

        this.snackBar.open(message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });

        return throwError(() => error);
      })
    );
  }
}