export class PerformanceUtils {
  private static debounceTimers = new Map<string, number>();

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key?: string
  ): (...args: Parameters<T>) => void {
    const timerKey = key || func.name || 'default';
    
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = window.setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(timerKey);
      }, delay);

      this.debounceTimers.set(timerKey, timer);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  static measurePerformance<T>(
    operation: () => T,
    label: string
  ): T {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  }

  static batchUpdates<T>(
    items: T[],
    processor: (item: T) => void,
    batchSize: number = 100
  ): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      
      const processBatch = () => {
        const endIndex = Math.min(index + batchSize, items.length);
        
        for (let i = index; i < endIndex; i++) {
          processor(items[i]);
        }
        
        index = endIndex;
        
        if (index < items.length) {
          requestAnimationFrame(processBatch);
        } else {
          resolve();
        }
      };
      
      processBatch();
    });
  }
}