import { Injectable, signal } from '@angular/core';
import { Location } from '@angular/common';

export interface NavigationState {
  id: string;
  type: 'dialog' | 'sidebar' | 'overlay';
  closeCallback: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private navigationStack = signal<NavigationState[]>([]);
  private isHandlingPopState = false;

  constructor(private location: Location) {
    this.setupPopStateListener();
  }

  private setupPopStateListener(): void {
    window.addEventListener('popstate', (event) => {
      if (this.isHandlingPopState) return;
      
      const stack = this.navigationStack();
      if (stack.length > 0) {
        // Prevent the actual navigation
        event.preventDefault();
        
        // Close the topmost item in the stack
        const topItem = stack[stack.length - 1];
        this.closeItem(topItem.id);
      }
    });
  }

  pushState(state: NavigationState): void {
    // Add to navigation stack
    this.navigationStack.update(stack => [...stack, state]);
    
    // Push a new history state to enable back button handling
    this.location.go(this.location.path(), '', { navigationId: state.id });
  }

  closeItem(id: string): void {
    const stack = this.navigationStack();
    const itemIndex = stack.findIndex(item => item.id === id);
    
    if (itemIndex === -1) return;
    
    const item = stack[itemIndex];
    
    // Remove from stack
    this.navigationStack.update(stack => stack.filter(item => item.id !== id));
    
    // Handle browser history
    this.isHandlingPopState = true;
    
    // If this is the topmost item, go back in history
    if (itemIndex === stack.length - 1) {
      this.location.back();
    }
    
    // Call the close callback
    item.closeCallback();
    
    // Reset the flag after a short delay
    setTimeout(() => {
      this.isHandlingPopState = false;
    }, 100);
  }

  closeAll(): void {
    const stack = this.navigationStack();
    
    // Close all items in reverse order (topmost first)
    for (let i = stack.length - 1; i >= 0; i--) {
      const item = stack[i];
      item.closeCallback();
    }
    
    // Clear the stack
    this.navigationStack.set([]);
    
    // Go back in history for each item
    this.isHandlingPopState = true;
    for (let i = 0; i < stack.length; i++) {
      this.location.back();
    }
    
    setTimeout(() => {
      this.isHandlingPopState = false;
    }, 100);
  }

  isInStack(id: string): boolean {
    return this.navigationStack().some(item => item.id === id);
  }

  getStackSize(): number {
    return this.navigationStack().length;
  }
}