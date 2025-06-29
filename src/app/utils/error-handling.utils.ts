export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandlingUtils {
  private static errorLog: AppError[] = [];

  static createError(
    code: string,
    message: string,
    details?: any
  ): AppError {
    const error: AppError = {
      code,
      message,
      details,
      timestamp: new Date()
    };

    this.logError(error);
    return error;
  }

  static logError(error: AppError): void {
    this.errorLog.push(error);
    console.error(`[${error.code}] ${error.message}`, error.details);
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  static getErrorLog(): readonly AppError[] {
    return [...this.errorLog];
  }

  static clearErrorLog(): void {
    this.errorLog = [];
  }

  static handleAsyncError<T>(
    operation: () => Promise<T>,
    errorCode: string,
    fallback?: T
  ): Promise<T | undefined> {
    return operation().catch((error) => {
      this.createError(errorCode, error.message, error);
      return fallback;
    });
  }

  static wrapWithErrorHandling<T extends (...args: any[]) => any>(
    func: T,
    errorCode: string
  ): T {
    return ((...args: any[]) => {
      try {
        const result = func(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch((error) => {
            this.createError(errorCode, error.message, error);
            throw error;
          });
        }
        
        return result;
      } catch (error: any) {
        this.createError(errorCode, error.message, error);
        throw error;
      }
    }) as T;
  }

  static isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message.includes('fetch');
  }

  static isValidationError(error: any): boolean {
    return error.code && error.code.startsWith('VALIDATION_');
  }

  static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.code) return `Error: ${error.code}`;
    return 'An unknown error occurred';
  }
}