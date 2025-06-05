import { Friend } from '../models/friend.model';
import { Event } from '../models/event.model';

// Sample data for the application
export const SAMPLE_DATA = {
  friends: [
    {
      id: 'f1',
      name: 'Alex Johnson',
      photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
      bio: 'Passionate about photography and hiking',
      joinDate: new Date(2022, 0, 15),
      eventCount: 8
    },
    {
      id: 'f2',
      name: 'Michael Chen',
      photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Software developer and coffee enthusiast',
      joinDate: new Date(2022, 1, 3),
      eventCount: 6
    },
    {
      id: 'f3',
      name: 'Sarah Williams',
      photoUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
      bio: 'Yoga instructor and traveler',
      joinDate: new Date(2022, 2, 10),
      eventCount: 5
    },
    {
      id: 'f4',
      name: 'David Kim',
      photoUrl: 'https://randomuser.me/api/portraits/men/22.jpg',
      bio: 'Music producer and vinyl collector',
      joinDate: new Date(2022, 3, 5),
      eventCount: 7
    },
    {
      id: 'f5',
      name: 'Emma Rodriguez',
      photoUrl: 'https://randomuser.me/api/portraits/women/28.jpg',
      bio: 'Chef and foodie explorer',
      joinDate: new Date(2022, 4, 17),
      eventCount: 4
    },
    {
      id: 'f6',
      name: 'James Wilson',
      photoUrl: 'https://randomuser.me/api/portraits/men/53.jpg',
      bio: 'Graphic designer and art enthusiast',
      joinDate: new Date(2022, 5, 8),
      eventCount: 3
    },
    {
      id: 'f7',
      name: 'Olivia Martinez',
      photoUrl: 'https://randomuser.me/api/portraits/women/17.jpg',
      bio: 'Environmental scientist and cyclist',
      joinDate: new Date(2022, 6, 22),
      eventCount: 5
    },
    {
      id: 'f8',
      name: 'Ethan Thompson',
      photoUrl: 'https://randomuser.me/api/portraits/men/77.jpg',
      bio: 'Architect and urban explorer',
      joinDate: new Date(2022, 7, 14),
      eventCount: 2
    }
  ] as Friend[],
  
  events: [
    {
      id: 'e1',
      title: 'Summer Beach Party',
      date: new Date(2023, 6, 15),
      location: 'Sunset Beach',
      description: 'Annual beach party with games and BBQ',
      type: 'Social',
      attendees: ['f1', 'f2', 'f3', 'f4', 'f7']
    },
    {
      id: 'e2',
      title: 'Tech Conference 2023',
      date: new Date(2023, 4, 20),
      location: 'Convention Center',
      description: 'Annual tech conference with speakers and workshops',
      type: 'Professional',
      attendees: ['f1', 'f2', 'f4', 'f8']
    },
    {
      id: 'e3',
      title: 'Hiking Trip',
      date: new Date(2023, 8, 5),
      location: 'Mountain Trail Park',
      description: 'Day hike to the summit with picnic',
      type: 'Outdoor',
      attendees: ['f1', 'f3', 'f5', 'f7']
    },
    {
      id: 'e4',
      title: 'Art Gallery Opening',
      date: new Date(2023, 2, 18),
      location: 'Downtown Gallery',
      description: 'Opening night for new contemporary art exhibition',
      type: 'Cultural',
      attendees: ['f1', 'f6', 'f8']
    },
    {
      id: 'e5',
      title: 'Food Festival',
      date: new Date(2023, 9, 12),
      location: 'City Square',
      description: 'International food vendors and cooking demonstrations',
      type: 'Food',
      attendees: ['f2', 'f4', 'f5']
    },
    {
      id: 'e6',
      title: 'Music Concert',
      date: new Date(2023, 5, 30),
      location: 'Riverfront Amphitheater',
      description: 'Outdoor concert featuring local bands',
      type: 'Entertainment',
      attendees: ['f3', 'f4', 'f6', 'f7']
    },
    {
      id: 'e7',
      title: 'Charity Run',
      date: new Date(2023, 3, 22),
      location: 'City Park',
      description: '5K run to raise funds for local hospital',
      type: 'Charity',
      attendees: ['f1', 'f3', 'f5', 'f7']
    },
    {
      id: 'e8',
      title: 'Book Club Meeting',
      date: new Date(2023, 1, 8),
      location: 'Community Library',
      description: 'Discussion of monthly book selection',
      type: 'Educational',
      attendees: ['f2', 'f6', 'f8']
    },
    {
      id: 'e9',
      title: 'New Year Celebration',
      date: new Date(2023, 0, 1),
      location: 'Central Plaza',
      description: 'Fireworks and festivities to welcome the new year',
      type: 'Holiday',
      attendees: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8']
    },
    {
      id: 'e10',
      title: 'Photography Workshop',
      date: new Date(2023, 7, 25),
      location: 'Creative Studio',
      description: 'Hands-on workshop for portrait photography',
      type: 'Educational',
      attendees: ['f1', 'f6', 'f8']
    }
  ] as Event[]
};