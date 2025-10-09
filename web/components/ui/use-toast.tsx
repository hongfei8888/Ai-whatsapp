'use client';

import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

export function ToastProviderWithViewport({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const message = title ?? description ?? '通知';
    const opts = title && description ? { description } : undefined;

    switch (variant) {
      case 'success':
        return sonnerToast.success(message, opts);
      case 'destructive':
        return sonnerToast.error(message, opts);
      default:
        return sonnerToast(message, opts);
    }
  };

  return { toast };
}
