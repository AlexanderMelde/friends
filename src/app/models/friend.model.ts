/**
 * Represents a friend in the social network
 */
export interface Friend {
  id: string;
  name: string;
  photoUrl: string;
  bio?: string;
  joinDate?: Date;
  // Note: eventCount is now computed dynamically from events
}

/**
 * Data structure for friend nodes in the visualization
 */
export interface FriendNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  photoUrl: string;
  bio?: string;
  joinDate?: Date;
  eventCount: number; // Computed dynamically
  // Radius for visualization sizing
  radius: number;
  // Position and forces for d3
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}