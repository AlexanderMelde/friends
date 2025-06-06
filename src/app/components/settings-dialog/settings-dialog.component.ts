import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DataService } from '../../services/data.service';
import { Friend } from '../../models/friend.model';
import { Event as AppEvent } from '../../models/event.model';

interface AppData {
  version: string;
  exportDate: string;
  friends: Friend[];
  events: AppEvent[];
}

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent {
  isExporting = false;
  isImporting = false;

  private dataService = inject(DataService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<SettingsDialogComponent>);

  close(): void {
    this.dialogRef.close();
  }

  async exportJSON(): Promise<void> {
    this.isExporting = true;
    
    try {
      const friends = this.dataService.friends();
      const events = this.dataService.events();
      
      const appData: AppData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        friends,
        events
      };
      
      const dataStr = JSON.stringify(appData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `social-network-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.snackBar.open('Data exported successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Export failed:', error);
      this.snackBar.open('Export failed. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.isExporting = false;
    }
  }

  async exportICalVCard(): Promise<void> {
    this.isExporting = true;
    
    try {
      const friends = this.dataService.friends();
      const events = this.dataService.events();
      
      // Generate iCal content
      const icalContent = this.generateICalContent(events, friends);
      
      // Generate vCard content
      const vcardContent = this.generateVCardContent(friends);
      
      // Create combined file content
      const combinedContent = `${icalContent}\n\n${vcardContent}`;
      
      const dataBlob = new Blob([combinedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `social-network-calendar-contacts-${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.snackBar.open('Calendar and contacts exported successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('iCal/vCard export failed:', error);
      this.snackBar.open('Export failed. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.isExporting = false;
    }
  }

  private generateICalContent(events: AppEvent[], friends: Friend[]): string {
    const friendsMap = new Map(friends.map(f => [f.id, f]));
    
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//Social Network App//EN\n';
    ical += 'CALSCALE:GREGORIAN\n';
    
    events.forEach(event => {
      const startDate = new Date(event.date);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
      
      const attendeeNames = event.attendees
        .map(id => friendsMap.get(id)?.name)
        .filter(name => name)
        .join(', ');
      
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${event.id}@social-network-app\n`;
      ical += `DTSTART:${this.formatDateForICal(startDate)}\n`;
      ical += `DTEND:${this.formatDateForICal(endDate)}\n`;
      ical += `SUMMARY:${this.escapeICalText(event.title)}\n`;
      
      if (event.location) {
        ical += `LOCATION:${this.escapeICalText(event.location)}\n`;
      }
      
      if (event.description) {
        ical += `DESCRIPTION:${this.escapeICalText(event.description)}\n`;
      }
      
      if (event.type) {
        ical += `CATEGORIES:${this.escapeICalText(event.type)}\n`;
      }
      
      if (attendeeNames) {
        ical += `X-ATTENDEES:${this.escapeICalText(attendeeNames)}\n`;
      }
      
      ical += `CREATED:${this.formatDateForICal(new Date())}\n`;
      ical += `LAST-MODIFIED:${this.formatDateForICal(new Date())}\n`;
      ical += 'END:VEVENT\n';
    });
    
    ical += 'END:VCALENDAR';
    return ical;
  }

  private generateVCardContent(friends: Friend[]): string {
    let vcard = '';
    
    friends.forEach(friend => {
      vcard += 'BEGIN:VCARD\n';
      vcard += 'VERSION:3.0\n';
      vcard += `UID:${friend.id}@social-network-app\n`;
      vcard += `FN:${this.escapeVCardText(friend.name)}\n`;
      vcard += `N:${this.escapeVCardText(friend.name)};;;;\n`;
      
      if (friend.photoUrl) {
        vcard += `PHOTO;VALUE=URI:${friend.photoUrl}\n`;
      }
      
      if (friend.bio) {
        vcard += `NOTE:${this.escapeVCardText(friend.bio)}\n`;
      }
      
      if (friend.joinDate) {
        vcard += `X-JOINDATE:${friend.joinDate.toISOString().split('T')[0]}\n`;
      }
      
      vcard += 'END:VCARD\n';
    });
    
    return vcard;
  }

  private formatDateForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private escapeICalText(text: string): string {
    return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
  }

  private escapeVCardText(text: string): string {
    return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
  }

  onFileSelected(event: any, fileType: 'json' | 'ical'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    if (fileType === 'json') {
      this.importJSON(file);
    } else {
      this.importICalVCard(file);
    }
    
    // Reset input
    input.value = '';
  }

  private async importJSON(file: File): Promise<void> {
    this.isImporting = true;
    
    try {
      const text = await file.text();
      const data: AppData = JSON.parse(text);
      
      // Validate data structure
      if (!data.friends || !data.events || !Array.isArray(data.friends) || !Array.isArray(data.events)) {
        throw new Error('Invalid file format');
      }
      
      // Validate friends data
      for (const friend of data.friends) {
        if (!friend.id || !friend.name || !friend.photoUrl) {
          throw new Error('Invalid friend data structure');
        }
      }
      
      // Validate events data
      for (const event of data.events) {
        if (!event.id || !event.title || !event.date || !Array.isArray(event.attendees)) {
          throw new Error('Invalid event data structure');
        }
      }
      
      // Clear existing data and import new data
      await this.clearAllData();
      
      // Import friends first
      for (const friend of data.friends) {
        await this.dataService.addFriend(friend, []);
      }
      
      // Then import events
      for (const event of data.events) {
        // Ensure date is a Date object
        event.date = new Date(event.date);
        await this.dataService.addEvent(event);
      }
      
      this.snackBar.open(`Successfully imported ${data.friends.length} friends and ${data.events.length} events!`, 'Close', { duration: 5000 });
    } catch (error) {
      console.error('Import failed:', error);
      this.snackBar.open('Import failed. Please check the file format and try again.', 'Close', { duration: 5000 });
    } finally {
      this.isImporting = false;
    }
  }

  private async importICalVCard(file: File): Promise<void> {
    this.isImporting = true;
    
    try {
      const text = await file.text();
      
      // Parse iCal and vCard content
      const { events, friends } = this.parseICalVCard(text);
      
      if (events.length === 0 && friends.length === 0) {
        throw new Error('No valid events or contacts found in file');
      }
      
      // Clear existing data and import new data
      await this.clearAllData();
      
      // Import friends first
      for (const friend of friends) {
        await this.dataService.addFriend(friend, []);
      }
      
      // Then import events
      for (const event of events) {
        await this.dataService.addEvent(event);
      }
      
      this.snackBar.open(`Successfully imported ${friends.length} contacts and ${events.length} events!`, 'Close', { duration: 5000 });
    } catch (error) {
      console.error('iCal/vCard import failed:', error);
      this.snackBar.open('Import failed. Please check the file format and try again.', 'Close', { duration: 5000 });
    } finally {
      this.isImporting = false;
    }
  }

  private parseICalVCard(content: string): { events: AppEvent[], friends: Friend[] } {
    const events: AppEvent[] = [];
    const friends: Friend[] = [];
    
    // Split content into iCal and vCard sections
    const lines = content.split('\n').map(line => line.trim());
    
    let currentSection: 'none' | 'vevent' | 'vcard' = 'none';
    let currentEvent: Partial<AppEvent> = {};
    let currentFriend: Partial<Friend> = {};
    
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        currentSection = 'vevent';
        currentEvent = {
          id: crypto.randomUUID(),
          attendees: []
        };
      } else if (line === 'END:VEVENT') {
        if (currentEvent.title && currentEvent.date) {
          events.push(currentEvent as AppEvent);
        }
        currentSection = 'none';
        currentEvent = {};
      } else if (line === 'BEGIN:VCARD') {
        currentSection = 'vcard';
        currentFriend = {
          id: crypto.randomUUID(),
          joinDate: new Date()
        };
      } else if (line === 'END:VCARD') {
        if (currentFriend.name) {
          friends.push(currentFriend as Friend);
        }
        currentSection = 'none';
        currentFriend = {};
      } else if (currentSection === 'vevent') {
        this.parseICalLine(line, currentEvent);
      } else if (currentSection === 'vcard') {
        this.parseVCardLine(line, currentFriend);
      }
    }
    
    return { events, friends };
  }

  private parseICalLine(line: string, event: Partial<AppEvent>): void {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':');
    
    switch (key) {
      case 'UID':
        if (value.includes('@social-network-app')) {
          event.id = value.split('@')[0];
        }
        break;
      case 'SUMMARY':
        event.title = this.unescapeICalText(value);
        break;
      case 'DTSTART':
        event.date = this.parseICalDate(value);
        break;
      case 'LOCATION':
        event.location = this.unescapeICalText(value);
        break;
      case 'DESCRIPTION':
        event.description = this.unescapeICalText(value);
        break;
      case 'CATEGORIES':
        event.type = this.unescapeICalText(value);
        break;
    }
  }

  private parseVCardLine(line: string, friend: Partial<Friend>): void {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':');
    
    switch (key) {
      case 'UID':
        if (value.includes('@social-network-app')) {
          friend.id = value.split('@')[0];
        }
        break;
      case 'FN':
        friend.name = this.unescapeVCardText(value);
        break;
      case 'PHOTO;VALUE=URI':
      case 'PHOTO':
        friend.photoUrl = value;
        break;
      case 'NOTE':
        friend.bio = this.unescapeVCardText(value);
        break;
      case 'X-JOINDATE':
        friend.joinDate = new Date(value);
        break;
    }
  }

  private parseICalDate(dateStr: string): Date {
    // Handle YYYYMMDDTHHMMSSZ format
    if (dateStr.endsWith('Z')) {
      const year = parseInt(dateStr.substr(0, 4));
      const month = parseInt(dateStr.substr(4, 2)) - 1;
      const day = parseInt(dateStr.substr(6, 2));
      const hour = parseInt(dateStr.substr(9, 2));
      const minute = parseInt(dateStr.substr(11, 2));
      const second = parseInt(dateStr.substr(13, 2));
      
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    
    return new Date(dateStr);
  }

  private unescapeICalText(text: string): string {
    return text.replace(/\\n/g, '\n').replace(/\\(.)/g, '$1');
  }

  private unescapeVCardText(text: string): string {
    return text.replace(/\\n/g, '\n').replace(/\\(.)/g, '$1');
  }

  private async clearAllData(): Promise<void> {
    // Clear localStorage
    localStorage.removeItem('friends');
    localStorage.removeItem('events');
    
    // Clear IndexedDB through the data service
    await this.dataService.clearAllData();
  }

  triggerFileInput(inputId: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    input?.click();
  }
}