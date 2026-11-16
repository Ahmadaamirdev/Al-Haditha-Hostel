/**
 * Professional Event Bus & Multi-Tab Synchronization Layer
 * 
 * Fires and listens to targeted mutation events (Create, Update, Delete).
 * Eliminates timer-based polling and ensures the UI updates strictly
 * when data actually changes.
 */

export type EntityType = 'allotments' | 'employees' | 'bootcamps' | 'records' | 'notifications' | 'all';

type Listener = () => void;
const listeners = new Map<EntityType, Set<Listener>>();

// Browser BroadcastChannel for cross-tab sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('alhaditha_mutation_bus');
    broadcastChannel.onmessage = (event) => {
      const entity = event.data as EntityType;
      dispatchLocal(entity);
    };
  }
} catch {
  // Graceful fallback for non-supporting environments
}

function dispatchLocal(entity: EntityType): void {
  const targetSets = [listeners.get(entity), listeners.get('all')];
  targetSets.forEach((set) => {
    if (set) {
      set.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error('[EventBus] Listener error:', e);
        }
      });
    }
  });
}

/**
 * Dispatch a mutation notification across the app and all open tabs.
 */
export function notifyMutation(entity: EntityType): void {
  dispatchLocal(entity);
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(entity);
    } catch {
      // Ignore broadcast errors
    }
  }
}

/**
 * Subscribe a React component to entity mutation events.
 * Returns an unsubscribe cleanup function for useEffect.
 */
export function subscribeToMutation(entity: EntityType, callback: Listener): () => void {
  if (!listeners.has(entity)) {
    listeners.set(entity, new Set());
  }
  listeners.get(entity)!.add(callback);

  return () => {
    listeners.get(entity)?.delete(callback);
    if (listeners.get(entity)?.size === 0) {
      listeners.delete(entity);
    }
  };
}
