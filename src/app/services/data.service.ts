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
      
      this.friendsSignal.set(friends);
      this.eventsSignal.set(events);
    } catch (error) {
      console.error('Failed to load data from Dexie', error);
      this.loadFromLocalStorage();
    }
  }

  private async loadSampleData() {
    try {
      // Remove eventCount from sample data before storing
      const friendsWithoutEventCount = SAMPLE_DATA.friends.map(({ eventCount, ...friend }) => friend);
      
      await this.db.transaction('rw', this.db.friends, this.db.events, async () => {
        await Promise.all([
          this.db.friends.bulkAdd(friendsWithoutEventCount),
          this.db.events.bulkAdd(SAMPLE_DATA.events)
        ]);
      });
      
      this.friendsSignal.set(friendsWithoutEventCount);
      this.eventsSignal.set(SAMPLE_DATA.events);
      
      localStorage.setItem('friends', JSON.stringify(friendsWithoutEventCount));
      localStorage.setItem('events', JSON.stringify(SAMPLE_DATA.events));
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
      // Remove eventCount if it exists in stored data
      const friendsWithoutEventCount = friends.map(({ eventCount, ...friend }: any) => friend);
      this.friendsSignal.set(friendsWithoutEventCount);
    } else {
      const friendsWithoutEventCount = SAMPLE_DATA.friends.map(({ eventCount, ...friend }) => friend);
      this.friendsSignal.set(friendsWithoutEventCount);
      localStorage.setItem('friends', JSON.stringify(friendsWithoutEventCount));
    }
    
    if (storedEvents) {
      this.eventsSignal.set(JSON.parse(storedEvents));
    } else {
      this.eventsSignal.set(SAMPLE_DATA.events);
      localStorage.setItem('events', JSON.stringify(SAMPLE_DATA.events));
    }
    
    this.dbReady.set(true);
  }

  async addEvent(event: Event): Promise<void> {
    try {
      await this.db.events.add(event);

      // Update signals
      this.eventsSignal.update(events => [...events, event]);

      // Update localStorage in background
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
        // Remove eventCount before storing
        const { eventCount, ...friendWithoutEventCount } = friend as any;
        await this.db.friends.add(friendWithoutEventCount);
        
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
      this.friendsSignal.update(friends => [...friends, friendWithoutEventCount]);
      
      this.eventsSignal.update(events => 
        events.map(event => 
          eventIds.includes(event.id) 
            ? { ...event, attendees: [...event.attendees, friend.id] }
            : event
        )
      );

      // Update localStorage in background
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
        // Remove eventCount before storing
        const { eventCount, ...friendWithoutEventCount } = friend as any;
        await this.db.friends.put(friendWithoutEventCount);
        
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
      this.friendsSignal.update(friends => 
        friends.map(f => f.id === friend.id ? friendWithoutEventCount : f)
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

      // Update localStorage in background
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
      await this.db.events.put(updatedEvent);

      // Update signals
      this.eventsSignal.update(events =>
        events.map(event => event.id === updatedEvent.id ? updatedEvent : event)
      );

      // Update localStorage in background
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
      return await this.db.friends.get(id);
    }
    return this.friends().find(f => f.id === id);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    if (this.dbReady()) {
      return await this.db.events.get(id);
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