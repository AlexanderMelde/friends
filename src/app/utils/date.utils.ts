export class DateUtils {
  static formatDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
      case 'iso':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString();
    }
  }

  static formatDateTime(date: Date): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static ensureDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return this.isValidDate(value) ? value : null;
    if (typeof value === 'string') {
      const date = new Date(value);
      return this.isValidDate(date) ? date : null;
    }
    return null;
  }

  static getYearRange(dates: Date[]): { min: number; max: number } {
    const validDates = dates.filter(this.isValidDate);
    if (validDates.length === 0) {
      const currentYear = new Date().getFullYear();
      return { min: currentYear, max: currentYear };
    }

    const years = validDates.map(date => date.getFullYear());
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  }

  static groupByMonth(dates: Date[]): Map<string, Date[]> {
    const groups = new Map<string, Date[]>();
    
    dates.filter(this.isValidDate).forEach(date => {
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(date);
    });

    return groups;
  }
}