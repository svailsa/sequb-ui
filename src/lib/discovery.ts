/**
 * Discovery Service Client for Multi-Region Support
 * Handles region discovery, user-region mapping, and cross-region redirects
 */

export interface RegionInfo {
  code: string;
  name: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface RegionRedirect {
  status: 'region_redirect';
  region_code: string;
  region_endpoint: string;
  message: string;
}

export interface DiscoveryClientConfig {
  baseUrl?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number; // in milliseconds
  timeout?: number; // in milliseconds
  authToken?: string;
}

interface CachedRegionLookup {
  region: RegionInfo;
  timestamp: number;
}

/**
 * Client for interacting with the Sequb Discovery Service
 */
export class DiscoveryClient {
  private baseUrl: string;
  private cacheEnabled: boolean;
  private cacheTTL: number;
  private timeout: number;
  private cache: Map<string, CachedRegionLookup>;
  private authToken?: string;

  constructor(config: DiscoveryClientConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/v1/discovery';
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.cacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5 minutes default
    this.timeout = config.timeout || 5000; // 5 seconds default
    this.cache = new Map();
    this.authToken = config.authToken;
  }

  /**
   * Set or update the authentication token
   */
  setAuthToken(token: string | undefined) {
    this.authToken = token;
  }

  /**
   * Get all available regions
   */
  async getRegions(): Promise<RegionInfo[]> {
    const cacheKey = 'all_regions';
    
    if (this.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return [cached.region];
      }
    }

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/regions`);
      const regions = await response.json() as RegionInfo[];
      
      // Cache all regions
      if (this.cacheEnabled && regions.length > 0) {
        regions.forEach(region => {
          this.addToCache(region.code, region);
        });
      }
      
      return regions;
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      throw error;
    }
  }

  /**
   * Suggest regions based on user location
   */
  async suggestRegions(location: LocationCoordinates): Promise<RegionInfo[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/regions/suggest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(location),
        }
      );
      
      return await response.json() as RegionInfo[];
    } catch (error) {
      console.error('Failed to suggest regions:', error);
      // Fallback to all regions if suggestion fails
      return this.getRegions();
    }
  }

  /**
   * Get the authenticated user's region
   */
  async getUserRegion(): Promise<RegionInfo | null> {
    if (!this.authToken) {
      throw new Error('Authentication required to get user region');
    }

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/user-region`);
      
      if (response.status === 404) {
        return null;
      }
      
      return await response.json() as RegionInfo;
    } catch (error) {
      console.error('Failed to get user region:', error);
      throw error;
    }
  }

  /**
   * Set the user's region
   */
  async setUserRegion(regionCode: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('Authentication required to set user region');
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/user-region`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ region_code: regionCode }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to set user region: ${response.statusText}`);
      }
      
      // Clear cache for user region
      this.clearCache();
    } catch (error) {
      console.error('Failed to set user region:', error);
      throw error;
    }
  }

  /**
   * Get region health status
   */
  async getRegionHealth(): Promise<Record<string, string>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
      return await response.json() as Record<string, string>;
    } catch (error) {
      console.error('Failed to get region health:', error);
      throw error;
    }
  }

  /**
   * Lookup user's region from global discovery service
   */
  async lookupUserRegion(email: string): Promise<RegionInfo | null> {
    const cacheKey = `user_${email}`;
    
    if (this.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached.region;
      }
    }

    try {
      // First try local discovery endpoint
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/lookup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );
      
      if (response.status === 404) {
        return null;
      }
      
      const region = await response.json() as RegionInfo;
      
      if (this.cacheEnabled) {
        this.addToCache(cacheKey, region);
      }
      
      return region;
    } catch (error) {
      console.error('Failed to lookup user region:', error);
      return null;
    }
  }

  /**
   * Handle region redirect during login
   */
  async handleLoginResponse(response: any): Promise<any> {
    if (response.status === 'region_redirect') {
      const redirect = response as RegionRedirect;
      
      // Store the redirect information
      localStorage.setItem('region_redirect', JSON.stringify({
        region_code: redirect.region_code,
        region_endpoint: redirect.region_endpoint,
        timestamp: Date.now(),
      }));
      
      // Optionally redirect immediately or return for UI handling
      return redirect;
    }
    
    // Normal successful login
    if (response.token && response.region) {
      // Store user's region for future reference
      localStorage.setItem('user_region', response.region);
    }
    
    return response;
  }

  /**
   * Get the user's stored region from local storage
   */
  getStoredRegion(): string | null {
    return localStorage.getItem('user_region');
  }

  /**
   * Clear stored region data
   */
  clearStoredRegion(): void {
    localStorage.removeItem('user_region');
    localStorage.removeItem('region_redirect');
    this.clearCache();
  }

  /**
   * Detect user's location using browser Geolocation API
   */
  async detectUserLocation(): Promise<LocationCoordinates | null> {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Failed to detect user location:', error);
          resolve(null);
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
        }
      );
    });
  }

  /**
   * Auto-detect and suggest the best region for the user
   */
  async autoDetectRegion(): Promise<RegionInfo | null> {
    try {
      // Try to detect user location
      const location = await this.detectUserLocation();
      
      if (location) {
        // Get suggested regions based on location
        const suggestions = await this.suggestRegions(location);
        if (suggestions.length > 0) {
          // Return the first (closest) healthy region
          return suggestions.find(r => r.status === 'healthy') || suggestions[0];
        }
      }
      
      // Fallback: get all regions and pick the first healthy one
      const regions = await this.getRegions();
      return regions.find(r => r.status === 'healthy') || regions[0] || null;
    } catch (error) {
      console.error('Failed to auto-detect region:', error);
      return null;
    }
  }

  /**
   * Check if a redirect to another region is needed
   */
  checkForRegionRedirect(): RegionRedirect | null {
    const stored = localStorage.getItem('region_redirect');
    if (!stored) return null;

    try {
      const redirect = JSON.parse(stored);
      // Check if redirect is still valid (within last hour)
      if (Date.now() - redirect.timestamp < 60 * 60 * 1000) {
        return redirect;
      }
      // Clear expired redirect
      localStorage.removeItem('region_redirect');
    } catch {
      localStorage.removeItem('region_redirect');
    }
    
    return null;
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
      };
      
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get from cache if valid
   */
  private getFromCache(key: string): CachedRegionLookup | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Add to cache
   */
  private addToCache(key: string, region: RegionInfo): void {
    this.cache.set(key, {
      region,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached data
   */
  private clearCache(): void {
    this.cache.clear();
  }
}

// Create a singleton instance for the application
export const discoveryClient = new DiscoveryClient();

// Helper function to format region display
export function formatRegionDisplay(region: RegionInfo): string {
  return `${region.name} (${region.code.toUpperCase()})`;
}

// Helper function to get region flag emoji (optional)
export function getRegionFlag(regionCode: string): string {
  const flags: Record<string, string> = {
    'au-1': '🇦🇺',
    'us-1': '🇺🇸',
    'uk-1': '🇬🇧',
    'eu-1': '🇪🇺',
    'sg-1': '🇸🇬',
  };
  return flags[regionCode.toLowerCase()] || '🌍';
}