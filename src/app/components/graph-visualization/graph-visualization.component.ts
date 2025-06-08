import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, effect, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as d3 from 'd3';
import { FriendNode } from '../../models/friend.model';
import { EventLink } from '../../models/event.model';
import { GraphService } from '../../services/graph.service';
import { FriendTooltipComponent } from '../friend-tooltip/friend-tooltip.component';
import { EventDetailsCardComponent } from '../event-details-card/event-details-card.component';

@Component({
  selector: 'app-graph-visualization',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    FriendTooltipComponent,
    EventDetailsCardComponent
  ],
  templateUrl: './graph-visualization.component.html',
  styleUrls: ['./graph-visualization.component.css'],
  animations: [
    trigger('slideUpAnimation', [
      state('hidden', style({
        transform: 'translateY(100%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('hidden => visible', [
        animate('350ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('visible => hidden', [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ])
    ])
  ]
})
export class GraphVisualizationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;
  
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private simulation!: d3.Simulation<FriendNode, EventLink>;
  private isInitialized = false;
  private resizeObserver!: ResizeObserver;
  
  private nodeElements!: d3.Selection<SVGGElement, FriendNode, SVGGElement, unknown>;
  private linkElements!: d3.Selection<SVGLineElement, EventLink, SVGGElement, unknown>;
  
  readonly nodes = computed(() => this.graphService.nodes());
  readonly links = computed(() => this.graphService.links());
  readonly selectedNode = computed(() => this.graphService.selectedNode());
  readonly selectedLink = computed(() => this.graphService.selectedLink());
  readonly selectedTabIndex = signal(0);
  
  // Computed property to determine if mobile tabs should be shown
  readonly showMobileTabs = computed(() => {
    return this.isMobileView() && (this.selectedNode() !== null || this.selectedLink() !== null);
  });
  
  constructor(public graphService: GraphService) {
    // Effect for data changes (nodes/links)
    effect(() => {
      // Only update graph if initialized and we have nodes (data is loaded)
      const nodes = this.nodes();
      if (this.isInitialized && nodes.length > 0) {
        this.updateGraph();
      }
    });

    // Separate effect for selection changes
    effect(() => {
      const selectedNode = this.selectedNode();
      const selectedLink = this.selectedLink();
      
      // Only update highlighting if graph is initialized and we have elements
      if (this.isInitialized && this.nodeElements && this.linkElements) {
        this.highlightSelection();
      }
    });

    // Effect to auto-switch tabs when something is newly selected
    effect(() => {
      const selectedNode = this.selectedNode();
      const selectedLink = this.selectedLink();
      
      // Only auto-switch if we're on mobile and something was just selected
      if (this.isMobileView()) {
        if (selectedNode && !selectedLink) {
          // Only switch to friend tab if not already there
          if (this.selectedTabIndex() !== 0) {
            this.selectedTabIndex.set(0);
          }
        } else if (selectedLink) {
          // Only switch to event tab if not already there
          if (this.selectedTabIndex() !== 1) {
            this.selectedTabIndex.set(1);
          }
        }
      }
    });

    // Effect to handle mobile tab visibility changes for smooth transitions
    effect(() => {
      const showTabs = this.showMobileTabs();
      
      // Add a small delay to ensure smooth animation timing
      if (showTabs) {
        // When showing tabs, trigger the animation after a brief delay
        setTimeout(() => {
          // This ensures the DOM has updated before the animation starts
        }, 10);
      }
    });
  }

  ngOnInit(): void {
    // Don't initialize here - wait for AfterViewInit
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the container is fully rendered and sized
    setTimeout(() => {
      this.initializeGraph();
      this.setupResizeObserver();
      this.isInitialized = true;
      
      // Trigger initial graph update if data is already available
      const nodes = this.nodes();
      if (nodes.length > 0) {
        this.updateGraph();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  isMobileView(): boolean {
    return window.innerWidth <= 800;
  }

  onTabChange(index: number): void {
    // Allow manual tab switching without auto-switching back
    this.selectedTabIndex.set(index);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.isInitialized) {
        this.updateSVGDimensions();
      }
    });
    this.resizeObserver.observe(this.graphContainer.nativeElement);
  }

  private updateSVGDimensions(): void {
    const element = this.graphContainer.nativeElement;
    const graphArea = element.querySelector('.graph-area');
    const rect = graphArea ? graphArea.getBoundingClientRect() : element.getBoundingClientRect();
    const width = rect.width || element.clientWidth || 800;
    const height = rect.height || element.clientHeight || 600;

    this.svg
      .attr('viewBox', [-width / 2, -height / 2, width, height]);

    // Restart simulation with new center force
    if (this.simulation) {
      this.simulation
        .force('center', d3.forceCenter(0, 0))
        .alpha(0.3)
        .restart();
    }
  }

  private initializeGraph(): void {
    const element = this.graphContainer.nativeElement;
    const graphArea = element.querySelector('.graph-area');
    const container = graphArea || element;
    const rect = container.getBoundingClientRect();
    const width = rect.width || container.clientWidth || 800;
    const height = rect.height || container.clientHeight || 600;

    // Clear any existing SVG
    d3.select(container).selectAll('svg').remove();

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .style('display', 'block');

    this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoomBehavior);
    
    this.g = this.svg.append('g');
    
    const linkGroup = this.g.append('g').attr('class', 'links');
    const nodeGroup = this.g.append('g').attr('class', 'nodes');

    this.linkElements = linkGroup.selectAll('line');
    this.nodeElements = nodeGroup.selectAll('g');
  }

  private updateGraph(): void {
    const nodes = this.nodes();
    if (!nodes.length || !this.isInitialized) return;

    const links = this.links();
    this.simulation = this.graphService.calculateForces();
    
    // Update links with proper event handling
    this.linkElements = this.linkElements
      .data(links, (d: any) => `${d.source.id}-${d.target.id}`)
      .join(
        enter => enter.append('line')
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0.8)
          .attr('stroke-width', d => Math.max(1, Math.min(8, d.value)))
          .style('cursor', 'pointer')
          .style('pointer-events', 'all')
          .on('mouseover', (event, d) => this.onLinkMouseOver(event, d))
          .on('mouseout', (event, d) => this.onLinkMouseOut(event, d))
          .on('click', (event, d) => this.onLinkClick(event, d))
      );

    // Update nodes with proper event handling
    this.nodeElements = this.nodeElements
      .data(nodes, (d: any) => d.id)
      .join(
        enter => {
          const nodeGroup = enter.append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('mouseover', (event, d) => this.onNodeMouseOver(event, d))
            .on('mouseout', (event, d) => this.onNodeMouseOut(event, d))
            .on('click', (event, d) => this.onNodeClick(event, d))
            .call(this.drag());

          nodeGroup.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', '#fff')
            .attr('stroke', '#3F51B5')
            .attr('stroke-width', 2);

          nodeGroup.append('clipPath')
            .attr('id', d => `clip-${d.id}`)
            .append('circle')
            .attr('r', d => d.radius - 2);

          nodeGroup.append('image')
            .attr('xlink:href', d => d.photoUrl)
            .attr('x', d => -d.radius + 2)
            .attr('y', d => -d.radius + 2)
            .attr('width', d => (d.radius - 2) * 2)
            .attr('height', d => (d.radius - 2) * 2)
            .attr('clip-path', d => `url(#clip-${d.id})`);

          return nodeGroup;
        }
      );

    this.simulation.on('tick', () => {
      this.linkElements
        .attr('x1', d => (d.source as FriendNode).x!)
        .attr('y1', d => (d.source as FriendNode).y!)
        .attr('x2', d => (d.target as FriendNode).x!)
        .attr('y2', d => (d.target as FriendNode).y!);

      this.nodeElements
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Apply highlighting after graph is updated
    this.highlightSelection();
  }

  private drag(): d3.DragBehavior<SVGGElement, FriendNode, FriendNode> {
    return d3.drag<SVGGElement, FriendNode, FriendNode>()
      .on('start', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  private highlightSelection(): void {
    if (!this.nodeElements || !this.linkElements) return;

    const selectedNode = this.selectedNode();
    const selectedLink = this.selectedLink();

    // Reset all highlights
    this.nodeElements.select('circle')
      .attr('stroke', '#3F51B5')
      .attr('stroke-width', 2);

    this.linkElements
      .attr('stroke', '#999')
      .attr('stroke-width', d => Math.max(1, Math.min(8, d.value)))
      .attr('stroke-opacity', 0.8);

    if (selectedNode) {
      // Highlight selected node
      this.nodeElements
        .filter(d => d.id === selectedNode.id)
        .select('circle')
        .attr('stroke', '#f44336')
        .attr('stroke-width', 4);

      // Highlight connected links
      this.linkElements
        .filter(d => {
          const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
          const targetId = typeof d.target === 'string' ? d.target : d.target.id;
          return sourceId === selectedNode.id || targetId === selectedNode.id;
        })
        .attr('stroke', d => {
          // If this is the selected link, use a different color
          if (selectedLink && this.areLinksEqual(d, selectedLink)) {
            return '#009688'; // Teal color for selected link
          }
          return '#f44336'; // Red color for other connected links
        })
        .attr('stroke-width', d => Math.max(2, Math.min(10, d.value + 2)))
        .attr('stroke-opacity', 1);
    }

    if (selectedLink) {
      // Highlight selected link
      this.linkElements
        .filter(d => this.areLinksEqual(d, selectedLink))
        .attr('stroke', '#009688') // Teal color for selected link
        .attr('stroke-width', d => Math.max(2, Math.min(10, d.value + 2)))
        .attr('stroke-opacity', 1);
    }
  }

  private areLinksEqual(link1: EventLink, link2: EventLink): boolean {
    const source1 = typeof link1.source === 'string' ? link1.source : link1.source.id;
    const target1 = typeof link1.target === 'string' ? link1.target : link1.target.id;
    const source2 = typeof link2.source === 'string' ? link2.source : link2.source.id;
    const target2 = typeof link2.target === 'string' ? link2.target : link2.target.id;
    
    return (source1 === source2 && target1 === target2) ||
           (source1 === target2 && target1 === source2);
  }

  private onNodeMouseOver(event: MouseEvent, node: FriendNode): void {
    const nodeSelection = d3.select(event.currentTarget as SVGGElement);
    nodeSelection.select('circle')
      .attr('stroke', '#009688')
      .attr('stroke-width', 3);
  }

  private onNodeMouseOut(event: MouseEvent, node: FriendNode): void {
    if (!this.selectedNode()) {
      this.nodeElements.select('circle')
        .attr('stroke', '#3F51B5')
        .attr('stroke-width', 2);
    } else {
      this.highlightSelection();
    }
  }

  private onNodeClick(event: MouseEvent, node: FriendNode): void {
    event.stopPropagation();
    
    if (this.selectedNode()?.id === node.id) {
      this.graphService.selectNode(null);
    } else {
      this.graphService.selectNode(node);
    }
  }

  private onLinkMouseOver(event: MouseEvent, link: EventLink): void {
    const linkSelection = d3.select(event.currentTarget as SVGLineElement);
    linkSelection
      .attr('stroke', '#009688')
      .attr('stroke-width', Math.max(2, Math.min(10, link.value + 2)))
      .attr('stroke-opacity', 1);
  }

  private onLinkMouseOut(event: MouseEvent, link: EventLink): void {
    if (!this.selectedLink() || !this.areLinksEqual(link, this.selectedLink()!)) {
      const linkSelection = d3.select(event.currentTarget as SVGLineElement);
      linkSelection
        .attr('stroke', '#999')
        .attr('stroke-width', Math.max(1, Math.min(8, link.value)))
        .attr('stroke-opacity', 0.8);
    } else {
      this.highlightSelection();
    }
  }

  private onLinkClick(event: MouseEvent, link: EventLink): void {
    event.stopPropagation();
    
    if (this.selectedLink() && this.areLinksEqual(link, this.selectedLink()!)) {
      this.graphService.selectLink(null);
    } else {
      this.graphService.selectLink(link);
    }
  }

  zoomIn(): void {
    this.svg.transition().duration(300).call(
      this.zoomBehavior.scaleBy, 1.2
    );
  }

  zoomOut(): void {
    this.svg.transition().duration(300).call(
      this.zoomBehavior.scaleBy, 0.8
    );
  }

  resetZoom(): void {
    this.svg.transition().duration(300).call(
      this.zoomBehavior.transform, d3.zoomIdentity
    );
  }
}