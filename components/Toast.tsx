"use client";

import React, { useEffect, useState } from "react";
import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = {
  success: (message: string, options?: { title?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      type: "success",
      message,
      title: options?.title || "Success",
      duration: options?.duration ?? 4000,
    });
  },
  error: (message: string, options?: { title?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      type: "error",
      message,
      title: options?.title || "Error",
      duration: options?.duration ?? 5000,
    });
  },
  warning: (message: string, options?: { title?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      type: "warning",
      message,
      title: options?.title || "Warning",
      duration: options?.duration ?? 4000,
    });
  },
  info: (message: string, options?: { title?: string; duration?: number }) => {
    return useToastStore.getState().addToast({
      type: "info",
      message,
      title: options?.title || "Information",
      duration: options?.duration ?? 4000,
    });
  },
  dismiss: (id: string) => {
    useToastStore.getState().removeToast(id);
  },
  clear: () => {
    useToastStore.getState().clearToasts();
  },
};

const toastConfig: Record<
  ToastType,
  {
    borderAccent: string;
    iconBg: string;
    iconColor: string;
    progressColor: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    borderAccent: "border-l-emerald-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    progressColor: "bg-emerald-500",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
  error: {
    borderAccent: "border-l-rose-500",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    progressColor: "bg-rose-500",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    borderAccent: "border-l-amber-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    progressColor: "bg-amber-500",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    borderAccent: "border-l-sky-500",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    progressColor: "bg-sky-500",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
};

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [progress, setProgress] = useState(100);
  const duration = item.duration ?? 4000;
  const config = toastConfig[item.type];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onClose();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative flex items-start gap-3 rounded-xl border border-slate-200/90 border-l-4 ${config.borderAccent} bg-white/95 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all duration-200 animate-toast-in overflow-hidden`}
    >
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {item.title && (
          <h4 className="text-sm font-semibold text-slate-900 leading-snug">
            {item.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words mt-0.5">
          {item.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
        <div
          className={`h-full ${config.progressColor} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[99999] flex w-full max-w-sm flex-col gap-2.5 pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onClose={() => removeToast(item.id)} />
      ))}
    </div>
  );
}
