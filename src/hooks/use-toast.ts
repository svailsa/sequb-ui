'use client';

import { useState } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface Toast extends ToastOptions {
  id: string;
}

let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

function addToast(options: ToastOptions) {
  const id = Math.random().toString(36).substr(2, 9);
  const toast = { ...options, id };
  
  toasts = [...toasts, toast];
  listeners.forEach(listener => listener(toasts));
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  listeners.forEach(listener => listener(toasts));
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>(toasts);

  const toast = (options: ToastOptions) => {
    addToast(options);
  };

  // Simple implementation - in a real app you'd want to use a proper toast library
  // like react-hot-toast or sonner
  return { toast };
}