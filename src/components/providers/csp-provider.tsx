/**
 * CSP Provider - Manages Content Security Policy nonces for secure script execution
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCSPNonce } from '@/lib/utils/csp-nonce';

interface CSPContextValue {
  nonce: string | null;
  isNonceReady: boolean;
  injectNonce: (scriptElement: HTMLScriptElement) => void;
  createScriptWithNonce: (content: string, id?: string) => HTMLScriptElement;
}

const CSPContext = createContext<CSPContextValue | undefined>(undefined);

interface CSPProviderProps {
  children: React.ReactNode;
}

/**
 * CSP Provider Component
 * Manages CSP nonces and provides utilities for secure script injection
 */
export function CSPProvider({ children }: CSPProviderProps) {
  const [nonce, setNonce] = useState<string | null>(null);
  const [isNonceReady, setIsNonceReady] = useState(false);
  const hookNonce = useCSPNonce();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to get nonce from the middleware header
      const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
      
      // Fallback to getting from response headers if available
      let responseNonce = null;
      try {
        // This will only work if the nonce is exposed via a header
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', window.location.href, false);
        xhr.send();
        responseNonce = xhr.getResponseHeader('X-CSP-Nonce');
      } catch {
        // Ignore errors, this is a fallback method
      }

      const finalNonce = metaNonce || responseNonce || hookNonce;
      setNonce(finalNonce);
      setIsNonceReady(true);

      // Add nonce to meta tag for other components to use
      if (finalNonce && !document.querySelector('meta[name="csp-nonce"]')) {
        const meta = document.createElement('meta');
        meta.name = 'csp-nonce';
        meta.content = finalNonce;
        document.head.appendChild(meta);
      }
    } else {
      // Server-side: use hook nonce
      setNonce(hookNonce);
      setIsNonceReady(true);
    }
  }, [hookNonce]);

  /**
   * Inject nonce into a script element
   */
  const injectNonce = (scriptElement: HTMLScriptElement) => {
    if (nonce) {
      scriptElement.setAttribute('nonce', nonce);
    }
  };

  /**
   * Create a script element with proper nonce
   */
  const createScriptWithNonce = (content: string, id?: string): HTMLScriptElement => {
    const script = document.createElement('script');
    if (nonce) {
      script.setAttribute('nonce', nonce);
    }
    if (id) {
      script.id = id;
    }
    script.textContent = content;
    return script;
  };

  const contextValue: CSPContextValue = {
    nonce,
    isNonceReady,
    injectNonce,
    createScriptWithNonce,
  };

  return (
    <CSPContext.Provider value={contextValue}>
      {children}
    </CSPContext.Provider>
  );
}

/**
 * Hook to use CSP context
 */
export function useCSP() {
  const context = useContext(CSPContext);
  if (context === undefined) {
    throw new Error('useCSP must be used within a CSPProvider');
  }
  return context;
}

/**
 * Higher-order component to add nonce support to script components
 */
export function withCSPNonce<T extends { nonce?: string }>(Component: React.ComponentType<T>) {
  return function CSPNonceWrapper(props: Omit<T, 'nonce'>) {
    const { nonce } = useCSP();
    return <Component {...(props as T)} nonce={nonce || undefined} />;
  };
}

/**
 * Component for safely injecting inline scripts with CSP nonce
 */
interface SecureInlineScriptProps {
  children: string;
  id?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function SecureInlineScript({ children, id, onLoad, onError }: SecureInlineScriptProps) {
  const { nonce, isNonceReady } = useCSP();

  useEffect(() => {
    if (!isNonceReady || typeof window === 'undefined') return;

    try {
      const script = document.createElement('script');
      if (nonce) {
        script.setAttribute('nonce', nonce);
      }
      if (id) {
        script.id = id;
      }
      script.textContent = children;
      
      script.onload = () => onLoad?.();
      script.onerror = () => onError?.(new Error('Script failed to load'));

      document.head.appendChild(script);

      // Cleanup function
      return () => {
        const existingScript = document.getElementById(id || '');
        if (existingScript) {
          existingScript.remove();
        }
      };
    } catch (error) {
      onError?.(error as Error);
    }
  }, [children, id, nonce, isNonceReady, onLoad, onError]);

  return null; // This component doesn't render anything
}