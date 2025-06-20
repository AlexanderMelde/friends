import { Injectable, signal, computed, effect } from '@angular/core';
import * as d3 from 'd3';
import { Friend, FriendNode } from '../models/friend.model';
import { Event, EventLink } from '../models/event.model';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private _selectedNode = signal<FriendNode | null>(null);
  private _selectedLink = signal<EventLink | null>(null);
  private _filter = signal<string>('');
  private _yearFromFilter = signal<number | null>(null);
  private _yearToFilter = signal<number | null>(null);
  
  // Computed property for filtered events based on both type and year filters
  readonly filteredEvents = computed(() => {
    const events = this.dataService.events();
    const typeFilter = this._filter();
    const fromYear = this._yearFromFilter();
    const toYear = this._yearToFilter();
    
    let filtered = events;
    
    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(e => e.type === typeFilter);
    }
    
    // Apply year range filter
    if (fromYear !== null || toYear !== null) {
      filtered = filtered.filter(event => {
        const eventYear = new Date(event.date).getFullYear();
        const minYear = fromYear || Number.MIN_SAFE_INTEGER;
        const maxYear = toYear || Number.MAX_SAFE_INTEGER;
        return eventYear >= minYear && eventYear <= maxYear;
      });
    }
    
    return filtered;
  });
  
  readonly nodes = computed(() => {
    // Wait for data to be loaded before computing nodes
    const friends = this.dataService.friendsWithEventCount();
    const events = this.dataService.events();
    
    // Return empty array if data is not yet loaded
    if (!friends.length && !events.length) {
      return [];
    }
    
    // Use filtered events instead of applying filters here
    const filteredEvents = this.filteredEvents();
    
    // Create a map of friend IDs to their event counts
    const eventCounts = new Map<string, number>();
    filteredEvents.forEach(event => {
      event.attendees.forEach(attendeeId => {
        eventCounts.set(attendeeId, (eventCounts.get(attendeeId) || 0) + 1);
      });
    });

    // Create nodes for ALL friends, regardless of event count
    return friends.map(friend => ({
      ...friend,
      eventCount: eventCounts.get(friend.id) || 0,
      radius: this.calculateNodeRadius(eventCounts.get(friend.id) || 0)
    }));
  });

  readonly links = computed(() => {
    const nodes = this.nodes();
    const events = this.dataService.events();
    
    // Return empty array if no nodes or events
    if (!nodes.length || !events.length) {
      return [];
    }
    
    // Use filtered events instead of applying filters here
    const filteredEvents = this.filteredEvents();
    
    // Create a map for quick node lookups
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    // Create links between friends who share events
    const linkMap = new Map<string, EventLink>();
    
    filteredEvents.forEach(event => {
      const attendees = event.attendees;
      for (let i = 0; i < attendees.length; i++) {
        for (let j = i + 1; j < attendees.length; j++) {
          const source = attendees[i];
          const target = attendees[j];
          
          // Only create links between existing nodes
          if (nodeMap.has(source) && nodeMap.has(target)) {
            const linkKey = [source, target].sort().join('-');
            
            if (linkMap.has(linkKey)) {
              const link = linkMap.get(linkKey)!;
              link.sharedEvents.push(event);
              link.value = link.sharedEvents.length;
            } else {
              linkMap.set(linkKey, {
                source: nodeMap.get(source)!,
                target: nodeMap.get(target)!,
                sharedEvents: [event],
                value: 1
              });
            }
          }
        }
      }
    });

    return Array.from(linkMap.values());
  });

  // Public signal accessors
  readonly selectedNode = this._selectedNode.asReadonly();
  readonly selectedLink = this._selectedLink.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly yearFromFilter = this._yearFromFilter.asReadonly();
  readonly yearToFilter = this._yearToFilter.asReadonly();

  constructor(private dataService: DataService) {
    // Effect to handle selection updates - only clear link when node is explicitly set to null
    effect(() => {
      const node = this._selectedNode();
      const link = this._selectedLink();
      
      // Only clear the link if a different node is selected (not when node is null)
      if (node !== null && link) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (node.id !== sourceId && node.id !== targetId) {
          this._selectedLink.set(null);
        }
      }
    });
  }

  private calculateNodeRadius(eventCount: number): number {
    // Increased minimum and maximum radius for better visibility
    // Base radius is now 25 (was 15), max is 60 (was 40)
    return Math.max(25, Math.min(60, 25 + eventCount * 3));
  }

  calculateForces(): d3.Simulation<FriendNode, EventLink> {
    const nodes = this.nodes();
    const links = this.links();
    
    // Identify connected and isolated nodes
    const connectedNodeIds = new Set<string>();
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      connectedNodeIds.add(sourceId);
      connectedNodeIds.add(targetId);
    });
    
    const connectedNodes = nodes.filter(node => connectedNodeIds.has(node.id));
    const isolatedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
    
    const simulation = d3.forceSimulation<FriendNode>(nodes)
      .force('link', d3.forceLink<FriendNode, EventLink>(links)
        .id(d => d.id)
        .distance(d => 140 - d.value * 8) // Adjusted for larger nodes
        .strength(d => Math.min(0.8, 0.2 + d.value * 0.1)))
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Adjusted repulsion for larger nodes
          const isIsolated = !connectedNodeIds.has((d as FriendNode).id);
          const baseStrength = isIsolated ? -80 : -150;
          return baseStrength - (d as FriendNode).radius * 6;
        }))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide<FriendNode>()
        .radius(d => d.radius + 5) // Increased collision padding
        .strength(0.8));

    // Add a weak attraction force to pull isolated nodes toward the center of connected nodes
    if (isolatedNodes.length > 0 && connectedNodes.length > 0) {
      simulation.force('isolatedAttraction', () => {
        // Calculate center of mass of connected nodes
        let centerX = 0, centerY = 0;
        connectedNodes.forEach(node => {
          centerX += (node as FriendNode).x || 0;
          centerY += (node as FriendNode).y || 0;
        });
        centerX /= connectedNodes.length;
        centerY /= connectedNodes.length;
        
        // Apply weak attraction to isolated nodes toward the connected center
        isolatedNodes.forEach(node => {
          if ((node as FriendNode).x !== undefined && (node as FriendNode).y !== undefined) {
            const dx = centerX - (node as FriendNode).x!;
            const dy = centerY - (node as FriendNode).y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              // Weak attraction force (much weaker than repulsion)
              const force = 0.02;
              const fx = (dx / distance) * force;
              const fy = (dy / distance) * force;
              
              (node as FriendNode).vx = ((node as FriendNode).vx || 0) + fx;
              (node as FriendNode).vy = ((node as FriendNode).vy || 0) + fy;
            }
          }
        });
      });
    }

    // Add a clustering force to keep isolated nodes together
    if (isolatedNodes.length > 1) {
      simulation.force('isolatedClustering', () => {
        for (let i = 0; i < isolatedNodes.length; i++) {
          for (let j = i + 1; j < isolatedNodes.length; j++) {
            const nodeA = isolatedNodes[i];
            const nodeB = isolatedNodes[j];
            
            if ((nodeA as FriendNode).x !== undefined && (nodeA as FriendNode).y !== undefined && 
                (nodeB as FriendNode).x !== undefined && (nodeB as FriendNode).y !== undefined) {
              const dx = (nodeB as FriendNode).x! - (nodeA as FriendNode).x!;
              const dy = (nodeB as FriendNode).y! - (nodeA as FriendNode).y!;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Weak attraction between isolated nodes
              if (distance > 0 && distance < 250) { // Increased clustering distance
                const force = 0.01;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                
                (nodeA as FriendNode).vx = ((nodeA as FriendNode).vx || 0) + fx;
                (nodeA as FriendNode).vy = ((nodeA as FriendNode).vy || 0) + fy;
                (nodeB as FriendNode).vx = ((nodeB as FriendNode).vx || 0) - fx;
                (nodeB as FriendNode).vy = ((nodeB as FriendNode).vy || 0) - fy;
              }
            }
          }
        }
      });
    }
    
    return simulation;
  }

  selectNode(node: FriendNode | null) {
    this._selectedNode.set(node);
    // When explicitly selecting a node, clear the link selection
    if (node !== null) {
      this._selectedLink.set(null);
    }
  }
  
  selectLink(link: EventLink | null) {
    this._selectedLink.set(link);
    // Don't automatically clear the node when selecting a link
    // The link can be selected independently of node selection
  }
  
  setFilter(filter: string) {
    this._filter.set(filter);
  }

  setYearFilter(fromYear: number | null, toYear: number | null) {
    this._yearFromFilter.set(fromYear);
    this._yearToFilter.set(toYear);
  }

  clearYearFilter() {
    this._yearFromFilter.set(null);
    this._yearToFilter.set(null);
  }

  hasYearFilter(): boolean {
    return this._yearFromFilter() !== null || this._yearToFilter() !== null;
  }

  private areLinksEqual(link1: EventLink, link2: EventLink): boolean {
    const source1 = typeof link1.source === 'string' ? link1.source : link1.source.id;
    const target1 = typeof link1.target === 'string' ? link1.target : link1.target.id;
    const source2 = typeof link2.source === 'string' ? link2.source : link2.source.id;
    const target2 = typeof link2.target === 'string' ? link2.target : link2.target.id;
    
    return (source1 === source2 && target1 === target2) ||
           (source1 === target2 && target1 === source2);
  }
}