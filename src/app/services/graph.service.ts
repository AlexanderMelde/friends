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
  
  readonly nodes = computed(() => {
    const friends = this.dataService.friendsWithEventCount();
    const events = this.dataService.events();
    const filter = this._filter();
    
    const filteredEvents = filter ? events.filter(e => e.type === filter) : events;
    
    // Create a map of friend IDs to their event counts
    const eventCounts = new Map<string, number>();
    filteredEvents.forEach(event => {
      event.attendees.forEach(attendeeId => {
        eventCounts.set(attendeeId, (eventCounts.get(attendeeId) || 0) + 1);
      });
    });

    // Create nodes for friends who have events
    return friends
      .filter(friend => eventCounts.get(friend.id) || 0 > 0)
      .map(friend => ({
        ...friend,
        eventCount: eventCounts.get(friend.id) || 0,
        radius: this.calculateNodeRadius(eventCounts.get(friend.id) || 0)
      }));
  });

  readonly links = computed(() => {
    const nodes = this.nodes();
    const events = this.dataService.events();
    const filter = this._filter();
    
    const filteredEvents = filter ? events.filter(e => e.type === filter) : events;
    
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

  constructor(private dataService: DataService) {
    // Effect to handle selection updates
    effect(() => {
      const node = this._selectedNode();
      const link = this._selectedLink();
      
      if (node === null) {
        this._selectedLink.set(null);
      } else if (link) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (node.id !== sourceId && node.id !== targetId) {
          this._selectedLink.set(null);
        }
      }
    });
  }

  private calculateNodeRadius(eventCount: number): number {
    return Math.max(20, Math.min(40, 20 + eventCount * 2));
  }

  calculateForces(): d3.Simulation<FriendNode, EventLink> {
    const nodes = this.nodes();
    const links = this.links();
    
    return d3.forceSimulation<FriendNode>(nodes)
      .force('link', d3.forceLink<FriendNode, EventLink>(links)
        .id(d => d.id)
        .distance(d => 150 - d.value * 10)
        .strength(d => Math.min(0.7, 0.1 + d.value * 0.1)))
      .force('charge', d3.forceManyBody()
        .strength(d => -100 - (d as FriendNode).radius * 10))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide<FriendNode>().radius(d => d.radius + 5));
  }

  selectNode(node: FriendNode | null) {
    this._selectedNode.set(node);
  }
  
  selectLink(link: EventLink | null) {
    if (link === null) {
      this._selectedLink.set(null);
      this._selectedNode.set(null);
      return;
    }

    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;

    const selectedNode = this._selectedNode();
    if (selectedNode && selectedNode.id !== sourceId && selectedNode.id !== targetId) {
      this._selectedNode.set(null);
    }

    this._selectedLink.set(link);
  }
  
  setFilter(filter: string) {
    this._filter.set(filter);
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