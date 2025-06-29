import { Injectable, signal } from '@angular/core';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private flags = signal<Map<string, FeatureFlag>>(new Map());

  constructor() {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'analytics',
        enabled: false,
        description: 'Enable analytics tracking'
      },
      {
        key: 'advanced-filters',
        enabled: true,
        description: 'Enable advanced filtering options'
      },
      {
        key: 'export-features',
        enabled: true,
        description: 'Enable data export features'
      },
      {
        key: 'drag-drop',
        enabled: true,
        description: 'Enable drag and drop functionality'
      },
      {
        key: 'mobile-optimizations',
        enabled: true,
        description: 'Enable mobile-specific optimizations'
      }
    ];

    const flagMap = new Map<string, FeatureFlag>();
    defaultFlags.forEach(flag => flagMap.set(flag.key, flag));
    this.flags.set(flagMap);
  }

  isEnabled(key: string): boolean {
    const flag = this.flags().get(key);
    return flag?.enabled ?? false;
  }

  enable(key: string): void {
    this.updateFlag(key, true);
  }

  disable(key: string): void {
    this.updateFlag(key, false);
  }

  toggle(key: string): void {
    const current = this.isEnabled(key);
    this.updateFlag(key, !current);
  }

  private updateFlag(key: string, enabled: boolean): void {
    const currentFlags = this.flags();
    const flag = currentFlags.get(key);
    
    if (flag) {
      const updatedFlag = { ...flag, enabled };
      const newFlags = new Map(currentFlags);
      newFlags.set(key, updatedFlag);
      this.flags.set(newFlags);
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags().values());
  }

  setFlags(flags: FeatureFlag[]): void {
    const flagMap = new Map<string, FeatureFlag>();
    flags.forEach(flag => flagMap.set(flag.key, flag));
    this.flags.set(flagMap);
  }
}