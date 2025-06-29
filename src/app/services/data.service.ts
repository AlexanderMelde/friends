import { Injectable, signal, computed } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Friend } from '../models/friend.model';
import { Event } from '../models/event.model';
import { SAMPLE_DATA } from './sample-data';

class SocialNetworkDB extends Dexie {
  friends!: Table<Friend, string>;
  events!: Table<Event, string>;

  constructor() {
    super('social-network-db');
    this.version(1).stores({
      friends: 'id, name',
      events: 'id, date'
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private db: SocialNetworkDB;
  private dbReady = signal(false);

  private friendsSignal = signal<Friend[]>([]);
  private eventsSignal = signal<Event[]>([]);

  friends = computed(() => this.friendsSignal());
  events = computed(() => this.eventsSignal());

  // Computed property that adds eventCount to friends
  friendsWithEventCount = computed(() => {
    const friends = this.friends();
    const events = this.events();
    
    return friends.map(friend => ({
      ...friend,
      eventCount: events.filter(event => event.attendees.includes(friend.id)).length
    }));
  });

  constructor() {
    this.db = new SocialNetworkDB();
    this.initDatabase();
  }

  /**
   * Utility function to ensure a value is a proper Date object or undefined
   */
  private ensureDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }

  /**
   * Utility function to normalize a friend object by ensuring proper date types
   */
  private normalizeFriend(friend: any): Friend {
    return {
      ...friend,
      joinDate: this.ensureDate(friend.joinDate)
    };
  }

  /**
   * Utility function to normalize an event object by ensuring proper date types
   */
  private normalizeEvent(event: any): Event {
    return {
      ...event,
      date: this.ensureDate(event.date)
    };
  }

  /**
   * Utility function to prepare a friend object for storage by removing computed properties
   * and normalizing dates. This ensures consistency across all storage operations.
   */
  private normalizeAndCleanFriend(friend: any): Friend {
    // Remove eventCount if it exists (it's a computed property, not part of the persistent model)
    const { eventCount, ...friendWithoutEventCount } = friend;
    return this.normalizeFriend(friendWithoutEventCount);
  }

  /**
   * Utility function to update localStorage with current data in a non-blocking way
   */
  private updateLocalStorageAsync(): void {
    setTimeout(() => {
      try {
        localStorage.setItem('friends', JSON.stringify(this.friends()));
        localStorage.setItem('events', JSON.stringify(this.events()));
        console.log('LocalStorage updated successfully');
      } catch (error) {
        console.error('Failed to update localStorage:', error);
      }
    }, 0);
  }

  /**
   * Utility function to update only events in localStorage
   */
  private updateEventsLocalStorageAsync(): void {
    setTimeout(() => {
      try {
        localStorage.setItem('events', JSON.stringify(this.events()));
        console.log('Events localStorage updated successfully');
      } catch (error) {
        console.error('Failed to update events localStorage:', error);
      }
    }, 0);
  }

  private async initDatabase() {
    try {
      await this.db.open();
      const friendCount = await this.db.friends.count();
      if (friendCount === 0) {
        await this.loadSampleData();
      } else {
        await this.loadAllData();
      }

      this.dbReady.set(true);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Dexie', error);
      this.loadFromLocalStorage();
    }
  }

  private async loadAllData() {
    try {
      const [friends, events] = await Promise.all([
        this.db.friends.toArray(),
        this.db.events.toArray()
      ]);
      
      // Normalize dates when loading from database
      const normalizedFriends = friends.map(friend => this.normalizeFriend(friend));
      const normalizedEvents = events.map(event => this.normalizeEvent(event));
      
      this.friendsSignal.set(normalizedFriends);
      this.eventsSignal.set(normalizedEvents);
      console.log('Data loaded from database:', { friends: normalizedFriends.length, events: normalizedEvents.length });
    } catch (error) {
      console.error('Failed to load data from Dexie', error);
      this.loadFromLocalStorage();
    }
  }

  private async loadSampleData() {
    try {
      // Use the utility function to clean and normalize sample data
      const cleanFriends = SAMPLE_DATA.friends.map(friend => this.normalizeAndCleanFriend(friend));
      const normalizedEvents = SAMPLE_DATA.events.map(event => this.normalizeEvent(event));
      
      await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
        await Promise.all([
          this.db.friends.bulkAdd(cleanFriends),
          this.db.events.bulkAdd(normalizedEvents)
        ]);
      });
      
      this.friendsSignal.set(cleanFriends);
      this.eventsSignal.set(normalizedEvents);
      
      // Store clean data without eventCount
      localStorage.setItem('friends', JSON.stringify(cleanFriends));
      localStorage.setItem('events', JSON.stringify(normalizedEvents));
      console.log('Sample data loaded successfully');
    } catch (error) {
      console.error('Failed to load sample data', error);
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    const storedFriends = localStorage.getItem('friends');
    const storedEvents = localStorage.getItem('events');
    
    if (storedFriends) {
      try {
        const friends = JSON.parse(storedFriends);
        // Use the utility function to clean and normalize stored friends
        const cleanFriends = friends.map((friend: any) => this.normalizeAndCleanFriend(friend));
        this.friendsSignal.set(cleanFriends);
        console.log('Friends loaded from localStorage:', cleanFriends.length);
      } catch (error) {
        console.error('Failed to parse friends from localStorage:', error);
        const cleanFriends = SAMPLE_DATA.friends.map(friend => this.normalizeAndCleanFriend(friend));
        this.friendsSignal.set(cleanFriends);
        localStorage.setItem('friends', JSON.stringify(cleanFriends));
      }
    } else {
      const cleanFriends = SAMPLE_DATA.friends.map(friend => this.normalizeAndCleanFriend(friend));
      this.friendsSignal.set(cleanFriends);
      localStorage.setItem('friends', JSON.stringify(cleanFriends));
    }
    
    if (storedEvents) {
      try {
        const events = JSON.parse(storedEvents);
        const normalizedEvents = events.map((event: any) => this.normalizeEvent(event));
        this.eventsSignal.set(normalizedEvents);
        console.log('Events loaded from localStorage:', normalizedEvents.length);
      } catch (error) {
        console.error('Failed to parse events from localStorage:', error);
        const normalizedEvents = SAMPLE_DATA.events.map(event => this.normalizeEvent(event));
        this.eventsSignal.set(normalizedEvents);
        localStorage.setItem('events', JSON.stringify(normalizedEvents));
      }
    } else {
      const normalizedEvents = SAMPLE_DATA.events.map(event => this.normalizeEvent(event));
      this.eventsSignal.set(normalizedEvents);
      localStorage.setItem('events', JSON.stringify(normalizedEvents));
    }
    
    this.dbReady.set(true);
    console.log('Data loaded from localStorage fallback');
  }

  async clearAllData(): Promise<void> {
    try {
      // Clear IndexedDB
      await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
        await Promise.all([
          this.db.friends.clear(),
          this.db.events.clear()
        ]);
      });

      // Clear signals
      this.friendsSignal.set([]);
      this.eventsSignal.set([]);

      // Clear localStorage
      localStorage.removeItem('friends');
      localStorage.removeItem('events');
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  async addEvent(event: Event): Promise<void> {
    const normalizedEvent = this.normalizeEvent(event);
    
    try {
      console.log('Adding event:', normalizedEvent);
      
      // Try to add to IndexedDB first
      if (this.dbReady()) {
        await this.db.events.add(normalizedEvent);
        console.log('Event added to IndexedDB');
      }

      // Update signals immediately
      this.eventsSignal.update(events => {
        const newEvents = [...events, normalizedEvent];
        console.log('Events signal updated, new count:', newEvents.length);
        return newEvents;
      });

      // Update localStorage in background (events only)
      this.updateEventsLocalStorageAsync();
    } catch (error) {
      console.error('Failed to add event:', error);
      
      // Fallback: at least update the signal and localStorage
      this.eventsSignal.update(events => [...events, normalizedEvent]);
      this.updateEventsLocalStorageAsync();
    }
  }

  async addFriend(friend: Friend, eventIds: string[]): Promise<void> {
    try {
      const cleanFriend = this.normalizeAndCleanFriend(friend);
      console.log('Adding friend:', cleanFriend, 'with events:', eventIds);
      
      // Try to add to IndexedDB first
      if (this.dbReady()) {
        await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
          await this.db.friends.add(cleanFriend);
          console.log('Friend added to IndexedDB');
          
          // Update events
          for (const eventId of eventIds) {
            const event = await this.db.events.get(eventId);
            if (event) {
              if (!event.attendees.includes(friend.id)) {
                event.attendees.push(friend.id);
                await this.db.events.put(event);
                console.log('Updated event attendees for event:', eventId);
              }
            }
          }
        });
      }

      // Update signals immediately
      this.friendsSignal.update(friends => {
        const newFriends = [...friends, cleanFriend];
        console.log('Friends signal updated, new count:', newFriends.length);
        return newFriends;
      });
      
      this.eventsSignal.update(events => 
        events.map(event => {
          if (eventIds.includes(event.id) && !event.attendees.includes(friend.id)) {
            const updatedEvent = { ...event, attendees: [...event.attendees, friend.id] };
            console.log('Updated event attendees in signal for event:', event.id);
            return updatedEvent;
          }
          return event;
        })
      );

      // Update localStorage in background (clean data only)
      this.updateLocalStorageAsync();
      
      console.log('Friend added successfully:', cleanFriend.name);
    } catch (error) {
      console.error('Failed to add friend:', error);
      
      // Fallback: at least update the signals and localStorage
      const cleanFriend = this.normalizeAndCleanFriend(friend);
      this.friendsSignal.update(friends => [...friends, cleanFriend]);
      
      this.eventsSignal.update(events => 
        events.map(event => 
          eventIds.includes(event.id) && !event.attendees.includes(friend.id)
            ? { ...event, attendees: [...event.attendees, friend.id] }
            : event
        )
      );
      
      this.updateLocalStorageAsync();
      console.log('Friend added with fallback method:', cleanFriend.name);
    }
  }

  async updateFriend(friend: Friend, eventIds: string[]): Promise<void> {
    try {
      const cleanFriend = this.normalizeAndCleanFriend(friend);
      console.log('Updating friend:', cleanFriend, 'with events:', eventIds);
      
      // Try to update in IndexedDB first
      if (this.dbReady()) {
        await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
          await this.db.friends.put(cleanFriend);
          console.log('Friend updated in IndexedDB');
          
          // Get all events to update
          const events = await this.db.events.toArray();
          
          // Update event attendees
          for (const event of events) {
            const shouldBeIncluded = eventIds.includes(event.id);
            const isIncluded = event.attendees.includes(friend.id);
            
            if (shouldBeIncluded !== isIncluded) {
              event.attendees = shouldBeIncluded
                ? [...event.attendees, friend.id]
                : event.attendees.filter((id: string) => id !== friend.id);
              await this.db.events.put(event);
              console.log('Updated event attendees for event:', event.id);
            }
          }
        });
      }

      // Update signals immediately
      this.friendsSignal.update(friends => {
        const updatedFriends = friends.map(f => f.id === friend.id ? cleanFriend : f);
        console.log('Friends signal updated for friend:', friend.id);
        return updatedFriends;
      });
      
      this.eventsSignal.update(events => 
        events.map(event => {
          const shouldBeIncluded = eventIds.includes(event.id);
          const isIncluded = event.attendees.includes(friend.id);
          
          if (shouldBeIncluded !== isIncluded) {
            const updatedEvent = {
              ...event,
              attendees: shouldBeIncluded
                ? [...event.attendees, friend.id]
                : event.attendees.filter((id: string) => id !== friend.id)
            };
            console.log('Updated event attendees in signal for event:', event.id);
            return updatedEvent;
          }
          return event;
        })
      );

      // Update localStorage in background (clean data only)
      this.updateLocalStorageAsync();
      
      console.log('Friend updated successfully:', cleanFriend.name);
    } catch (error) {
      console.error('Failed to update friend:', error);
      
      // Fallback: at least update the signals and localStorage
      const cleanFriend = this.normalizeAndCleanFriend(friend);
      this.friendsSignal.update(friends => 
        friends.map(f => f.id === friend.id ? cleanFriend : f)
      );
      
      this.eventsSignal.update(events => 
        events.map(event => {
          const shouldBeIncluded = eventIds.includes(event.id);
          const isIncluded = event.attendees.includes(friend.id);
          
          if (shouldBeIncluded !== isIncluded) {
            return {
              ...event,
              attendees: shouldBeIncluded
                ? [...event.attendees, friend.id]
                : event.attendees.filter((id: string) => id !== friend.id)
            };
          }
          return event;
        })
      );
      
      this.updateLocalStorageAsync();
      console.log('Friend updated with fallback method:', cleanFriend.name);
    }
  }

  async updateEvent(updatedEvent: Event): Promise<void> {
    const normalizedEvent = this.normalizeEvent(updatedEvent);
    
    try {
      console.log('Updating event:', normalizedEvent);
      
      // Try to update in IndexedDB first
      if (this.dbReady()) {
        await this.db.events.put(normalizedEvent);
        console.log('Event updated in IndexedDB');
      }

      // Update signals immediately
      this.eventsSignal.update(events => {
        const updatedEvents = events.map(event => event.id === updatedEvent.id ? normalizedEvent : event);
        console.log('Events signal updated for event:', updatedEvent.id);
        return updatedEvents;
      });

      // Update localStorage in background (events only)
      this.updateEventsLocalStorageAsync();
      
      console.log('Event updated successfully:', normalizedEvent.title);
    } catch (error) {
      console.error('Failed to update event:', error);
      
      // Fallback: at least update the signal and localStorage
      this.eventsSignal.update(events =>
        events.map(event => event.id === updatedEvent.id ? normalizedEvent : event)
      );
      this.updateEventsLocalStorageAsync();
    }
  }

  // Attendee management methods
  async addAttendeeToEvent(friendId: string, eventId: string): Promise<void> {
    try {
      const event = await this.getEvent(eventId);
      if (!event) {
        throw new Error(`Event with id ${eventId} not found`);
      }

      // Check if friend is not already an attendee
      if (!event.attendees.includes(friendId)) {
        const updatedEvent = {
          ...event,
          attendees: [...event.attendees, friendId]
        };
        
        await this.updateEvent(updatedEvent);
        console.log('Added attendee to event:', friendId, eventId);
      }
    } catch (error) {
      console.error('Failed to add attendee to event:', error);
      throw error;
    }
  }

  async removeAttendeeFromEvent(friendId: string, eventId: string): Promise<void> {
    try {
      const event = await this.getEvent(eventId);
      if (!event) {
        throw new Error(`Event with id ${eventId} not found`);
      }

      const updatedEvent = {
        ...event,
        attendees: event.attendees.filter(id => id !== friendId)
      };
      
      await this.updateEvent(updatedEvent);
      console.log('Removed attendee from event:', friendId, eventId);
    } catch (error) {
      console.error('Failed to remove attendee from event:', error);
      throw error;
    }
  }

  async moveAttendeeBetweenEvents(friendId: string, sourceEventId: string, targetEventId: string): Promise<void> {
    try {
      // Remove from source event
      const sourceEvent = await this.getEvent(sourceEventId);
      if (sourceEvent) {
        const updatedSourceEvent = {
          ...sourceEvent,
          attendees: sourceEvent.attendees.filter(id => id !== friendId)
        };
        await this.updateEvent(updatedSourceEvent);
      }

      // Add to target event
      const targetEvent = await this.getEvent(targetEventId);
      if (targetEvent && !targetEvent.attendees.includes(friendId)) {
        const updatedTargetEvent = {
          ...targetEvent,
          attendees: [...targetEvent.attendees, friendId]
        };
        await this.updateEvent(updatedTargetEvent);
      }
      
      console.log('Moved attendee between events:', friendId, sourceEventId, targetEventId);
    } catch (error) {
      console.error('Failed to move attendee between events:', error);
      throw error;
    }
  }

  async getFriend(id: string): Promise<Friend | undefined> {
    if (this.dbReady()) {
      try {
        const friend = await this.db.friends.get(id);
        return friend ? this.normalizeFriend(friend) : undefined;
      } catch (error) {
        console.error('Failed to get friend from database:', error);
      }
    }
    return this.friends().find(f => f.id === id);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    if (this.dbReady()) {
      try {
        const event = await this.db.events.get(id);
        return event ? this.normalizeEvent(event) : undefined;
      } catch (error) {
        console.error('Failed to get event from database:', error);
      }
    }
    return this.events().find(e => e.id === id);
  }

  getEventsForFriend(friendId: string): Event[] {
    return this.events().filter(event => event.attendees.includes(friendId));
  }

  getFriendsForEvent(eventId: string): Friend[] {
    if (!this.dbReady()) return [];
    
    const event = this.events().find(e => e.id === eventId);
    if (!event) return [];
    
    return this.friends().filter(friend => event.attendees.includes(friend.id));
  }

  getSharedEvents(friendId1: string, friendId2: string): Event[] {
    return this.events().filter(
      event => event.attendees.includes(friendId1) && event.attendees.includes(friendId2)
    );
  }

  getConnectionStrengths(): Map<string, number> {
    if (!this.dbReady()) return new Map();
    
    const connections = new Map<string, number>();
    
    this.events().forEach(event => {
      const attendees = event.attendees;
      
      for (let i = 0; i < attendees.length; i++) {
        for (let j = i + 1; j < attendees.length; j++) {
          const friend1 = attendees[i];
          const friend2 = attendees[j];
          
          const key = [friend1, friend2].sort().join('-');
          
          if (connections.has(key)) {
            connections.set(key, connections.get(key)! + 1);
          } else {
            connections.set(key, 1);
          }
        }
      }
    });
    
    return connections;
  }
}