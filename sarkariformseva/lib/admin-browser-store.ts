"use client";

import { useSyncExternalStore } from "react";

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

export const adminFormsStorageKey = "sarkariformseva.admin.forms";

function getSnapshot<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  try {
    const value = window.localStorage.getItem(key);
    const parsed = value ? (JSON.parse(value) as T) : fallback;
    cache.set(key, parsed);
    return parsed;
  } catch {
    cache.set(key, fallback);
    return fallback;
  }
}

function subscribe(key: string, listener: () => void): () => void {
  const subscribers = listeners.get(key) ?? new Set<() => void>();
  subscribers.add(listener);
  listeners.set(key, subscribers);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    cache.delete(key);
    listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    subscribers.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useAdminValue<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => getSnapshot(key, fallback),
    () => fallback,
  );
}

export function writeAdminValue<T>(key: string, value: T): void {
  cache.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage can be unavailable in private or restricted contexts.
  }
  listeners.get(key)?.forEach((listener) => listener());
}
