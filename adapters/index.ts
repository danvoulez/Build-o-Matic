/**
 * Industry-standard adapters registry and interfaces.
 * All adapters should implement a minimal, testable interface and expose init/close lifecycle.
 */

export interface Adapter {
  id: string;
  init(): Promise<void>;
  close(): Promise<void>;
}

export interface EmailAdapter extends Adapter {
  send(to: string, subject: string, html: string, text?: string): Promise<{ id: string }>;
}

export interface SlackAdapter extends Adapter {
  post(message: { text: string; channel?: string; blocks?: any[] }): Promise<{ ok: boolean }>;
}

export interface WebhookAdapter extends Adapter {
  send(event: string, payload: Record<string, any>): Promise<{ ok: boolean; status: number }>;
}

export interface QueueAdapter extends Adapter {
  enqueue(queue: string, message: Record<string, any>, options?: { delay?: number }): Promise<void>;
  process(queue: string, handler: (msg: any) => Promise<void>): Promise<void>;
}

export interface StorageAdapter extends Adapter {
  put(bucket: string, key: string, body: Buffer | string, contentType?: string): Promise<{ url: string }>;
  get(bucket: string, key: string): Promise<Buffer>;
  remove(bucket: string, key: string): Promise<void>;
}

export interface DbAdapter extends Adapter {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
  transaction<T>(fn: (db: DbAdapter) => Promise<T>): Promise<T>;
}

export type AnyAdapter =
  | EmailAdapter
  | SlackAdapter
  | WebhookAdapter
  | QueueAdapter
  | StorageAdapter
  | DbAdapter;

export class AdapterRegistry {
  private adapters = new Map<string, AnyAdapter>();

  register<T extends AnyAdapter>(adapter: T): void {
    this.adapters.set(adapter.id, adapter);
  }

  get<T extends AnyAdapter>(id: string): T {
    const a = this.adapters.get(id);
    if (!a) throw new Error(`Adapter not found: ${id}`);
    return a as T;
  }

  async initAll(): Promise<void> {
    for (const a of this.adapters.values()) {
      await a.init();
    }
  }

  async closeAll(): Promise<void> {
    for (const a of this.adapters.values()) {
      await a.close();
    }
  }
}