import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private logger = inject(LoggerService);
  private events: AnalyticsEvent[] = [];
  private isEnabled = false; // Privacy-first: disabled by default

  enable(): void {
    this.isEnabled = true;
    this.logger.info('Analytics enabled', 'AnalyticsService');
  }

  disable(): void {
    this.isEnabled = false;
    this.clearEvents();
    this.logger.info('Analytics disabled', 'AnalyticsService');
  }

  track(name: string, category: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      category,
      properties,
      timestamp: new Date()
    };

    this.events.push(event);
    this.logger.debug(`Analytics event: ${name}`, 'AnalyticsService', event);

    // Keep only last 500 events to prevent memory issues
    if (this.events.length > 500) {
      this.events = this.events.slice(-500);
    }
  }

  // Predefined tracking methods for common actions
  trackUserAction(action: string, details?: Record<string, any>): void {
    this.track(action, 'user_action', details);
  }

  trackNavigation(from: string, to: string): void {
    this.track('navigation', 'navigation', { from, to });
  }

  trackError(error: string, context?: string): void {
    this.track('error', 'error', { error, context });
  }

  trackPerformance(operation: string, duration: number): void {
    this.track('performance', 'performance', { operation, duration });
  }

  // Data access methods
  getEvents(category?: string): AnalyticsEvent[] {
    if (category) {
      return this.events.filter(event => event.category === category);
    }
    return [...this.events];
  }

  getEventSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    
    this.events.forEach(event => {
      const key = `${event.category}:${event.name}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }

  clearEvents(): void {
    this.events = [];
    this.logger.info('Analytics events cleared', 'AnalyticsService');
  }

  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}