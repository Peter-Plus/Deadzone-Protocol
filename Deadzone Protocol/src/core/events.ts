/** Synchronous broadcasts. Subscription changes take effect immediately; new listeners wait until next emit. */
export class EventBus<Events extends object> {
  private listeners = new Map<keyof Events, Set<(payload: never) => void>>();
  on<K extends keyof Events>(type: K, listener: (payload: Events[K]) => void): () => void {
    let bucket = this.listeners.get(type);
    if (!bucket) { bucket = new Set(); this.listeners.set(type, bucket); }
    const callback = listener as (payload: never) => void;
    bucket.add(callback);
    return () => { bucket.delete(callback); };
  }
  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    const bucket = this.listeners.get(type);
    if (!bucket) return;
    for (const listener of [...bucket]) {
      if (bucket.has(listener)) listener(payload as never);
    }
  }
  clear(): void {
    for (const bucket of this.listeners.values()) bucket.clear();
    this.listeners.clear();
  }
}
