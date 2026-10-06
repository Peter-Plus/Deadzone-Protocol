export type EntityId = number & { readonly __entityId: unique symbol };

/** IDs are unique within one session; references must not survive session replacement. */
export class EntityIds {
  private nextId = 1;
  create(): EntityId {
    if (!Number.isSafeInteger(this.nextId)) throw new Error('EntityId 已耗尽');
    return this.nextId++ as EntityId;
  }
}
