import { Friend } from '../models/friend.model';
import { Event } from '../models/event.model';

export const MOCK_FRIENDS: Friend[] = [
  {
    id: 'mock-friend-1',
    name: 'Alice Johnson',
    photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    bio: 'Software engineer and coffee lover',
    joinDate: new Date('2023-01-15')
  },
  {
    id: 'mock-friend-2',
    name: 'Bob Smith',
    photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Designer and photographer',
    joinDate: new Date('2023-02-20')
  },
  {
    id: 'mock-friend-3',
    name: 'Carol Davis',
    photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    bio: 'Teacher and book enthusiast',
    joinDate: new Date('2023-03-10')
  }
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'mock-event-1',
    title: 'Coffee Meetup',
    date: new Date('2024-01-15'),
    location: 'Local Coffee Shop',
    description: 'Weekly coffee meetup',
    type: 'Social',
    attendees: ['mock-friend-1', 'mock-friend-2']
  },
  {
    id: 'mock-event-2',
    title: 'Book Club',
    date: new Date('2024-01-20'),
    location: 'Community Library',
    description: 'Monthly book discussion',
    type: 'Educational',
    attendees: ['mock-friend-2', 'mock-friend-3']
  },
  {
    id: 'mock-event-3',
    title: 'Photography Walk',
    date: new Date('2024-01-25'),
    location: 'City Park',
    description: 'Group photography session',
    type: 'Creative',
    attendees: ['mock-friend-1', 'mock-friend-3']
  }
];

export class MockDataBuilder {
  static friend(overrides: Partial<Friend> = {}): Friend {
    return {
      id: `mock-friend-${Date.now()}`,
      name: 'Mock Friend',
      photoUrl: 'https://randomuser.me/api/portraits/men/50.jpg',
      bio: 'Mock friend bio',
      joinDate: new Date(),
      ...overrides
    };
  }

  static event(overrides: Partial<Event> = {}): Event {
    return {
      id: `mock-event-${Date.now()}`,
      title: 'Mock Event',
      date: new Date(),
      location: 'Mock Location',
      description: 'Mock event description',
      type: 'Social',
      attendees: [],
      ...overrides
    };
  }

  static friendWithEvents(eventCount: number = 3): { friend: Friend; events: Event[] } {
    const friend = this.friend();
    const events = Array.from({ length: eventCount }, (_, i) => 
      this.event({
        title: `Event ${i + 1}`,
        attendees: [friend.id]
      })
    );

    return { friend, events };
  }
}