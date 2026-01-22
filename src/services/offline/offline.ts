import { logger } from '@/services/monitoring/logger';

export interface OfflineState {
  isOnline: boolean;
  lastOnline: string | null;
  offlineSince: string | null;
  connectionQuality: 'good' | 'degraded' | 'poor' | 'offline';
}

// Offline state management
class OfflineManager {
  private state: OfflineState = {
    isOnline: true,
    lastOnline: null,
    offlineSince: null,
    connectionQuality: 'good',
  };
  
  private listeners: Set<(state: OfflineState) => void> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // Check initial state
    this.state.isOnline = navigator.onLine;
    
    // Listen to online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Start connection quality monitoring
    this.startQualityMonitoring();
    
    // Check stored offline data
    this.loadOfflineState();
  }

  private handleOnline = () => {
    logger.info('Connection restored');
    this.updateState({
      isOnline: true,
      lastOnline: new Date().toISOString(),
      offlineSince: null,
    });
  };

  private handleOffline = () => {
    logger.info('Connection lost');
    this.updateState({
      isOnline: false,
      offlineSince: new Date().toISOString(),
    });
  };

  private startQualityMonitoring() {
    // Monitor connection quality every 30 seconds
    this.pingInterval = setInterval(() => {
      this.checkConnectionQuality();
    }, 30000);
    
    // Initial check
    this.checkConnectionQuality();
  }

  private async checkConnectionQuality() {
    if (!navigator.onLine) {
      this.updateState({ connectionQuality: 'offline' });
      return;
    }

    try {
      const startTime = performance.now();
      const response = await fetch('/api/v1/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      this.lastPingTime = latency;
      
      let quality: OfflineState['connectionQuality'] = 'good';
      if (latency > 1000) quality = 'poor';
      else if (latency > 300) quality = 'degraded';
      
      this.updateState({ connectionQuality: quality });
    } catch (error) {
      // Fetch failed, likely offline or very poor connection
      this.updateState({ connectionQuality: 'offline', isOnline: false });
    }
  }

  private updateState(partial: Partial<OfflineState>) {
    this.state = { ...this.state, ...partial };
    this.saveOfflineState();
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private saveOfflineState() {
    try {
      localStorage.setItem('offline-state', JSON.stringify({
        lastOnline: this.state.lastOnline,
        offlineSince: this.state.offlineSince,
      }));
    } catch (error) {
      logger.error('Failed to save offline state:', error);
    }
  }

  private loadOfflineState() {
    try {
      const stored = localStorage.getItem('offline-state');
      if (stored) {
        const data = JSON.parse(stored);
        this.state.lastOnline = data.lastOnline;
        if (!this.state.isOnline) {
          this.state.offlineSince = data.offlineSince;
        }
      }
    } catch (error) {
      logger.error('Failed to load offline state:', error);
    }
  }

  // Public API
  getState(): OfflineState {
    return { ...this.state };
  }

  isOnline(): boolean {
    return this.state.isOnline;
  }

  getConnectionQuality(): OfflineState['connectionQuality'] {
    return this.state.connectionQuality;
  }

  subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

// React hook for offline state
export function useOffline() {
  const [state, setState] = React.useState<OfflineState>(offlineManager.getState());

  React.useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}

// Offline queue for API requests
interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: any;
  timestamp: string;
  retryCount: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  
  constructor() {
    this.loadQueue();
    
    // Process queue when coming back online
    offlineManager.subscribe((state) => {
      if (state.isOnline && !this.processing) {
        this.processQueue();
      }
    });
  }

  add(method: string, url: string, data?: any): string {
    const request: QueuedRequest = {
      id: `req-${Date.now()}-${Math.random()}`,
      method,
      url,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    
    this.queue.push(request);
    this.saveQueue();
    
    logger.info('Request queued for offline processing:', request.id);
    
    // Try to process immediately if online
    if (offlineManager.isOnline()) {
      this.processQueue();
    }
    
    return request.id;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    logger.info(`Processing offline queue: ${this.queue.length} requests`);
    
    while (this.queue.length > 0 && offlineManager.isOnline()) {
      const request = this.queue[0];
      
      try {
        await this.processRequest(request);
        this.queue.shift(); // Remove successful request
        this.saveQueue();
      } catch (error) {
        logger.error('Failed to process queued request:', error);
        request.retryCount++;
        
        if (request.retryCount >= 3) {
          logger.error('Request failed after 3 retries, removing from queue:', request.id);
          this.queue.shift();
          this.saveQueue();
        } else {
          // Move to end of queue
          this.queue.push(this.queue.shift()!);
          this.saveQueue();
        }
        
        // Stop processing if offline again
        if (!offlineManager.isOnline()) break;
      }
    }
    
    this.processing = false;
  }

  private async processRequest(request: QueuedRequest) {
    const response = await fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: request.data ? JSON.stringify(request.data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    
    logger.info('Successfully processed queued request:', request.id);
    return response;
  }

  private saveQueue() {
    try {
      localStorage.setItem('offline-queue', JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save offline queue:', error);
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem('offline-queue');
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info(`Loaded ${this.queue.length} queued requests`);
      }
    } catch (error) {
      logger.error('Failed to load offline queue:', error);
    }
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();

// Progressive enhancement utilities
export function isFeatureAvailableOffline(feature: string): boolean {
  const offlineFeatures = [
    'chat-history',
    'workflow-viewer',
    'settings-view',
    'node-registry-browse',
  ];
  
  return offlineFeatures.includes(feature);
}

export function getOfflineFallback<T>(feature: string, fallback: T): T | null {
  if (isFeatureAvailableOffline(feature)) {
    return fallback;
  }
  return null;
}

import React from 'react';