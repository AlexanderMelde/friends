import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { GraphService } from '../../services/graph.service';

interface EventTypeOption {
  value: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-filter-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './filter-controls.component.html',
  styleUrls: ['./filter-controls.component.css']
})
export class FilterControlsComponent implements OnInit {
  eventTypes = computed(() => {
    const events = this.dataService.events();
    
    // Count events by type
    const typeCounts = new Map<string, number>();
    events.forEach(event => {
      const type = event.type || 'Uncategorized';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });
    
    // Convert to array of options
    const options: EventTypeOption[] = Array.from(typeCounts.entries())
      .map(([value, count]) => ({
        value,
        label: value,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    
    // Add "All" option
    options.unshift({
      value: '',
      label: 'All Events',
      count: events.length
    });
    
    return options;
  });

  selectedType: string = '';

  constructor(
    private dataService: DataService,
    private graphService: GraphService
  ) {
    // Effect to sync selectedType with the graph service filter
    effect(() => {
      this.selectedType = this.graphService.filter();
    });
  }

  ngOnInit(): void {
    // Initialize selected type from current filter
    this.selectedType = this.graphService.filter();
  }

  applyFilter(): void {
    this.graphService.setFilter(this.selectedType);
  }

  clearFilter(): void {
    this.selectedType = '';
    this.graphService.setFilter('');
  }
}