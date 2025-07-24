interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];

  startMeasure(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`);
    }
  }

  endMeasure(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = window.performance.getEntriesByName(name)[0];
      if (measure) {
        const metric: PerformanceMetrics = {
          name,
          duration: measure.duration,
          timestamp: Date.now()
        };
        
        this.metrics.push(metric);
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
        }
        
        // Clean up
        window.performance.clearMarks(`${name}-start`);
        window.performance.clearMarks(`${name}-end`);
        window.performance.clearMeasures(name);
      }
    }
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    return fn().finally(() => {
      this.endMeasure(name);
    });
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Monitor Core Web Vitals
  monitorWebVitals() {
    if (typeof window === 'undefined') return;

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let clsEntries: any[] = [];

    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Report CLS when the page is unloaded
    window.addEventListener('beforeunload', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Cumulative Layout Shift:', clsValue);
      }
    });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 First Input Delay:', fid);
        }
      }
    });

    fidObserver.observe({ type: 'first-input', buffered: true });

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Largest Contentful Paint:', lastEntry.startTime);
      }
    });

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  // Monitor memory usage
  monitorMemory() {
    if (typeof window === 'undefined' || !(window as any).performance?.memory) return;

    const memory = (window as any).performance.memory;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🧠 Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
      });
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const measure = (name: string, fn: () => void) => {
    performanceMonitor.startMeasure(name);
    fn();
    performanceMonitor.endMeasure(name);
  };

  const measureAsync = <T>(name: string, fn: () => Promise<T>) => {
    return performanceMonitor.measureAsync(name, fn);
  };

  return { measure, measureAsync, performanceMonitor };
}
