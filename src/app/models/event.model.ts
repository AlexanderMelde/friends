import { FriendNode } from './friend.model';

/**
 * Represents an event in the social network
 */
export interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  description?: string;
  type?: string;
  // IDs of friends who attended this event
  attendees: string[];
}

/**
 * Data structure for event connections (edges) in the visualization
 */
export interface EventLink extends d3.SimulationLinkDatum<FriendNode> {
  source: string | FriendNode;
  target: string | FriendNode;
  // Events shared between two friends
  sharedEvents: Event[];
  // Value represents the strength of connection (number of shared events)
  value: number;
}