/**
 * Industry-standard adapters registry and interfaces.
 * All adapters should implement a minimal, testable interface and expose init/close lifecycle.
 */
export class AdapterRegistry {
    constructor() {
        this.adapters = new Map();
    }
    register(adapter) {
        this.adapters.set(adapter.id, adapter);
    }
    get(id) {
        const a = this.adapters.get(id);
        if (!a)
            throw new Error(`Adapter not found: ${id}`);
        return a;
    }
    async initAll() {
        for (const a of this.adapters.values()) {
            await a.init();
        }
    }
    async closeAll() {
        for (const a of this.adapters.values()) {
            await a.close();
        }
    }
}
