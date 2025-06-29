import { Friend } from '../models/friend.model';
import { Event } from '../models/event.model';

export class ValidationUtils {
  static isValidFriend(friend: Partial<Friend>): friend is Friend {
    return !!(
      friend.id &&
      friend.name?.trim() &&
      friend.photoUrl?.trim() &&
      this.isValidUrl(friend.photoUrl)
    );
  }

  static isValidEvent(event: Partial<Event>): event is Event {
    return !!(
      event.id &&
      event.title?.trim() &&
      event.date &&
      event.date instanceof Date &&
      !isNaN(event.date.getTime()) &&
      Array.isArray(event.attendees)
    );
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static validateFileSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  static validateImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  }
}