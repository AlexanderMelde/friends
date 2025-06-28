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

  private ensureDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }

  private normalizeFriend(friend: any): Friend {
    return {
      ...friend,
      joinDate: this.ensureDate(friend.joinDate)
    };
  }

  private normalizeEvent(event: any): Event {
    return {
      ...event,
      date: this.ensureDate(event.date)
    };
  }

  private async initDatabase() {
    try {
      const friendCount = await this.db.friends.count();
      if (friendCount === 0) {
        await this.loadSampleData();
      } else {
        await this.loadAllData();
      }

      this.dbReady.set(true);
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
    } catch (error) {
      console.error('Failed to load data from Dexie', error);
      this.loadFromLocalStorage();
    }
  }

  private async loadSampleData() {
    try {
      // Remove eventCount from sample data before storing and normalize dates
      const friendsWithoutEventCount = SAMPLE_DATA.friends.map(friend => {
        const { eventCount, ...friendData } = friend as any;
        return this.normalizeFriend(friendData);
      });
      
      const normalizedEvents = SAMPLE_DATA.events.map(event => this.normalizeEvent(event));
      
      await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
        await Promise.all([
          this.db.friends.bulkAdd(friendsWithoutEventCount),
          this.db.events.bulkAdd(normalizedEvents)
        ]);
      });
      
      this.friendsSignal.set(friendsWithoutEventCount);
      this.eventsSignal.set(normalizedEvents);
      
      // Store clean data without eventCount
      localStorage.setItem('friends', JSON.stringify(friendsWithoutEventCount));
      localStorage.setItem('events', JSON.stringify(normalizedEvents));
    } catch (error) {
      console.error('Failed to load sample data', error);
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    const storedFriends = localStorage.getItem('friends');
    const storedEvents = localStorage.getItem('events');
    
    if (storedFriends) {
      const friends = JSON.parse(storedFriends);
      // Remove eventCount if it exists in stored data and normalize dates
      const friendsWithoutEventCount = friends.map((friend: any) => {
        const { eventCount, ...friendData } = friend;
        return this.normalizeFriend(friendData);
      });
      this.friendsSignal.set(friendsWithoutEventCount);
    } else {
      const friendsWithoutEventCount = SAMPLE_DATA.friends.map(friend => {
        const { eventCount, ...friendData } = friend as any;
        return this.normalizeFriend(friendData);
      });
      this.friendsSignal.set(friendsWithoutEventCount);
      localStorage.setItem('friends', JSON.stringify(friendsWithoutEventCount));
    }
    
    if (storedEvents) {
      const events = JSON.parse(storedEvents);
      const normalizedEvents = events.map((event: any) => this.normalizeEvent(event));
      this.eventsSignal.set(normalizedEvents);
    } else {
      const normalizedEvents = SAMPLE_DATA.events.map(event => this.normalizeEvent(event));
      this.eventsSignal.set(normalizedEvents);
      localStorage.setItem('events', JSON.stringify(normalizedEvents));
    }
    
    this.dbReady.set(true);
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
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  async addEvent(event: Event): Promise<void> {
    try {
      const normalizedEvent = this.normalizeEvent(event);
      await this.db.events.add(normalizedEvent);

      // Update signals
      this.eventsSignal.update(events => [...events, normalizedEvent]);

      // Update localStorage in background (events only)
      setTimeout(() => {
        localStorage.setItem('events', JSON.stringify(this.events()));
      }, 0);
    } catch (error) {
      console.error('Failed to add event:', error);
      await this.loadAllData(); // Rollback to consistent state
    }
  }

  async addFriend(friend: Friend, eventIds: string[]): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
        // Remove eventCount before storing and normalize dates
        const { eventCount, ...friendWithoutEventCount } = friend as any;
        const normalizedFriend = this.normalizeFriend(friendWithoutEventCount);
        await this.db.friends.add(normalizedFriend);
        
        // Update events
        for (const eventId of eventIds) {
          const event = await this.db.events.get(eventId);
          if (event) {
            event.attendees.push(friend.id);
            await this.db.events.put(event);
          }
        }
      });

      // Update signals
      const { eventCount, ...friendWithoutEventCount } = friend as any;
      const normalizedFriend = this.normalizeFriend(friendWithoutEventCount);
      this.friendsSignal.update(friends => [...friends, normalizedFriend]);
      
      this.eventsSignal.update(events => 
        events.map(event => 
          eventIds.includes(event.id) 
            ? { ...event, attendees: [...event.attendees, friend.id] }
            : event
        )
      );

      // Update localStorage in background (clean data only)
      setTimeout(() => {
        localStorage.setItem('friends', JSON.stringify(this.friends()));
        localStorage.setItem('events', JSON.stringify(this.events()));
      }, 0);
    } catch (error) {
      console.error('Failed to add friend:', error);
      await this.loadAllData(); // Rollback to consistent state
    }
  }

  async updateFriend(friend: Friend, eventIds: string[]): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
        // Remove eventCount before storing and normalize dates
        const { eventCount, ...friendWithoutEventCount } = friend as any;
        const normalizedFriend = this.normalizeFriend(friendWithoutEventCount);
        await this.db.friends.put(normalizedFriend);
        
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
          }
        }
      });

      // Update signals
      const { eventCount, ...friendWithoutEventCount } = friend as any;
      const normalizedFriend = this.normalizeFriend(friendWithoutEventCount);
      this.friendsSignal.update(friends => 
        friends.map(f => f.id === friend.id ? normalizedFriend : f)
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

      // Update localStorage in background (clean data only)
      setTimeout(() => {
        localStorage.setItem('friends', JSON.stringify(this.friends()));
        localStorage.setItem('events', JSON.stringify(this.events()));
      }, 0);
    } catch (error) {
      console.error('Failed to update friend:', error);
      await this.loadAllData(); // Rollback to consistent state
    }
  }

  async updateEvent(updatedEvent: Event): Promise<void> {
    try {
      const normalizedEvent = this.normalizeEvent(updatedEvent);
      await this.db.events.put(normalizedEvent);

      // Update signals
      this.eventsSignal.update(events =>
        events.map(event => event.id === updatedEvent.id ? normalizedEvent : event)
      );

      // Update localStorage in background (events only)
      setTimeout(() => {
        localStorage.setItem('events', JSON.stringify(this.events()));
      }, 0);
    } catch (error) {
      console.error('Failed to update event:', error);
      await this.loadAllData(); // Rollback to consistent state
    }
  }

  async getFriend(id: string): Promise<Friend | undefined> {
    if (this.dbReady()) {
      const friend = await this.db.friends.get(id);
      return friend ? this.normalizeFriend(friend) : undefined;
    }
    return this.friends().find(f => f.id === id);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    if (this.dbReady()) {
      const event = await this.db.events.get(id);
      return event ? this.normalizeEvent(event) : undefined;
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